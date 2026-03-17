import { ipcMain, app, dialog } from "electron";
import fs from "fs/promises";
import path from "path";

/**
 * All file-system operations the renderer may request.
 * Paths are sandboxed to app.getPath("userData") unless the user
 * explicitly picks a location via dialog.
 */
export function registerFilesystemHandlers() {
  const userDataPath = app.getPath("userData");

  // Helper: resolve a relative path safely inside userData
  function safePath(relativePath: string): string {
    const resolved = path.resolve(userDataPath, relativePath);
    if (!resolved.startsWith(userDataPath)) {
      throw new Error(`Path traversal attempt blocked: ${relativePath}`);
    }
    return resolved;
  }

  // ── Read a file ─────────────────────────────────────────────────────────────
  ipcMain.handle("fs:readFile", async (_e, filePath: string) => {
    const fullPath = safePath(filePath);
    return fs.readFile(fullPath, "utf-8");
  });

  // ── Write a file (creates parent dirs if needed) ────────────────────────────
  ipcMain.handle("fs:writeFile", async (_e, filePath: string, data: string) => {
    const fullPath = safePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data, "utf-8");
    return { success: true };
  });

  // ── Delete a file ───────────────────────────────────────────────────────────
  ipcMain.handle("fs:deleteFile", async (_e, filePath: string) => {
    const fullPath = safePath(filePath);
    await fs.unlink(fullPath);
    return { success: true };
  });

  // ── List directory contents ─────────────────────────────────────────────────
  ipcMain.handle("fs:listDir", async (_e, dirPath: string) => {
    const fullPath = safePath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(dirPath, e.name),
    }));
  });

  // ── Open file picker dialog ─────────────────────────────────────────────────
  ipcMain.handle(
    "fs:showOpenDialog",
    async (_e, options: Electron.OpenDialogOptions) => {
      return dialog.showOpenDialog(options);
    },
  );

  // ── Save file picker dialog ─────────────────────────────────────────────────
  ipcMain.handle(
    "fs:showSaveDialog",
    async (_e, options: Electron.SaveDialogOptions) => {
      return dialog.showSaveDialog(options);
    },
  );

  // ── Get the app's userData path ─────────────────────────────────────────────
  // Useful for Next.js API routes that need to know where to store data
  ipcMain.handle("fs:getAppDataPath", () => userDataPath);
}
