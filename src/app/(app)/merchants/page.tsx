"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MerchantStatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useMerchants } from "@/hooks/use-data";
import { formatEtb } from "@/lib/utils";
import type { MerchantStatus } from "@/types";

const FILTERS: Array<{ id: "all" | MerchantStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

type PendingAction = {
  id: string;
  name: string;
  status: MerchantStatus;
} | null;

export default function MerchantsPage() {
  const { data, loading, error, setStatus } = useMerchants();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | MerchantStatus>("all");
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const list = data ?? [];
    return list.filter((m) => {
      const matchesFilter = filter === "all" || m.status === filter;
      const needle = q.trim().toLowerCase();
      const matchesQ =
        !needle ||
        m.name.toLowerCase().includes(needle) ||
        m.city.toLowerCase().includes(needle) ||
        m.category.toLowerCase().includes(needle);
      return matchesFilter && matchesQ;
    });
  }, [data, filter, q]);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await setStatus(pending.id, pending.status);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Approve, suspend, and review partner KYC"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search name, city, category…"
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
                <TableSkeleton />
              </div>
            ) : error ? (
              <div className="p-5">
                <ErrorState message={error} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">City</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Volume</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((m) => (
                      <tr key={m.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-stone-900">{m.name}</p>
                          <p className="text-xs text-stone-500">
                            {m.category}
                            {m.kycVerified ? " · KYC ok" : " · KYC pending"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{m.city}</td>
                        <td className="px-5 py-3.5">
                          <MerchantStatusBadge status={m.status} />
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-stone-700">
                          {formatEtb(m.totalVolumeEtb)}
                        </td>
                        <td className="px-5 py-3.5 text-stone-500">
                          {format(new Date(m.joinedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            {m.status !== "active" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setPending({
                                    id: m.id,
                                    name: m.name,
                                    status: "active",
                                  })
                                }
                              >
                                Approve
                              </Button>
                            ) : null}
                            {m.status !== "suspended" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPending({
                                    id: m.id,
                                    name: m.name,
                                    status: "suspended",
                                  })
                                }
                              >
                                Suspend
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-stone-500">
                          No merchants match this filter.
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
        open={!!pending}
        title={pending?.status === "active" ? "Approve merchant" : "Suspend merchant"}
        description={
          pending
            ? pending.status === "active"
              ? `Activate ${pending.name} and mark KYC verified.`
              : `Suspend ${pending.name}.`
            : ""
        }
        confirmLabel={pending?.status === "active" ? "Approve" : "Suspend"}
        destructive={pending?.status === "suspended"}
        loading={busy}
        onConfirm={confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
      />
    </>
  );
}
