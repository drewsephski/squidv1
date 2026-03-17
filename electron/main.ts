import {
  app,
  BrowserWindow,
  shell,
  nativeTheme,
  safeStorage,
  ipcMain,
} from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import next from "next";
import { setupTray } from "./tray.js";
import { registerFilesystemHandlers } from "./ipc/filesystem.js";
import { registerMcpHandlers } from "./ipc/mcp.js";
import { setupAutoUpdater } from "./updater.js";
import getPort from "get-port";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

let mainWindow: BrowserWindow | null = null;
let nextPort = 3000;

// ─── Boot embedded Next.js server ────────────────────────────────────────────
async function startNextServer(): Promise<number> {
  const port = await getPort({ port: 3000 });
  // In production, __dirname is inside app.asar; Next.js lives one level up
  const appDir = isDev
    ? path.join(__dirname, "../")
    : path.join(process.resourcesPath, "app");

  const nextApp = next({
    dev: isDev,
    dir: appDir,
    port,
    customServer: true,
  });

  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  await new Promise<void>((resolve) =>
    createServer((req, res) => handle(req, res)).listen(
      port,
      "127.0.0.1",
      resolve,
    ),
  );

  console.log(`[Squid] Next.js ready on http://127.0.0.1:${port}`);
  return port;
}

// ─── BrowserWindow ────────────────────────────────────────────────────────────
function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    // macOS: traffic-light buttons inset inside the toolbar
    titleBarStyle: "hiddenInset",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0a0a0a" : "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Required so preload can call ipcRenderer
      sandbox: false,
    },
    show: false,
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  nextPort = await startNextServer();

  // Pass port to Next.js environment (useful for API routes that need self-calls)
  process.env.SQUID_PORT = String(nextPort);
  process.env.NEXT_PUBLIC_SQUID_PORT = String(nextPort);

  createWindow(nextPort);
  setupTray(mainWindow, nextPort);
  registerFilesystemHandlers();
  registerMcpHandlers();

  if (!isDev && !isTest) setupAutoUpdater();

  // macOS: re-open window when clicking the dock icon
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(nextPort);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── Secure API key storage via macOS Keychain ───────────────────────────────
ipcMain.handle("safeStorage:encrypt", (_e, plaintext: string) => {
  if (!safeStorage.isEncryptionAvailable()) return plaintext;
  return safeStorage.encryptString(plaintext).toString("base64");
});

ipcMain.handle("safeStorage:decrypt", (_e, ciphertext: string) => {
  if (!safeStorage.isEncryptionAvailable()) return ciphertext;
  return safeStorage.decryptString(Buffer.from(ciphertext, "base64"));
});

export { mainWindow };
