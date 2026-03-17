/**
 * useDesktop.ts
 *
 * Drop this in src/hooks/
 *
 * Provides type-safe access to window.squid from any React component.
 * Works with SSR — always returns isDesktop=false on the server.
 */
"use client";

import { useEffect, useState, useCallback } from "react";

// ── Environment detection ─────────────────────────────────────────────────────

export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.squid?.isDesktop);
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    if (window.squid?.isDesktop) {
      setIsDesktop(true);
      window.squid.app.getVersion().then(setAppVersion);
    }
  }, []);

  return { isDesktop, appVersion, squid: window.squid ?? null };
}

// ── File system hook ──────────────────────────────────────────────────────────

export function useSquidFs() {
  const fs = typeof window !== "undefined" ? window.squid?.fs : null;

  const openFilePicker = useCallback(
    async (options?: {
      filters?: Array<{ name: string; extensions: string[] }>;
      properties?: Array<"openFile" | "openDirectory" | "multiSelections">;
    }) => {
      if (!fs) return null;
      const result = await fs.showOpenDialog({
        properties: options?.properties ?? ["openFile"],
        filters: options?.filters,
      });
      if (result.canceled) return null;
      return result.filePaths;
    },
    [fs],
  );

  const saveFilePicker = useCallback(
    async (options?: {
      defaultPath?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => {
      if (!fs) return null;
      const result = await fs.showSaveDialog(options ?? {});
      if (result.canceled) return null;
      return result.filePath ?? null;
    },
    [fs],
  );

  return { fs, openFilePicker, saveFilePicker };
}

// ── Update notification hook ──────────────────────────────────────────────────

export function useSquidUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<unknown>(null);

  useEffect(() => {
    if (!window.squid?.isDesktop) return;
    window.squid.app.onUpdateAvailable((info) => {
      setUpdateAvailable(true);
      setUpdateInfo(info);
    });
  }, []);

  const installUpdate = useCallback(() => {
    window.squid?.app.installUpdate();
  }, []);

  return { updateAvailable, updateInfo, installUpdate };
}

// ── MCP process hook ──────────────────────────────────────────────────────────

export function useSquidMcp(serverId: string) {
  const [status, setStatus] = useState<
    "stopped" | "starting" | "running" | "error"
  >("stopped");
  const [logs, setLogs] = useState<Array<{ level: string; message: string }>>(
    [],
  );

  useEffect(() => {
    if (!window.squid?.isDesktop) return;

    // Poll status every 3s
    const interval = setInterval(async () => {
      const s = await window.squid!.mcp.status(serverId);
      setStatus(s.status);
    }, 3000);

    // Subscribe to live logs
    const cleanup = window.squid.mcp.onLog(serverId, (log) => {
      setLogs((prev) => [...prev.slice(-199), log]); // keep last 200 lines
    });

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [serverId]);

  const start = useCallback(
    async (config: unknown) => {
      if (!window.squid?.isDesktop) return;
      setStatus("starting");
      await window.squid.mcp.start(serverId, config as never);
    },
    [serverId],
  );

  const stop = useCallback(async () => {
    if (!window.squid?.isDesktop) return;
    await window.squid.mcp.stop(serverId);
    setStatus("stopped");
  }, [serverId]);

  return { status, logs, start, stop };
}
