import { Tray, Menu, app, BrowserWindow, nativeImage } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray: Tray | null = null;

export function setupTray(
  mainWindow: BrowserWindow | null,
  port: number,
): void {
  // Use a template image so macOS auto-inverts it for dark/light menu bar
  const iconPath = path.join(__dirname, "../src/app/favicon-16x16.png");
  const icon = nativeImage.createFromPath(iconPath);
  // Mark as template so macOS menu bar renders it correctly
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip("Squid");

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: "Open Squid",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            // Window was closed; re-create it
            const win = new BrowserWindow({
              width: 1400,
              height: 900,
              titleBarStyle: "hiddenInset",
              webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
              },
            });
            win.loadURL(`http://127.0.0.1:${port}`);
          }
        },
      },
      { type: "separator" },
      {
        label: "New Chat",
        click: () => {
          mainWindow?.show();
          mainWindow?.webContents.executeJavaScript(
            `window.location.href = '/'`,
          );
        },
      },
      { type: "separator" },
      {
        label: `Version ${app.getVersion()}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Quit Squid",
        accelerator: "Command+Q",
        click: () => app.quit(),
      },
    ]);

  tray.setContextMenu(buildMenu());

  // Single-click on the tray icon toggles the window on macOS
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

export function destroyTray() {
  tray?.destroy();
  tray = null;
}
