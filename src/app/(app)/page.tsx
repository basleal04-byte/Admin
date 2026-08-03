"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Store,
  Coins,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states";
import { TxStatusBadge } from "@/components/status-badge";
import { useDashboard, useTransactions } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";

export default function OverviewPage() {
  const stats = useDashboard();
  const txs = useTransactions();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Merchants, fees, and volume"
      />
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {stats.error ? <ErrorState message={stats.error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            loading={stats.loading}
            label="Active merchants"
            value={stats.data ? formatNumber(stats.data.activeMerchants) : "-"}
            hint={
              stats.data
                ? `${stats.data.pendingMerchants} pending approval`
                : undefined
            }
            icon={Store}
          />
          <StatCard
            loading={stats.loading}
            label="Volume (sample)"
            value={stats.data ? formatEtb(stats.data.volumeEtb24h) : "-"}
            hint={
              stats.data ? `${stats.data.txCount24h} transactions` : undefined
            }
            icon={TrendingUp}
          />
          <StatCard
            loading={stats.loading}
            label="BirrBack revenue"
            value={stats.data ? formatEtb(stats.data.revenueEtb24h) : "-"}
            hint="3% platform share of marketing fee"
            icon={Coins}
          />
          <StatCard
            loading={stats.loading}
            label="Points issued"
            value={stats.data ? formatNumber(stats.data.pointsIssued24h) : "-"}
            hint={
              stats.data
                ? `${stats.data.openDisputes} open dispute${stats.data.openDisputes === 1 ? "" : "s"}`
                : undefined
            }
            icon={Users}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-stone-400" />
                Recent transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txs.loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : txs.error ? (
                <ErrorState message={txs.error} />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {(txs.data ?? []).slice(0, 5).map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {tx.merchantName}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {tx.outTradeNo} ·{" "}
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
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-600">
              {stats.loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <p>
                    <span className="font-semibold text-stone-900">
                      {stats.data?.pendingMerchants ?? 0}
                    </span>{" "}
                    pending merchant approvals.
                  </p>
                  <p>
                    <span className="font-semibold text-stone-900">
                      {stats.data?.openDisputes ?? 0}
                    </span>{" "}
                    open disputes.
                  </p>
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                    Fee split: 10% marketing, 7% points, 3% BirrBack.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  loading,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-stone-500">{label}</p>
          <Icon className="h-4 w-4 text-emerald-700/70" />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        )}
        {hint ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
