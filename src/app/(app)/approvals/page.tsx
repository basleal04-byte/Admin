"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState, TableSkeleton } from "@/components/states";
import { api } from "@/lib/client";
import type { PendingApproval } from "@/types";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const isSuper = session?.user?.role === "super_admin";
  const [data, setData] = useState<PendingApproval[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api<PendingApproval[]>(
        "/api/admin/approvals?status=pending"
      );
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    try {
      await api(`/api/admin/approvals/${id}`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Approvals"
        description={
          isSuper
            ? "Review and approve changes submitted by ops, finance, and support"
            : "Your changes waiting for super admin approval"
        }
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Monetary and account changes from non-super-admin roles do not apply
          until a super admin approves them here.
        </p>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={4} />
              </div>
            ) : error ? (
              <div className="p-5">
                <ErrorState message={error} />
              </div>
            ) : (data ?? []).length === 0 ? (
              <p className="p-6 text-sm text-stone-500">No pending approvals.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Requested</th>
                      <th className="px-4 py-3 font-medium">Kind</th>
                      <th className="px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Old → New</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      {isSuper ? (
                        <th className="px-4 py-3 font-medium text-right">
                          Actions
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data ?? []).map((a) => (
                      <tr key={a.id} className="align-top hover:bg-stone-50/60">
                        <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                          {format(new Date(a.createdAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{a.kind}</Badge>
                          <p className="mt-1 text-xs text-stone-400">{a.action}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{a.actor}</p>
                          <p className="text-xs text-stone-400">{a.actorRole}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{a.target}</td>
                        <td className="px-4 py-3 text-xs max-w-[220px] break-all">
                          <p>
                            <span className="text-stone-400">old: </span>
                            {a.oldValue ?? "—"}
                          </p>
                          <p className="mt-1">
                            <span className="text-stone-400">new: </span>
                            {a.newValue ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600">
                          {a.reason ?? "—"}
                        </td>
                        {isSuper ? (
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              disabled={busyId === a.id}
                              onClick={() => decide(a.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === a.id}
                              onClick={() => decide(a.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
