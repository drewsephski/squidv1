import { autoUpdater } from "electron-updater";
import { ipcMain, BrowserWindow } from "electron";
import log from "electron-log";

export function setupAutoUpdater() {
  // Use electron-log so update events appear in ~/Library/Logs/Squid/
  autoUpdater.logger = log;
  (autoUpdater.logger as typeof log).transports.file.level = "info";

  // Don't auto-install — let the user decide
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoDownload = true;

  // ── Events → renderer ────────────────────────────────────────────────────────
  autoUpdater.on("update-available", (info) => {
    broadcast("app:updateAvailable", info);
  });

  autoUpdater.on("update-downloaded", (info) => {
    broadcast("app:updateDownloaded", info);
  });

  autoUpdater.on("error", (err) => {
    log.error("Auto-updater error:", err);
    broadcast("app:updateError", { message: err.message });
  });

  // ── IPC handlers ─────────────────────────────────────────────────────────────
  ipcMain.handle("app:checkForUpdates", () => autoUpdater.checkForUpdates());

  ipcMain.handle("app:installUpdate", () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle("app:getVersion", () => {
    // Dynamically import to avoid circular dep on app
    return import("electron").then(({ app }) => app.getVersion());
  });

  // Check for updates on startup (silently)
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.warn("Update check failed (non-fatal):", err.message);
  });
}

function broadcast(channel: string, payload: unknown) {
  BrowserWindow.getAllWindows().forEach((win) =>
    win.webContents.send(channel, payload),
  );
}
