"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { StatGrid } from "@/components/charts";
import { useRedemptions } from "@/hooks/use-data";
import { formatEtb, formatNumber, formatPercent } from "@/lib/utils";
import type { RedemptionStatus } from "@/types";

type Filter = "all" | RedemptionStatus;

export default function RedemptionsPage() {
  const { data, loading, error, retry } = useRedemptions();
  const [filter, setFilter] = useState<Filter>("all");
  const [retryId, setRetryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const list = data?.redemptions ?? [];
    if (filter === "all") return list;
    return list.filter((r) => r.status === filter);
  }, [data, filter]);

  const channelPct = useMemo(() => {
    const ch = data?.channels;
    if (!ch) return [];
    const total = ch.wallet + ch.airtime + ch.data || 1;
    return [
      { label: "Wallet", value: formatPercent(ch.wallet / total) },
      { label: "Airtime", value: formatPercent(ch.airtime / total) },
      { label: "Data", value: formatPercent(ch.data / total) },
    ];
  }, [data]);

  async function confirmRetry() {
    if (!retryId) return;
    setBusy(true);
    try {
      await retry(retryId);
      setRetryId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Redemptions"
        description="Points to wallet, airtime, and data"
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
        ) : data ? (
          <>
            <StatGrid
              items={[
                {
                  label: "Wholesale purchased",
                  value: formatEtb(data.airtime.wholesalePurchasedEtb),
                },
                {
                  label: "Face value redeemed",
                  value: formatEtb(data.airtime.faceValueRedeemedEtb),
                },
                {
                  label: "Airtime spread",
                  value: formatEtb(data.airtime.spreadEtb),
                },
                ...channelPct.map((c) => ({
                  label: `${c.label} share`,
                  value: c.value,
                })),
              ]}
            />
          </>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all" as const, label: "All" },
              { id: "pending" as const, label: "Pending" },
              { id: "failed" as const, label: "Failed" },
              { id: "success" as const, label: "Success" },
            ] as const
          ).map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "outline"}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redemptions</CardTitle>
          </CardHeader>
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
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Channel</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">When</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{r.userName}</p>
                          <p className="text-xs text-stone-500">{r.userPhone}</p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(r.points)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(r.amountEtb)}</td>
                        <td className="px-5 py-3.5 capitalize">{r.channel}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              r.status === "success"
                                ? "default"
                                : r.status === "pending"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {r.status}
                          </Badge>
                          {r.failureReason ? (
                            <p className="mt-1 text-xs text-red-600">{r.failureReason}</p>
                          ) : null}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(r.createdAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {r.status === "failed" ? (
                            <Guard permission="redemptions:write">
                              <Button size="sm" variant="outline" onClick={() => setRetryId(r.id)}>
                                Retry
                              </Button>
                            </Guard>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-stone-500">
                          No redemptions match this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmDialog
        open={!!retryId}
        title="Retry redemption"
        description="Queue this failed redemption for another delivery attempt."
        confirmLabel="Retry"
        loading={busy}
        onConfirm={confirmRetry}
        onOpenChange={(open) => {
          if (!open && !busy) setRetryId(null);
        }}
      />
    </>
  );
}
