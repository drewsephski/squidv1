/**
 * squid.d.ts
 *
 * Drop this file into src/types/ so your Next.js frontend
 * gets full type-safety when calling window.squid.*
 */

interface SquidFsEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface SquidMcpStatus {
  status: "starting" | "running" | "error" | "stopped";
  startedAt?: Date;
}

interface SquidMcpLog {
  level: "info" | "error";
  message: string;
}

interface SquidMcpServerConfig {
  type: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

interface SquidAPI {
  // ── Environment ──────────────────────────────────────────────────────────────
  isDesktop: true;
  platform: NodeJS.Platform;

  // ── Secure storage ───────────────────────────────────────────────────────────
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (ciphertext: string) => Promise<string>;

  // ── File system ──────────────────────────────────────────────────────────────
  fs: {
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, data: string) => Promise<{ success: true }>;
    deleteFile: (filePath: string) => Promise<{ success: true }>;
    listDir: (dirPath: string) => Promise<SquidFsEntry[]>;
    showOpenDialog: (
      options: object,
    ) => Promise<{ canceled: boolean; filePaths: string[] }>;
    showSaveDialog: (
      options: object,
    ) => Promise<{ canceled: boolean; filePath?: string }>;
    getAppDataPath: () => Promise<string>;
  };

  // ── MCP server management ────────────────────────────────────────────────────
  mcp: {
    start: (
      serverId: string,
      config: SquidMcpServerConfig,
    ) => Promise<{ success: boolean; error?: string }>;
    stop: (serverId: string) => Promise<{ success: boolean; error?: string }>;
    status: (serverId: string) => Promise<SquidMcpStatus>;
    listRunning: () => Promise<Array<{ id: string } & SquidMcpStatus>>;
    /** Returns a cleanup function — call it to unsubscribe */
    onLog: (
      serverId: string,
      callback: (log: SquidMcpLog) => void,
    ) => () => void;
  };

  // ── App ───────────────────────────────────────────────────────────────────────
  app: {
    getVersion: () => Promise<string>;
    checkForUpdates: () => Promise<unknown>;
    installUpdate: () => Promise<void>;
    onUpdateAvailable: (callback: (info: unknown) => void) => void;
  };
}

declare global {
  interface Window {
    /**
     * Defined only when running inside the Squid desktop app (Electron).
     * Always guard with: `if (window.squid?.isDesktop) { ... }`
     */
    squid?: SquidAPI;
  }
}

export {};