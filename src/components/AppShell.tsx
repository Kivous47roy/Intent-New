import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
      <main className={hideNav ? "flex-1" : "flex-1 pb-24"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
