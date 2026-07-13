"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShellClient({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login") return <>{children}</>;

  // Public event proposal creator view (without login or sidebars)
  if (pathname === "/proposals/new") {
    if (status === "loading") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      );
    }
    if (!session) {
      return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
          <main className="flex-1 px-4 py-8 md:py-12 max-w-5xl mx-auto w-full">{children}</main>
          <footer className="py-6 text-center border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Powered by Nexint AI
          </footer>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
