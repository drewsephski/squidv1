import { NextRequest, NextResponse } from "next/server";
import { getSession } from "lib/auth/server";
import { z } from "zod";
import { workflowRunRepository } from "lib/db/repository";
import { WorkflowRunStatus } from "app-types/workflow";

// GET /api/workflow-run - Get all workflow runs for the authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const runs = await workflowRunRepository.selectByUserId(session.user.id);

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow runs" },
      { status: 500 },
    );
  }
}

// POST /api/workflow-run - Create a new workflow run
const createWorkflowRunSchema = z.object({
  workflowId: z.string().uuid(),
  title: z.string().min(1).max(255),
  input: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWorkflowRunSchema.parse(body);

    const run = await workflowRunRepository.insert({
      workflowId: validatedData.workflowId,
      userId: session.user.id,
      title: validatedData.title,
      status: "running" as WorkflowRunStatus,
      input: validatedData.input,
      metadata: validatedData.metadata,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating workflow run:", error);
    return NextResponse.json(
      { error: "Failed to create workflow run" },
      { status: 500 },
    );
  }
}
