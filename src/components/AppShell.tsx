import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="paper-bg mx-auto flex min-h-dvh max-w-md flex-col">
      <main className={hideNav ? "flex flex-1 flex-col" : "flex flex-1 flex-col pb-20"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
