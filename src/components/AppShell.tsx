import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="paper-bg mx-auto flex h-dvh max-w-md flex-col overflow-hidden">
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
