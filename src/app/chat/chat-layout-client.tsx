"use client";

import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { SWRConfigProvider } from "./swr-config";
import { BasicUser } from "@/types/user";

interface ChatLayoutClientProps {
  children: React.ReactNode;
  user: BasicUser;
}

export default function ChatLayoutClient({
  children,
  user,
}: ChatLayoutClientProps) {
  return (
    <SWRConfigProvider user={user}>
      <AppSidebar user={user} />
      <main className="relative bg-background  w-full flex flex-col h-screen">
        <AppHeader />
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </SWRConfigProvider>
  );
}
