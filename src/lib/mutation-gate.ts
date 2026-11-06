import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { can } from "@/lib/permissions";
import { requestMeta, stringifyValue } from "@/lib/request-meta";
import { db } from "@/lib/store";
import type {
  AdminRole,
  ApprovalKind,
  AuditAction,
  PendingApproval,
} from "@/types";

export function isSuperAdmin(session: Session) {
  return (session.user?.role as AdminRole) === "super_admin";
}

/**
 * Super admins (or roles with merchants:approve for merchant status) apply
 * immediately. Ops / finance / support changes are queued for approval.
 * Merchant activate/suspend/deactivate always requires merchants:approve —
 * ops may only submit a request.
 */
export function enqueueOrApply<T>(opts: {
  req: Request;
  session: Session;
  kind: ApprovalKind;
  action: AuditAction;
  target: string;
  payload: Record<string, unknown>;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  apply: () => T;
}):
  | { status: "applied"; result: T }
  | { status: "pending"; approval: PendingApproval; response: NextResponse } {
  const meta = requestMeta(opts.req, opts.session);
  const role = (opts.session.user?.role ?? "support") as AdminRole;

  const canApplyNow =
    opts.kind === "merchant.status"
      ? can(role, "merchants:approve")
      : role === "super_admin";

  if (canApplyNow) {
    return { status: "applied", result: opts.apply() };
  }

  const approval = db.requestApproval({
    kind: opts.kind,
    action: opts.action,
    actor: opts.session.user!.email!,
    actorId: opts.session.user?.id,
    actorRole: role,
    target: opts.target,
    payload: opts.payload,
    oldValue: opts.oldValue,
    newValue: opts.newValue,
    reason: opts.reason,
    ip: meta.ip,
    userAgent: meta.userAgent,
    sessionId: meta.sessionId,
  });

  const message =
    opts.kind === "merchant.status"
      ? "Merchant status change submitted for compliance approval. It will not take effect until a merchant approver confirms it."
      : "Change submitted for super admin approval. It will not take effect until approved.";

  return {
    status: "pending",
    approval,
    response: NextResponse.json(
      {
        pendingApproval: true,
        approvalId: approval.id,
        message,
        oldValue: stringifyValue(opts.oldValue),
        newValue: stringifyValue(opts.newValue),
      },
      { status: 202 }
    ),
  };
}
