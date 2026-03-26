import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";
import { getSession } from "lib/auth/server-instance-with-headers";
import { redirect } from "next/navigation";
import LightRays from "ui/light-rays";
import Particles from "ui/particles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  const id = generateUUID();
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <LightRays className="bg-transparent" />
      </div>
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Particles className="bg-transparent" />
      </div>

      {/* Chat Interface */}
      <div className="relative z-30 w-full h-full">
        <ChatBot initialMessages={[]} threadId={id} key={id} />
      </div>
    </div>
  );
}
