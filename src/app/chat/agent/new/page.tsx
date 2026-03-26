import { getSession } from "lib/auth/server-instance-with-headers";
import { notFound } from "next/navigation";
import EditAgent from "@/components/agent/edit-agent";

export default async function NewAgentPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <EditAgent userId={session.user.id} />;
}
