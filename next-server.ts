import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import next from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development";
// Pick a random-ish high port to avoid conflicts
const PORT = 57322;

let serverStarted = false;

export function getNextPort(): number {
  return PORT;
}

export async function waitForServer(
  port: number,
  timeoutMs = 30_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`http://localhost:${port}/ping`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error(`Next.js server did not start within ${timeoutMs}ms`);
}

export async function startNextServer(): Promise<void> {
  if (serverStarted) return;
  serverStarted = true;

  // In dev: Next.js app root is the project root (two levels up from electron/)
  // In prod: Next.js standalone output is bundled alongside the Electron app
  const appDir = isDev
    ? path.resolve(__dirname, "../")
    : path.resolve(process.resourcesPath, "app");

  // Set env vars that Next.js / better-auth / drizzle depend on
  // SQUID_DATA_PATH is where SQLite db + uploads live (macOS: ~/Library/Application Support/Squid)
  process.env.SQUID_DATA_PATH = getSquidDataPath();
  process.env.SQUID_DESKTOP = "1"; // flag for desktop-specific code paths
  process.env.PORT = String(PORT);

  const nextApp = next({
    dev: isDev,
    dir: appDir,
    port: PORT,
    // In production, point to the standalone build
    ...(isDev
      ? {}
      : {
          conf: require(path.join(appDir, ".next/required-server-files.json"))
            .config,
        }),
  });

  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const server = createServer((req, res) => {
    handle(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`[Squid] Next.js server running on http://localhost:${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
}

function getSquidDataPath(): string {
  // Electron app.getPath('userData') isn't available in this module (runs before app ready)
  // so we derive it manually. This matches what Electron would return.
  const home = process.env.HOME || process.env.USERPROFILE || "";
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Squid");
  } else if (process.platform === "win32") {
    return path.join(process.env.APPDATA || home, "Squid");
  }
  return path.join(home, ".config", "Squid");
}
