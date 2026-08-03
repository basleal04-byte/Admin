"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TxStatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useTransactions } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";
import type { TransactionStatus } from "@/types";

const FILTERS: Array<{ id: "all" | TransactionStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "disputed", label: "Disputed" },
  { id: "failed", label: "Failed" },
];

export default function TransactionsPage() {
  const { data, loading, error } = useTransactions();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | TransactionStatus>("all");

  const rows = useMemo(() => {
    const list = data ?? [];
    return list.filter((t) => {
      const matchesFilter = filter === "all" || t.status === filter;
      const needle = q.trim().toLowerCase();
      const matchesQ =
        !needle ||
        t.merchantName.toLowerCase().includes(needle) ||
        t.outTradeNo.toLowerCase().includes(needle) ||
        t.msisdn.toLowerCase().includes(needle);
      return matchesFilter && matchesQ;
    });
  }, [data, filter, q]);

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Telebirr payments, remittances, and fee splits"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search trade no, merchant, MSISDN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
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
        </div>

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
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Trade</th>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Split</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <p className="font-medium tabular-nums text-stone-900">
                            {t.outTradeNo}
                          </p>
                          <p className="text-xs capitalize text-stone-500">
                            {t.type} · {t.msisdn}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-stone-700">{t.merchantName}</td>
                        <td className="px-5 py-3.5 font-medium tabular-nums">
                          {formatEtb(t.amountEtb)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-stone-500">
                          <p>Fee {formatEtb(t.feeEtb)}</p>
                          <p>
                            User {formatEtb(t.userPointsEtb)} · BB{" "}
                            {formatEtb(t.birrbackFeeEtb)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-emerald-800">
                          {formatNumber(t.birrPoints)}
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
                        <td colSpan={7} className="px-5 py-10 text-center text-stone-500">
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
      </main>
    </>
  );
}
