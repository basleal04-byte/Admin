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
        description="Authentication and admin actions"
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
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">When</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                      <th className="px-5 py-3 font-medium">Actor</th>
                      <th className="px-5 py-3 font-medium">Target</th>
                      <th className="px-5 py-3 font-medium">IP</th>
                      <th className="px-5 py-3 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data ?? []).map((e) => (
                      <tr key={e.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(e.createdAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline">{e.action}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-stone-700">{e.actor}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-stone-600">
                          {e.target}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-stone-500">
                          {e.ip}
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{e.detail}</td>
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
