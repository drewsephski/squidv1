import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { z } from "zod";
import { workflowRunRepository } from "lib/db/repository";

// GET /api/workflow-run/[id] - Get a specific workflow run
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const run = await workflowRunRepository.selectByIdWithDetails(params.id);
    if (!run) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this run
    const hasAccess = await workflowRunRepository.checkAccess(
      params.id,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error fetching workflow run:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow run" },
      { status: 500 },
    );
  }
}

// PUT /api/workflow-run/[id] - Update a workflow run
const updateWorkflowRunSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z
    .enum(["running", "completed", "failed", "cancelled"] as const)
    .optional(),
  output: z.record(z.string(), z.any()).optional(),
  error: z
    .object({
      name: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this run
    const hasAccess = await workflowRunRepository.checkAccess(
      params.id,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWorkflowRunSchema.parse(body);

    // If status is being changed to completed/failed/cancelled, set endedAt
    const updates: any = { ...validatedData };
    if (validatedData.status && validatedData.status !== "running") {
      updates.endedAt = new Date();
    }

    const run = await workflowRunRepository.update(params.id, updates);

    return NextResponse.json(run);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating workflow run:", error);
    return NextResponse.json(
      { error: "Failed to update workflow run" },
      { status: 500 },
    );
  }
}

// DELETE /api/workflow-run/[id] - Delete a workflow run
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this run
    const hasAccess = await workflowRunRepository.checkAccess(
      params.id,
      session.user.id,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await workflowRunRepository.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow run:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow run" },
      { status: 500 },
    );
  }
}
