"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Guard, useCan } from "@/components/guard";
import { MerchantStatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useMerchants } from "@/hooks/use-data";
import { formatPercent } from "@/lib/utils";
import type { MerchantStatus } from "@/types";

const STATUS_FILTERS: Array<{ id: "all" | MerchantStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "deactivated", label: "Deactivated" },
];

type PendingAction = {
  id: string;
  name: string;
  status: MerchantStatus;
} | null;

function actionCopy(
  canApprove: boolean
): Record<
  MerchantStatus,
  {
    title: string;
    description: (name: string) => string;
    label: string;
    destructive: boolean;
  }
> {
  return {
    active: canApprove
      ? {
          title: "Approve merchant",
          description: (name) =>
            `Activate ${name} and mark KYC verified. This is the final compliance decision.`,
          label: "Approve",
          destructive: false,
        }
      : {
          title: "Request merchant activation",
          description: (name) =>
            `Submit ${name} for compliance approval. Activation will not take effect until a merchant approver confirms it.`,
          label: "Request activation",
          destructive: false,
        },
    suspended: canApprove
      ? {
          title: "Suspend merchant",
          description: (name) => `Suspend ${name}. New payments will be blocked.`,
          label: "Suspend",
          destructive: true,
        }
      : {
          title: "Request merchant suspension",
          description: (name) =>
            `Submit suspension of ${name} for compliance approval.`,
          label: "Request suspend",
          destructive: true,
        },
    deactivated: canApprove
      ? {
          title: "Deactivate merchant",
          description: (name) => `Permanently deactivate ${name}.`,
          label: "Deactivate",
          destructive: true,
        }
      : {
          title: "Request merchant deactivation",
          description: (name) =>
            `Submit deactivation of ${name} for compliance approval.`,
          label: "Request deactivate",
          destructive: true,
        },
    pending: {
      title: "Update merchant",
      description: (name) => `Set ${name} to pending.`,
      label: "Confirm",
      destructive: false,
    },
  };
}

export default function MerchantsPage() {
  const { data, loading, error, setStatus } = useMerchants();
  const canApprove = useCan("merchants:approve");
  const copyFor = useMemo(() => actionCopy(canApprove), [canApprove]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MerchantStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set((data ?? []).map((m) => m.category))].sort(),
    [data]
  );
  const cities = useMemo(
    () => [...new Set((data ?? []).map((m) => m.city))].sort(),
    [data]
  );

  const rows = useMemo(() => {
    const list = data ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (cityFilter !== "all" && m.city !== cityFilter) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.city.toLowerCase().includes(needle) ||
        m.category.toLowerCase().includes(needle) ||
        m.shortCode.includes(needle)
      );
    });
  }, [data, statusFilter, categoryFilter, cityFilter, q]);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await setStatus(pending.id, pending.status);
      if (
        result &&
        typeof result === "object" &&
        "pendingApproval" in result &&
        result.pendingApproval
      ) {
        setNotice(
          result.message ||
            "Submitted for compliance approval. Merchant status is unchanged until approved."
        );
      }
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const copy = pending ? copyFor[pending.status] : null;

  return (
    <>
      <PageHeader
        title="Merchants"
        description={
          canApprove
            ? "Final merchant activation, suspension, and KYC decisions"
            : "Review partners and request activation — final approval is a separate compliance step"
        }
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {notice ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search name, city, category, short code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-700"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-700"
            >
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">City</th>
                      <th className="px-5 py-3 font-medium">Short code</th>
                      <th className="px-5 py-3 font-medium">Cashback</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">FIS</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((m) => (
                      <tr key={m.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/merchants/${m.id}`}
                            className="font-medium text-emerald-800 hover:underline"
                          >
                            {m.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{m.category}</td>
                        <td className="px-5 py-3.5 text-stone-600">{m.city}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-stone-700">
                          {m.shortCode}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-stone-700">
                          {formatPercent(m.cashbackRate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <MerchantStatusBadge status={m.status} />
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-stone-700">
                          {m.integrityScore}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(m.joinedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5">
                          <Guard permission="merchants:write">
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
                                  {canApprove ? "Approve" : "Request activation"}
                                </Button>
                              ) : null}
                              {m.status !== "suspended" && m.status !== "deactivated" ? (
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
                                  {canApprove ? "Suspend" : "Request suspend"}
                                </Button>
                              ) : null}
                              {m.status !== "deactivated" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setPending({
                                      id: m.id,
                                      name: m.name,
                                      status: "deactivated",
                                    })
                                  }
                                >
                                  {canApprove ? "Deactivate" : "Request deactivate"}
                                </Button>
                              ) : null}
                            </div>
                          </Guard>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center text-stone-500">
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
        title={copy?.title ?? ""}
        description={pending && copy ? copy.description(pending.name) : ""}
        confirmLabel={copy?.label}
        destructive={copy?.destructive}
        loading={busy}
        onConfirm={confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
      />
    </>
  );
}
