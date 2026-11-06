"use client";

import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useAudit } from "@/hooks/use-data";

export default function AuditPage() {
  const { data, loading, error } = useAudit();

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Authentication, failures, and admin changes with before/after values"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={6} />
              </div>
            ) : error ? (
              <div className="p-5">
                <ErrorState message={error} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">When (UTC)</th>
                      <th className="px-4 py-3 font-medium">Result</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Old → New</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">IP / UA / Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data ?? []).map((e) => (
                      <tr key={e.id} className="align-top hover:bg-stone-50/60">
                        <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                          {format(new Date(e.createdAt), "yyyy-MM-dd HH:mm:ss")}Z
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              e.result === "failure"
                                ? "destructive"
                                : e.result === "pending"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {e.result ?? "success"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{e.action}</Badge>
                          <p className="mt-1 text-xs text-stone-500">{e.detail}</p>
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          <p>{e.actor}</p>
                          {e.actorId ? (
                            <p className="font-mono text-[10px] text-stone-400">
                              {e.actorId}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-600">
                          {e.target}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600 max-w-[220px]">
                          <p className="break-all">
                            <span className="text-stone-400">old: </span>
                            {e.oldValue ?? "—"}
                          </p>
                          <p className="mt-1 break-all">
                            <span className="text-stone-400">new: </span>
                            {e.newValue ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600">
                          {e.reason ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-stone-500 max-w-[200px]">
                          <p className="font-mono">{e.ip}</p>
                          <p className="mt-1 break-all">{e.userAgent ?? "—"}</p>
                          <p className="mt-1 font-mono">{e.sessionId ?? "—"}</p>
                        </td>
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
