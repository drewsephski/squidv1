/**
 * preload.ts
 *
 * Runs in a privileged context with access to both Node and the renderer.
 * Exposes a controlled API to the Next.js frontend via `window.squid`.
 * Never expose raw ipcRenderer — only specific named channels.
 */
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("squid", {
  // ── Environment ────────────────────────────────────────────────────────────
  isDesktop: true,
  platform: process.platform,

  // ── Secure storage (API keys etc.) ─────────────────────────────────────────
  encrypt: (plaintext: string) =>
    ipcRenderer.invoke("safeStorage:encrypt", plaintext),
  decrypt: (ciphertext: string) =>
    ipcRenderer.invoke("safeStorage:decrypt", ciphertext),

  // ── File system ────────────────────────────────────────────────────────────
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke("fs:readFile", filePath),
    writeFile: (filePath: string, data: string) =>
      ipcRenderer.invoke("fs:writeFile", filePath, data),
    deleteFile: (filePath: string) =>
      ipcRenderer.invoke("fs:deleteFile", filePath),
    listDir: (dirPath: string) => ipcRenderer.invoke("fs:listDir", dirPath),
    showOpenDialog: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke("fs:showOpenDialog", options),
    showSaveDialog: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke("fs:showSaveDialog", options),
    getAppDataPath: () => ipcRenderer.invoke("fs:getAppDataPath"),
  },

  // ── MCP server process management ──────────────────────────────────────────
  mcp: {
    start: (serverId: string, config: unknown) =>
      ipcRenderer.invoke("mcp:start", serverId, config),
    stop: (serverId: string) => ipcRenderer.invoke("mcp:stop", serverId),
    status: (serverId: string) => ipcRenderer.invoke("mcp:status", serverId),
    listRunning: () => ipcRenderer.invoke("mcp:listRunning"),
    onLog: (
      serverId: string,
      callback: (log: { level: string; message: string }) => void,
    ) => {
      const channel = `mcp:log:${serverId}`;
      const listener = (_: unknown, log: { level: string; message: string }) =>
        callback(log);
      ipcRenderer.on(channel, listener);
      // Return cleanup fn
      return () => ipcRenderer.removeListener(channel, listener);
    },
  },

  // ── App-level actions ──────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),
    installUpdate: () => ipcRenderer.invoke("app:installUpdate"),
    onUpdateAvailable: (callback: (info: unknown) => void) => {
      ipcRenderer.on("app:updateAvailable", (_e, info) => callback(info));
    },
  },
});

// Type declarations for window.squid — copy this into a .d.ts in your src/types/
// See: electron/squid.d.ts
