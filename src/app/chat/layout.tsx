import { SidebarProvider } from "ui/sidebar";
import { cookies } from "next/headers";
import { getSession } from "lib/auth/server-instance-with-headers";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { UserDetailContent } from "@/components/user/user-detail/user-detail-content";
import { UserDetailContentSkeleton } from "@/components/user/user-detail/user-detail-content-skeleton";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import ChatLayoutClient from "./chat-layout-client";
export const experimental_ppr = true;

// Server component wrapper for authentication
async function AuthenticatedLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppPopupProvider
        userSettingsComponent={
          <Suspense fallback={<UserDetailContentSkeleton />}>
            <UserDetailContent view="user" />
          </Suspense>
        }
      />
      <ChatLayoutClient user={session.user}>{children}</ChatLayoutClient>
    </SidebarProvider>
  );
}

export default function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
