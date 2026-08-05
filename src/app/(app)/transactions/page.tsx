"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Guard } from "@/components/guard";
import { BarChart } from "@/components/charts";
import { TxStatusBadge, WebhookStatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useTransactionsBundle } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";
import type { TransactionStatus } from "@/types";

const STATUS_FILTERS: Array<{ id: "all" | TransactionStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "disputed", label: "Disputed" },
];

type VolumeTab = "daily" | "weekly" | "monthly";

export default function TransactionsPage() {
  const { data, loading, error, reprocess } = useTransactionsBundle();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TransactionStatus>("all");
  const [minAmount, setMinAmount] = useState("");
  const [volumeTab, setVolumeTab] = useState<VolumeTab>("daily");
  const [reprocessId, setReprocessId] = useState<string | null>(null);
  const [reprocessBusy, setReprocessBusy] = useState(false);

  const rows = useMemo(() => {
    const list = data?.transactions ?? [];
    const needle = q.trim().toLowerCase();
    const min = minAmount.trim() ? Number(minAmount) : null;
    return list.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (min !== null && !Number.isNaN(min) && t.amountEtb < min) return false;
      if (!needle) return true;
      return (
        t.merchantName.toLowerCase().includes(needle) ||
        t.outTradeNo.toLowerCase().includes(needle) ||
        t.userPhone.toLowerCase().includes(needle)
      );
    });
  }, [data?.transactions, statusFilter, minAmount, q]);

  const failed = useMemo(
    () => (data?.transactions ?? []).filter((t) => t.status === "failed"),
    [data?.transactions]
  );

  const volumeData = useMemo(() => {
    if (!data?.volume) return [];
    return data.volume[volumeTab];
  }, [data?.volume, volumeTab]);

  async function confirmReprocess() {
    if (!reprocessId) return;
    setReprocessBusy(true);
    try {
      await reprocess(reprocessId);
      setReprocessId(null);
    } finally {
      setReprocessBusy(false);
    }
  }

  const reprocessTx = failed.find((t) => t.id === reprocessId);

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Telebirr payments, remittances, and fee splits"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search merchant, phone, trade no"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-xs"
            />
            <Input
              type="number"
              min={0}
              placeholder="Min amount ETB"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="sm:max-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={statusFilter === f.id ? "default" : "outline"}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live transactions</CardTitle>
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
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Commission</th>
                      <th className="px-5 py-3 font-medium">Webhook</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5 font-medium text-stone-900">
                          {t.merchantName}
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{t.userPhone}</td>
                        <td className="px-5 py-3.5 tabular-nums font-medium">
                          {formatEtb(t.amountEtb)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-emerald-800">
                          {formatNumber(t.birrPoints)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-stone-700">
                          {formatEtb(t.commissionEtb)}
                        </td>
                        <td className="px-5 py-3.5">
                          <WebhookStatusBadge status={t.webhookStatus} />
                        </td>
                        <td className="px-5 py-3.5">
                          <TxStatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(t.createdAt), "MMM d · HH:mm")}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-stone-500">
                          No transactions match this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {failed.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Failed transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Trade</th>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Reason</th>
                      <th className="px-5 py-3 font-medium">Time</th>
                      <th className="px-5 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {failed.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3 font-mono text-xs">{t.outTradeNo}</td>
                        <td className="px-5 py-3">{t.merchantName}</td>
                        <td className="px-5 py-3 text-stone-600">
                          {t.failureReason ?? "Unknown"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                          {format(new Date(t.createdAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Guard permission="transactions:reprocess">
                            <Button size="sm" onClick={() => setReprocessId(t.id)}>
                              Reprocess
                            </Button>
                          </Guard>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Duplicate events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={3} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Trade</th>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">First seen</th>
                      <th className="px-5 py-3 font-medium">Duplicate</th>
                      <th className="px-5 py-3 font-medium">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.duplicates ?? []).map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-3 font-mono text-xs">{d.outTradeNo}</td>
                        <td className="px-5 py-3">{d.merchantName}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                          {format(new Date(d.firstSeenAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                          {format(new Date(d.duplicateSeenAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3 capitalize text-stone-600">{d.resolution}</td>
                      </tr>
                    ))}
                    {(data?.duplicates ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                          No duplicate events
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Volume</CardTitle>
            <div className="flex gap-1.5">
              {(["daily", "weekly", "monthly"] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={volumeTab === tab ? "default" : "outline"}
                  onClick={() => setVolumeTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={1} />
            ) : volumeData.length > 0 ? (
              <BarChart data={volumeData} />
            ) : (
              <p className="text-sm text-stone-500">No volume data</p>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmDialog
        open={!!reprocessId}
        title="Reprocess transaction"
        description={
          reprocessTx
            ? `Retry processing ${reprocessTx.outTradeNo} for ${reprocessTx.merchantName}.`
            : ""
        }
        confirmLabel="Reprocess"
        loading={reprocessBusy}
        onConfirm={confirmReprocess}
        onOpenChange={(open) => {
          if (!open && !reprocessBusy) setReprocessId(null);
        }}
      />
    </>
  );
}
