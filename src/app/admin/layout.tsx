"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wifi, Trophy, Shield, Users,
  Newspaper, Calendar, Settings, LogOut, Menu, X, ChevronRight,
  Activity, UserCog, FileText, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "./actions";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/live", label: "Live Scoring", icon: Wifi },
  { href: "/admin/scout", label: "COURT Scout", icon: Activity },
  { href: "/admin/teams", label: "Teams", icon: Shield },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/news", label: "News", icon: Newspaper },
];

const systemNavItems = [
  { href: "/admin/admins", label: "Admin Users", icon: UserCog },
  { href: "/admin/system", label: "System Monitor", icon: Activity },
];

const teamNavItems = [
  { href: "/admin/team", label: "My Team", icon: Shield, exact: true },
  { href: "/admin/team/o2", label: "O2 Forms", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTeamPortal = pathname.startsWith("/admin/team");
  const navItems = isTeamPortal ? teamNavItems : adminNavItems;
  const sysItems = isTeamPortal ? [] : systemNavItems;
  const portalLabel = isTeamPortal ? "Team Portal" : "Admin Panel";
  const portalSub = isTeamPortal ? "ZVA Volleyball Admin" : "Zimbabwe Volleyball Assoc.";

  return (
    <div className="min-h-screen flex bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-zva-green flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">ZVA</span>
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">{portalLabel}</div>
            <div className="text-xs text-zinc-500 truncate">{portalSub}</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded text-zinc-500 hover:text-white shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-zva-green text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                )}
              >
                {href === "/admin/live" ? <span className="live-dot" /> : <Icon size={16} />}
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}

          {sysItems.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">System</span>
              </div>
              {sysItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-zva-green text-white shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {label}
                    {active && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
            target="_blank"
          >
            <Globe size={15} />
            View Public Site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-black border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900">
            <Menu size={20} />
          </button>
          <span className="font-bold text-white">ZVA {isTeamPortal ? "Team Portal" : "Admin"}</span>
        </div>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 bg-zinc-950">{children}</main>
      </div>
    </div>
  );
}
