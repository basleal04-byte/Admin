"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Store,
  Users,
  ArrowLeftRight,
  Wallet,
  Gift,
  Timer,
  Megaphone,
  ShieldCheck,
  Activity,
  Bell,
  BarChart3,
  UserCog,
  Percent,
  ScrollText,
  ClipboardCheck,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import type { AdminRole, Permission } from "@/types";

const NAV: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
}> = [
  { href: "/profile", label: "Profile", icon: User, permission: "profile:read" },
  { href: "/", label: "Overview", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: "/merchants", label: "Merchants", icon: Store, permission: "merchants:read" },
  { href: "/users", label: "Users", icon: Users, permission: "users:read" },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    permission: "transactions:read",
  },
  { href: "/escrow", label: "Escrow", icon: Wallet, permission: "escrow:read" },
  {
    href: "/redemptions",
    label: "Redemptions",
    icon: Gift,
    permission: "redemptions:read",
  },
  { href: "/expiry", label: "Expiry", icon: Timer, permission: "expiry:read" },
  { href: "/brand", label: "Brand ads", icon: Megaphone, permission: "brand:read" },
  { href: "/fis", label: "Integrity scores", icon: ShieldCheck, permission: "fis:read" },
  { href: "/webhooks", label: "System health", icon: Activity, permission: "webhooks:read" },
  { href: "/push", label: "Push", icon: Bell, permission: "push:read" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:read" },
  { href: "/fees", label: "Fee config", icon: Percent, permission: "fees:write" },
  { href: "/admins", label: "Admins", icon: UserCog, permission: "admins:read" },
  {
    href: "/approvals",
    label: "Approvals",
    icon: ClipboardCheck,
    permission: "approvals:read",
  },
  { href: "/audit", label: "Audit log", icon: ScrollText, permission: "audit:read" },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user?.role ?? "support") as AdminRole;
  const items = NAV.filter((n) => {
    if (n.href === "/profile") return role === "end_user";
    if (role === "end_user") return false;
    return can(role, n.permission);
  });

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="group" onClick={onClose}>
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-emerald-900">
            BirrBack
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
            Admin panel
          </p>
        </Link>
        {onClose ? (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <Icon
                className={cn("h-4 w-4", active ? "text-emerald-700" : "text-stone-400")}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200/80 px-5 py-4">
        <p className="text-xs text-stone-400">Mock data · {role}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-dvh w-60 shrink-0 overflow-hidden border-r border-stone-200/80 bg-[#f7f5f1] lg:block">
        {content}
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-stone-900/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-stone-200 bg-[#f7f5f1] transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
