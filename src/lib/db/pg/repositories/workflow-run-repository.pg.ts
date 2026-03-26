import {
  WorkflowRun,
  WorkflowRunRepository,
  WorkflowRunStatus,
  WorkflowRunSummary,
} from "app-types/workflow";
import { pgDb } from "../db.pg";
import { UserTable, WorkflowRunTable, WorkflowTable } from "../schema.pg";
import { and, desc, eq, sql } from "drizzle-orm";

// Helper function to safely cast string to UUID in SQL
const uuidEq = (column: any, value: string) => sql`${column} = ${value}::uuid`;

function toWorkflowRun(
  data: typeof WorkflowRunTable.$inferSelect,
): WorkflowRun {
  return {
    id: data.id,
    workflowId: data.workflowId,
    userId: data.userId,
    title: data.title,
    status: data.status as WorkflowRunStatus,
    startedAt: data.startedAt,
    endedAt: data.endedAt ?? undefined,
    input: data.input as Record<string, any>,
    output: data.output as Record<string, any> | undefined,
    error: data.error as
      | { name: string; message: string; stack?: string }
      | undefined,
    metadata: data.metadata as Record<string, any>,
  };
}

function toWorkflowRunSummary(
  data: any & {
    workflow_name: string;
    workflow_icon: any;
    user_name: string;
    user_image: string;
  },
): WorkflowRunSummary {
  const duration = data.endedAt
    ? new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()
    : undefined;

  return {
    id: data.id,
    workflowId: data.workflowId,
    workflowName: data.workflow_name,
    workflowIcon: data.workflow_icon ?? undefined,
    userId: data.userId,
    userName: data.user_name,
    userAvatar: data.user_image ?? undefined,
    title: data.title,
    status: data.status as WorkflowRunStatus,
    startedAt: data.startedAt,
    endedAt: data.endedAt ?? undefined,
    duration,
    input: data.input as Record<string, any>,
    output: data.output as Record<string, any> | undefined,
    error: data.error as
      | { name: string; message: string; stack?: string }
      | undefined,
    metadata: data.metadata as Record<string, any>,
  };
}

export const pgWorkflowRunRepository: WorkflowRunRepository = {
  selectById: async (id: string): Promise<WorkflowRun | null> => {
    const [result] = await pgDb
      .select()
      .from(WorkflowRunTable)
      .where(eq(WorkflowRunTable.id, id));
    return result ? toWorkflowRun(result) : null;
  },

  selectByIdWithDetails: async (
    id: string,
  ): Promise<WorkflowRunSummary | null> => {
    const [result] = await pgDb
      .select({
        id: WorkflowRunTable.id,
        workflowId: WorkflowRunTable.workflowId,
        userId: WorkflowRunTable.userId,
        title: WorkflowRunTable.title,
        status: WorkflowRunTable.status,
        startedAt: WorkflowRunTable.startedAt,
        endedAt: WorkflowRunTable.endedAt,
        input: WorkflowRunTable.input,
        output: WorkflowRunTable.output,
        error: WorkflowRunTable.error,
        metadata: WorkflowRunTable.metadata,
        workflow_name: WorkflowTable.name,
        workflow_icon: WorkflowTable.icon,
        user_name: UserTable.name,
        user_image: UserTable.image,
      })
      .from(WorkflowRunTable)
      .innerJoin(
        WorkflowTable,
        eq(WorkflowRunTable.workflowId, WorkflowTable.id),
      )
      .innerJoin(UserTable, eq(WorkflowRunTable.userId, UserTable.id))
      .where(eq(WorkflowRunTable.id, id));

    return result ? toWorkflowRunSummary(result) : null;
  },

  selectByUserId: async (userId: string): Promise<WorkflowRunSummary[]> => {
    const results = await pgDb
      .select({
        id: WorkflowRunTable.id,
        workflowId: WorkflowRunTable.workflowId,
        userId: WorkflowRunTable.userId,
        title: WorkflowRunTable.title,
        status: WorkflowRunTable.status,
        startedAt: WorkflowRunTable.startedAt,
        endedAt: WorkflowRunTable.endedAt,
        input: WorkflowRunTable.input,
        output: WorkflowRunTable.output,
        error: WorkflowRunTable.error,
        metadata: WorkflowRunTable.metadata,
        workflow_name: WorkflowTable.name,
        workflow_icon: WorkflowTable.icon,
        user_name: UserTable.name,
        user_image: UserTable.image,
      })
      .from(WorkflowRunTable)
      .innerJoin(
        WorkflowTable,
        eq(WorkflowRunTable.workflowId, WorkflowTable.id),
      )
      .innerJoin(UserTable, eq(WorkflowRunTable.userId, UserTable.id))
      .where(uuidEq(WorkflowRunTable.userId, userId))
      .orderBy(desc(WorkflowRunTable.startedAt));

    return results.map(toWorkflowRunSummary);
  },

  insert: async (
    run: Omit<WorkflowRun, "id" | "startedAt">,
  ): Promise<WorkflowRun> => {
    const [result] = await pgDb
      .insert(WorkflowRunTable)
      .values({
        workflowId: run.workflowId,
        userId: run.userId,
        title: run.title,
        status: run.status,
        input: run.input,
        output: run.output,
        error: run.error,
        metadata: run.metadata,
        endedAt: run.endedAt,
      })
      .returning();

    return toWorkflowRun(result);
  },

  update: async (
    id: string,
    updates: Partial<WorkflowRun>,
  ): Promise<WorkflowRun> => {
    const [result] = await pgDb
      .update(WorkflowRunTable)
      .set({
        title: updates.title,
        status: updates.status,
        endedAt: updates.endedAt,
        input: updates.input,
        output: updates.output,
        error: updates.error,
        metadata: updates.metadata,
      })
      .where(eq(WorkflowRunTable.id, id))
      .returning();

    return toWorkflowRun(result);
  },

  delete: async (id: string): Promise<void> => {
    await pgDb.delete(WorkflowRunTable).where(eq(WorkflowRunTable.id, id));
  },

  checkAccess: async (id: string, userId: string): Promise<boolean> => {
    const [result] = await pgDb
      .select({
        userId: WorkflowRunTable.userId,
      })
      .from(WorkflowRunTable)
      .where(
        and(
          eq(WorkflowRunTable.id, id),
          uuidEq(WorkflowRunTable.userId, userId),
        ),
      );
    return Boolean(result);
  },
};
