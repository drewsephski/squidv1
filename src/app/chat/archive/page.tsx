import { getSession } from "lib/auth/server-instance-with-headers";
import { redirect } from "next/navigation";
import ArchiveListClient from "./archive-list-client";
import LightRays from "ui/light-rays";
import Particles from "ui/particles";

export default async function ArchiveListPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <>
      <>
        <div className="absolute opacity-30 pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <LightRays className="bg-transparent" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <Particles
            className="bg-transparent"
            particleCount={400}
            particleBaseSize={10}
          />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-t from-background to-50% to-transparent z-20" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-l from-background to-20% to-transparent z-20" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-r from-background to-20% to-transparent z-20" />
        </div>
      </>
      <ArchiveListClient />
    </>
  );
}
