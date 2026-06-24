"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, BarChart3, Target, MessageSquare, RefreshCw, LogOut, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/insforge/actions";
import { useRouter } from "next/navigation";

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Academic Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "ECET Engine", href: "/dashboard/ecet", icon: Target },
  { name: "AI Coach", href: "/dashboard/coach", icon: MessageSquare },
  { name: "Sync Data", href: "/dashboard/sync", icon: RefreshCw },
];

if (process.env.NEXT_PUBLIC_ENABLE_MANUAL_MIDS === 'true') {
  baseNavigation.push({ name: "Mid-Sem Entry", href: "/dashboard/mid-entry", icon: Target });
}

baseNavigation.push({ name: "Academic Timeline", href: "/dashboard/timeline", icon: Clock });
baseNavigation.push({ name: "Results", href: "/dashboard/results", icon: Layers });
baseNavigation.push({ name: "Profile", href: "/dashboard/profile", icon: User });

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="hidden border-r border-slate-800 bg-slate-950/50 md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <nav className="flex-1 px-4 pb-4 space-y-1">
          {baseNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive ? "bg-indigo-900/50 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300",
                    "mr-3 flex-shrink-0 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-slate-500 group-hover:text-slate-300" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
