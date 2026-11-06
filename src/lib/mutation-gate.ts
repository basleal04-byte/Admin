import { NextResponse } from "next/server";
import type { Session } from "next-auth";
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
 * Super admins apply immediately. Ops / finance / support changes are queued
 * for super_admin approval.
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

  if (role === "super_admin") {
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

  return {
    status: "pending",
    approval,
    response: NextResponse.json(
      {
        pendingApproval: true,
        approvalId: approval.id,
        message:
          "Change submitted for super admin approval. It will not take effect until approved.",
        oldValue: stringifyValue(opts.oldValue),
        newValue: stringifyValue(opts.newValue),
      },
      { status: 202 }
    ),
  };
}
