# Squid — Electron Migration Guide

This document explains every file in this scaffold and the exact order of
operations to go from your existing Next.js app to a working desktop app.

---

## 📁 What's in this scaffold

```
electron/                         ← Electron layer (new, doesn't touch src/)
  main.ts                         ← App entry: boots Next.js, creates window
  preload.ts                      ← IPC bridge: exposes window.squid to renderer
  tray.ts                         ← System tray icon + context menu
  updater.ts                      ← electron-updater auto-update setup
  ipc/
    filesystem.ts                 ← fs:* IPC handlers
    mcp.ts                        ← mcp:* IPC handlers (child process manager)
  squid.d.ts                      ← TypeScript types for window.squid

src-patches/                      ← Drop-in replacements for src/ files
  proxy.ts                        ← Updated middleware (desktop bypass)
  next.config.desktop.mjs         ← next.config additions
  drizzle.config.sqlite.ts        ← SQLite drizzle-kit config
  package.json.additions.js       ← Annotated package.json changes
  lib/
    db/
      db.sqlite.ts                ← Replaces db.pg.ts
      schema.sqlite.ts            ← Replaces schema.ts (SQLite types)
    cache/
      cache.local.ts              ← Replaces ioredis cache client
    file-storage/
      storage.local.ts            ← Replaces S3 / @vercel/blob
  app/api/storage/[...path]/
    route.ts                      ← Serves local uploaded files over HTTP
  hooks/
    useDesktop.ts                 ← React hooks for window.squid

electron-builder.yml              ← Build config: DMG + MAS targets
tsconfig.electron.json            ← TS config for electron/ folder
build-resources/
  entitlements.mac.plist          ← macOS hardened runtime entitlements
  entitlements.mac.inherit.plist  ← Inherited entitlements for helper processes
```

---

## 🗓️ Migration order (do in this sequence)

### Step 1 — Install new dependencies

```bash
pnpm add electron electron-updater electron-log electron-store get-port better-sqlite3 mime-types
pnpm add -D electron-builder concurrently wait-on @types/better-sqlite3 @types/mime-types
```

Remove packages no longer needed:
```bash
pnpm remove ioredis @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @vercel/blob pg
```

---

### Step 2 — Add the electron/ layer

Copy the entire `electron/` folder from this scaffold into your repo root.

```
your-repo/
├── electron/         ← copy here
├── src/
├── public/
└── package.json
```

Copy `tsconfig.electron.json` and `electron-builder.yml` to your repo root.
Copy `build-resources/` to your repo root.

---

### Step 3 — Update package.json

Open `src-patches/package.json.additions.js` and apply the listed changes:

1. Rename `"name"` to `"squid"`
2. Add `"main": "dist-electron/main.js"`
3. Merge the new `scripts`
4. Merge the new `dependencies` and `devDependencies`
5. Update `pnpm.onlyBuiltDependencies` to include `"better-sqlite3"`

---

### Step 4 — Swap the database layer

1. Copy `src-patches/lib/db/db.sqlite.ts` → `src/lib/db/db.sqlite.ts`
2. Copy `src-patches/lib/db/schema.sqlite.ts` → `src/lib/db/schema.sqlite.ts`
3. Copy `src-patches/drizzle.config.sqlite.ts` → `drizzle.config.sqlite.ts` (root)
4. In every file that imports from `./db.pg` or `drizzle-orm/node-postgres`,
   update to import from `./db.sqlite` and `drizzle-orm/better-sqlite3`.
5. In every file that imports your schema, update any `pgTable`-specific
   column references if necessary (most query code is unaffected).

**Push the schema to SQLite:**
```bash
pnpm drizzle-kit push --config drizzle.config.sqlite.ts
```

---

### Step 5 — Swap the cache layer

1. Copy `src-patches/lib/cache/cache.local.ts` → `src/lib/cache/cache.local.ts`
2. Find all files importing your Redis/ioredis cache client and update them
   to import `{ cache }` or `{ redis }` from `./cache.local`.

The `LocalCache` class exposes the same async API (`get`, `set`, `del`,
`exists`, `keys`, `flushall`, `incr`, `expire`, `ttl`) so most code
works with just an import path change.

---

### Step 6 — Swap file storage

1. Copy `src-patches/lib/file-storage/storage.local.ts`
   → `src/lib/file-storage/storage.local.ts`
2. Copy `src-patches/app/api/storage/[...path]/route.ts`
   → `src/app/api/storage/[...path]/route.ts`
3. Update all `put()`/`del()`/`list()` call sites to import from `storage.local`.
   The function signatures match `@vercel/blob` for easy drop-in.

---

### Step 7 — Update middleware

Replace `src/proxy.ts` with `src-patches/proxy.ts`.

The only change: when `NEXT_PUBLIC_SQUID_PORT` is set (i.e. running inside
Electron), all auth redirects are skipped.

---

### Step 8 — Update next.config

Merge the contents of `src-patches/next.config.desktop.mjs` into your
existing `next.config.mjs` / `next.config.ts`:

- Add `output: "standalone"`
- Add the `webpack` externals for `better-sqlite3` and `electron`
- Add the `images.remotePatterns` for local storage
- Add the `env.NEXT_PUBLIC_SQUID_PORT` passthrough

---

### Step 9 — Add Electron userdata path to main process

In `electron/main.ts`, before calling `startNextServer()`, add:

```ts
// Tell Next.js where to store the SQLite DB and uploads
process.env.SQUID_USERDATA = app.getPath("userData");
```

This is already included in the scaffold's `main.ts`.

---

### Step 10 — Copy type declarations

Copy `electron/squid.d.ts` to `src/types/squid.d.ts` (or wherever your
global types live). This gives you full IntelliSense for `window.squid.*`
in your React components.

Copy `src-patches/hooks/useDesktop.ts` → `src/hooks/useDesktop.ts`.

---

### Step 11 — Dev test run

```bash
# Terminal 1: start Next.js
pnpm dev

# Terminal 2: once Next.js is ready, launch Electron
NEXT_PUBLIC_SQUID_PORT=3000 pnpm electron:start
```

Or use the combined script:
```bash
pnpm dev:desktop
```

---

### Step 12 — Production build

```bash
# Build Next.js (standalone) + compile Electron layer + package as DMG
pnpm build:desktop

# Output:
# release/Squid-1.26.0-arm64.dmg   ← Apple Silicon
# release/Squid-1.26.0-x64.dmg     ← Intel
```

---

## ⚠️ Known gotchas

### better-auth in desktop mode
`better-auth` still works — the middleware just stops redirecting to
`/sign-in`. On first launch, auto-create a local user in `main.ts` or
add a simple "first launch" setup screen that creates the account.

### MCP stdio servers on Mac App Store
MAS sandbox restricts `child_process`. Stdio MCP servers won't work in
the MAS build. Options:
- Ship only the DMG for full MCP support
- Use HTTP/SSE MCP servers in the MAS build (they work fine)

### Native modules (better-sqlite3)
`better-sqlite3` is a native Node.js addon. After installing, run:
```bash
./node_modules/.bin/electron-rebuild -f -w better-sqlite3
```
Or add a `postinstall` script:
```json
"postinstall": "electron-rebuild -f -w better-sqlite3 && tsx scripts/postinstall.ts"
```

### Windows / Linux (future)
All paths use `path.join()` so Windows is supported if you ever target it.
Change `titleBarStyle: "hiddenInset"` to `"default"` for Windows/Linux.

---

## 🔐 macOS code signing checklist (before shipping)

1. Enroll in Apple Developer Program ($99/yr)
2. Create an **Application** certificate in Keychain Access
3. Create a **Developer ID Application** certificate for DMG notarization
4. Set env vars for electron-builder:
   ```
   APPLE_ID=you@example.com
   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   APPLE_TEAM_ID=XXXXXXXXXX
   ```
5. Set `notarize: true` in `electron-builder.yml`
6. Run `pnpm dist:dmg`