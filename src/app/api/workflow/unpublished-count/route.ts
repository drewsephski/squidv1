import { getSession } from "auth/server";
import { workflowRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ count: 0 });
  }
  const count = await workflowRepository.countUnpublishedByUserId(
    session.user.id,
  );
  return Response.json({ count });
}
