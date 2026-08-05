"use client";

import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { StatGrid } from "@/components/charts";
import { useWebhooks } from "@/hooks/use-data";
import { formatPercent } from "@/lib/utils";

export default function WebhooksPage() {
  const { data, loading, error } = useWebhooks();
  const health = data?.health;

  return (
    <>
      <PageHeader
        title="System health"
        description="Webhooks, integrations, and security events"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : health ? (
          <StatGrid
            items={[
              {
                label: "Webhook delivery rate",
                value: formatPercent(health.webhookDeliveryRate),
              },
              {
                label: "Avg processing",
                value: `${health.avgProcessingMs} ms`,
              },
              {
                label: "DB response",
                value: `${health.dbResponseMs} ms`,
              },
              {
                label: "Memory used",
                value: `${health.memoryUsedMb} MB`,
              },
              {
                label: "Active connections",
                value: String(health.activeConnections),
              },
            ]}
          />
        ) : null}

        {health ? (
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {health.integrations.map((i) => (
                      <tr key={i.name}>
                        <td className="px-5 py-3.5 font-medium">{i.name}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              i.status === "up"
                                ? "default"
                                : i.status === "degraded"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {i.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{i.latencyMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Failed webhooks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-5">
                  <TableSkeleton rows={4} />
                </div>
              ) : error ? (
                <div className="p-5">
                  <ErrorState message={error} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Trade</th>
                        <th className="px-5 py-3 font-medium">Event</th>
                        <th className="px-5 py-3 font-medium">Reason</th>
                        <th className="px-5 py-3 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.failedWebhooks ?? []).map((w) => (
                        <tr key={w.id}>
                          <td className="px-5 py-3.5 font-mono text-xs">{w.outTradeNo}</td>
                          <td className="px-5 py-3.5">{w.event}</td>
                          <td className="px-5 py-3.5 text-red-600">{w.reason ?? "n/a"}</td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {format(new Date(w.createdAt), "MMM d · HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-5">
                  <TableSkeleton rows={4} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Actor</th>
                        <th className="px-5 py-3 font-medium">Detail</th>
                        <th className="px-5 py-3 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.security ?? []).map((e) => (
                        <tr key={e.id}>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                e.type === "data_access" ? "warning" : "destructive"
                              }
                            >
                              {e.type}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">{e.actor}</td>
                          <td className="px-5 py-3.5 text-stone-600">{e.detail}</td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {format(new Date(e.createdAt), "MMM d · HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
