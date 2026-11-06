import type { AdminRole, Permission } from "@/types";

const ALL: Permission[] = [
  "profile:read",
  "dashboard:read",
  "merchants:read",
  "merchants:write",
  "merchants:approve",
  "users:read",
  "users:write",
  "users:points",
  "transactions:read",
  "transactions:reprocess",
  "escrow:read",
  "escrow:write",
  "redemptions:read",
  "redemptions:write",
  "expiry:read",
  "expiry:write",
  "brand:read",
  "brand:write",
  "fis:read",
  "fis:write",
  "webhooks:read",
  "push:read",
  "push:write",
  "reports:read",
  "admins:read",
  "admins:write",
  "fees:write",
  "audit:read",
  "approvals:read",
  "approvals:write",
];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL,
  ops: [
    "dashboard:read",
    "merchants:read",
    // Prepare / recommend only — final activate requires merchants:approve
    "merchants:write",
    "users:read",
    "transactions:read",
    "transactions:reprocess",
    "redemptions:read",
    "expiry:read",
    "webhooks:read",
    "push:read",
    "push:write",
    "reports:read",
    "fis:read",
    "audit:read",
    "approvals:read",
  ],
  finance: [
    "dashboard:read",
    "merchants:read",
    "transactions:read",
    "escrow:read",
    "escrow:write",
    "redemptions:read",
    "redemptions:write",
    "expiry:read",
    "expiry:write",
    "brand:read",
    "reports:read",
    "fees:write",
    "audit:read",
    "approvals:read",
  ],
  support: [
    "dashboard:read",
    "users:read",
    "users:write",
    "users:points",
    "transactions:read",
    "redemptions:read",
    "expiry:read",
    "expiry:write",
    "push:read",
    "push:write",
    "audit:read",
    "approvals:read",
  ],
  end_user: ["profile:read"],
};

export function permissionsFor(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: AdminRole, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}
