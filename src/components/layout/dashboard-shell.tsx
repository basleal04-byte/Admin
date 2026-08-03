"use client";

import { createContext, useContext, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

type ShellContextValue = { openMenu: () => void };

const ShellContext = createContext<ShellContextValue>({ openMenu: () => {} });

export function useShell() {
  return useContext(ShellContext);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <ShellContext.Provider value={{ openMenu: () => setOpen(true) }}>
      <div className="flex min-h-screen bg-[#fbfaf8] text-stone-900">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { openMenu } = useShell();
  return <Header title={title} description={description} onMenuClick={openMenu} />;
}
