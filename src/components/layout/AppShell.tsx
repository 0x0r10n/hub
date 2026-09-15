import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileStatusBar } from "./MobileStatusBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-void-950 text-void-100">
      <div className="hidden md:block">
        <TopNav />
      </div>
      <MobileStatusBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-h-0 flex-1 overflow-hidden pb-16 md:pb-0">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
