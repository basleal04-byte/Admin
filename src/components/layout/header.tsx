"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  description?: string;
  onMenuClick?: () => void;
};

export function Header({ title, description, onMenuClick }: HeaderProps) {
  const { data } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fbfaf8]/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900 sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-sm text-stone-500">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-stone-800">{data?.user?.name}</p>
            <p className="text-xs text-stone-500">
              {data?.user?.email}
              {data?.user?.role ? ` · ${data.user.role}` : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
