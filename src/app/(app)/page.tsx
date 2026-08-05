"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states";
import { TxStatusBadge } from "@/components/status-badge";
import { BarChart, StatGrid } from "@/components/charts";
import { useOverview } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";

export default function OverviewPage() {
  const { data, loading, error } = useOverview();

  return (
    <>
      <PageHeader title="Overview" description="Live platform metrics" />
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {error ? <ErrorState message={error} /> : null}

        {loading || !data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <StatGrid
            items={[
              {
                label: "BirrPoints today",
                value: formatNumber(data.pointsToday),
                hint: `Week ${formatNumber(data.pointsWeek)} · Month ${formatNumber(data.pointsMonth)}`,
              },
              {
                label: "Escrow balance",
                value: formatEtb(data.escrowBalanceEtb),
              },
              {
                label: "Active users today",
                value: formatNumber(data.activeUsersToday),
              },
              {
                label: "Qualifying tx today",
                value: formatNumber(data.qualifyingTxToday),
              },
              {
                label: "Commission today",
                value: formatEtb(data.commissionTodayEtb),
              },
              {
                label: "Active merchants",
                value: formatNumber(data.activeMerchants),
              },
            ]}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Live transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !data ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data.liveFeed.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{tx.merchantName}</p>
                        <p className="truncate text-xs text-stone-500">
                          {tx.userPhone} · {tx.outTradeNo} ·{" "}
                          {formatDistanceToNow(new Date(tx.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatEtb(tx.amountEtb)}
                        </span>
                        <TxStatusBadge status={tx.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading || !data ? (
                <Skeleton className="h-32 w-full" />
              ) : data.alerts.length === 0 ? (
                <p className="text-stone-500">No alerts</p>
              ) : (
                data.alerts.map((a) => (
                  <div
                    key={a.id}
                    className={
                      a.severity === "high"
                        ? "rounded-lg bg-red-50 px-3 py-2 text-red-800"
                        : "rounded-lg bg-amber-50 px-3 py-2 text-amber-800"
                    }
                  >
                    {a.message}
                  </div>
                ))
              )}
              <Link href="/webhooks" className="text-sm text-emerald-800 hover:underline">
                Open system health
              </Link>
            </CardContent>
          </Card>
        </div>

        {data ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Daily volume</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.volumeDaily} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weekly volume</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.volumeWeekly} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly volume</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.volumeMonthly} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </>
  );
}
