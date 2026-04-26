import { Home as HomeIcon, BookOpen, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Today", icon: HomeIcon, end: true },
  { to: "/history", label: "History", icon: BookOpen, end: false },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line-strong bg-paper/90 backdrop-blur-sm safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 flex-col items-center gap-1 px-3 py-2 transition-colors",
                isActive ? "text-ink" : "text-ink-3 hover:text-ink-2"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{label}</span>
                {isActive && (
                  <span className="absolute -top-px left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-ink" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
