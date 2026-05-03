import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="paper-bg mx-auto flex h-dvh max-w-md flex-col overflow-hidden">
      <main className={hideNav ? "flex flex-1 flex-col overflow-hidden" : "flex flex-1 flex-col overflow-hidden pb-20"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
