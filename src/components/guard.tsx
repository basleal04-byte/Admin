"use client";

import { useSession } from "next-auth/react";
import { can } from "@/lib/permissions";
import type { AdminRole, Permission } from "@/types";

export function useCan(permission: Permission) {
  const { data } = useSession();
  const role = (data?.user?.role ?? "support") as AdminRole;
  return can(role, permission);
}

export function Guard({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const ok = useCan(permission);
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
