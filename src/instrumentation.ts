import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // Skip migrations for now - use drizzle-kit push instead
      console.log(
        "⏭️  Skipping migrations - use 'pnpm drizzle-kit push --config drizzle.config.sqlite.ts' to update schema",
      );

      // Init MCP manager on all environments.
      // Cached servers are available instantly; new servers connect in background.
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();
    }
  }
}
