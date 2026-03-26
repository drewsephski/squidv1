/**
 * src/app/api/storage/[...path]/route.ts
 *
 * Serves files stored locally by storage.local.ts.
 * Replaces direct S3/Vercel Blob URLs with /api/storage/<pathname>.
 *
 * Add this file to your existing src/app/api/storage/ directory.
 */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { lookup as mimeLookup } from "mime-types";

const isDesktop = process.env.NEXT_PUBLIC_SQUID_PORT;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!isDesktop) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const { readFile } = await import("@/lib/file-storage/storage.local");
    const resolvedParams = await params;
    const pathname = resolvedParams.path.join("/");

    // Basic path traversal protection
    const normalized = path.normalize(pathname);
    if (normalized.startsWith("..") || normalized.includes("/../")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = await readFile(normalized);
    const contentType = (mimeLookup(pathname) ||
      "application/octet-stream") as string;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        // Cache for 1 hour on desktop (files are local & stable)
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
