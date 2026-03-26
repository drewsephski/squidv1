import { getSession } from "auth/server";
import { createWorkflowExecutor } from "lib/ai/workflow/executor/workflow-executor";
import { workflowRepository, workflowRunRepository } from "lib/db/repository";
import { encodeWorkflowEvent } from "lib/ai/workflow/shared.workflow";
import logger from "logger";
import { colorize } from "consola/utils";
import { safeJSONParse, toAny } from "lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { query } = await request.json();
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const hasAccess = await workflowRepository.checkAccess(id, session.user.id);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  const workflow = await workflowRepository.selectStructureById(id);
  if (!workflow) {
    return new Response("Workflow not found", { status: 404 });
  }

  const wfLogger = logger.withDefaults({
    message: colorize("cyan", `WORKFLOW '${workflow.name}' `),
  });

  // Create a workflow run record
  const workflowRun = await workflowRunRepository.insert({
    workflowId: id,
    userId: session.user.id,
    title: `${workflow.name} - ${new Date().toLocaleString()}`,
    status: "running",
    input: query,
    metadata: {},
  });

  const app = createWorkflowExecutor({
    edges: workflow.edges,
    nodes: workflow.nodes,
    logger: wfLogger,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isAborted = false;
      let isClosed = false;

      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };

      // Subscribe to workflow events
      app.subscribe((evt) => {
        if (isAborted || isClosed) return;
        if (
          (evt.eventType == "NODE_START" || evt.eventType == "NODE_END") &&
          evt.node.name == "SKIP"
        ) {
          return;
        }
        try {
          const err = toAny(evt)?.error;
          if (err) {
            toAny(evt).error = {
              name: err.name || "ERROR",
              message: err?.message || safeJSONParse(err).value,
            };
          }
          // Use custom encoding instead of SSE format
          const data = encodeWorkflowEvent(evt);
          controller.enqueue(encoder.encode(data));
          // Close stream when workflow ends
          if (evt.eventType === "WORKFLOW_END" && evt.endedAt) {
            safeClose();
          }
        } catch (error) {
          logger.error("Stream write error:", error);
          if (!isClosed) {
            controller.error(error);
            isClosed = true;
          }
        }
      });

      // Handle client disconnection
      request.signal.addEventListener("abort", async () => {
        isAborted = true;
        void app.exit();
        safeClose();
      });

      // Start the workflow
      app
        .run(
          { query },
          {
            disableHistory: true,
            timeout: 1000 * 60 * 5,
          },
        )
        .then(async (result) => {
          if (!result.isOk) {
            logger.error("Workflow execution error:", result.error);
          }

          // Update workflow run with final result
          if (result.endedAt) {
            await workflowRunRepository.update(workflowRun.id, {
              status: result.isOk ? "completed" : "failed",
              output: JSON.stringify(result.output),
              error: result.error ? JSON.stringify(result.error) : undefined,
              endedAt: new Date(),
            });
          }
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
