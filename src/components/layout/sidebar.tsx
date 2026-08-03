"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ArrowLeftRight,
  Megaphone,
  Percent,
  ScrollText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/merchants", label: "Merchants", icon: Store },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/fees", label: "Fee config", icon: Percent },
  { href: "/audit", label: "Audit log", icon: ScrollText },
] as const;

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

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
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-emerald-700" : "text-stone-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200/80 px-5 py-4">
        <p className="text-xs text-stone-400">Mock data</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-stone-200/80 bg-[#f7f5f1] lg:block">
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
