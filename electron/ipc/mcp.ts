import { ipcMain, BrowserWindow } from "electron";
import { spawn, ChildProcess } from "child_process";

interface McpProcess {
  process: ChildProcess;
  status: "starting" | "running" | "error" | "stopped";
  startedAt: Date;
}

// In-memory registry of running MCP server child processes
const mcpProcesses = new Map<string, McpProcess>();

export function registerMcpHandlers() {
  // ── Start an MCP server ──────────────────────────────────────────────────────
  ipcMain.handle(
    "mcp:start",
    async (_e, serverId: string, config: McpServerConfig) => {
      if (mcpProcesses.has(serverId)) {
        return { success: false, error: "Already running" };
      }

      try {
        const entry: McpProcess = {
          process: null as unknown as ChildProcess,
          status: "starting",
          startedAt: new Date(),
        };
        mcpProcesses.set(serverId, entry);

        const child = spawnMcpProcess(config);
        entry.process = child;

        child.on("spawn", () => {
          entry.status = "running";
          broadcastLog(serverId, "info", `MCP server ${serverId} started`);
        });

        child.on("error", (err) => {
          entry.status = "error";
          broadcastLog(serverId, "error", `MCP server error: ${err.message}`);
        });

        child.on("exit", (code) => {
          entry.status = "stopped";
          mcpProcesses.delete(serverId);
          broadcastLog(
            serverId,
            "info",
            `MCP server ${serverId} exited (code ${code})`,
          );
        });

        child.stderr?.on("data", (data: Buffer) => {
          broadcastLog(serverId, "error", data.toString().trim());
        });

        child.stdout?.on("data", (data: Buffer) => {
          broadcastLog(serverId, "info", data.toString().trim());
        });

        return { success: true };
      } catch (err: unknown) {
        mcpProcesses.delete(serverId);
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  // ── Stop an MCP server ───────────────────────────────────────────────────────
  ipcMain.handle("mcp:stop", async (_e, serverId: string) => {
    const entry = mcpProcesses.get(serverId);
    if (!entry) return { success: false, error: "Not running" };

    entry.process.kill("SIGTERM");
    mcpProcesses.delete(serverId);
    return { success: true };
  });

  // ── Get status of a single server ────────────────────────────────────────────
  ipcMain.handle("mcp:status", async (_e, serverId: string) => {
    const entry = mcpProcesses.get(serverId);
    if (!entry) return { status: "stopped" };
    return { status: entry.status, startedAt: entry.startedAt };
  });

  // ── List all running servers ──────────────────────────────────────────────────
  ipcMain.handle("mcp:listRunning", async () => {
    return Array.from(mcpProcesses.entries()).map(([id, entry]) => ({
      id,
      status: entry.status,
      startedAt: entry.startedAt,
    }));
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface McpServerConfig {
  type: "stdio" | "sse" | "http";
  command?: string; // for stdio: e.g. "npx"
  args?: string[]; // for stdio: e.g. ["-y", "@modelcontextprotocol/server-filesystem"]
  env?: Record<string, string>;
  url?: string; // for sse/http
}

function spawnMcpProcess(config: McpServerConfig): ChildProcess {
  if (config.type === "stdio") {
    if (!config.command) throw new Error("stdio MCP config requires `command`");

    return spawn(config.command, config.args ?? [], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...config.env },
      shell: false,
    });
  }

  // For SSE/HTTP MCP servers: the connection is managed by @modelcontextprotocol/sdk
  // over HTTP — no child process needed. Return a noop placeholder.
  throw new Error(
    `MCP type '${config.type}' does not require a child process — ` +
      `connect via the HTTP transport in your Next.js API route.`,
  );
}

/** Push a log line to all renderer windows on the per-server channel */
function broadcastLog(
  serverId: string,
  level: "info" | "error",
  message: string,
) {
  const channel = `mcp:log:${serverId}`;
  BrowserWindow.getAllWindows().forEach((win) =>
    win.webContents.send(channel, { level, message }),
  );
}

/** Kill all MCP processes on app quit */
export function teardownMcpProcesses() {
  for (const [, entry] of mcpProcesses) {
    try {
      entry.process.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  mcpProcesses.clear();
}
