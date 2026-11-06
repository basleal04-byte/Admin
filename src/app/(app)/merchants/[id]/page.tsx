"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Guard, useCan } from "@/components/guard";
import {
  CampaignStatusBadge,
  MerchantStatusBadge,
} from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useMerchant, useMerchants } from "@/hooks/use-data";
import { formatEtb, formatNumber, formatPercent } from "@/lib/utils";
import type { MerchantStatus } from "@/types";

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useMerchant(id);
  const { update, setStatus } = useMerchants();
  const canApprove = useCan("merchants:approve");
  const [cashbackPct, setCashbackPct] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<MerchantStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const merchant = data?.merchant;

  useEffect(() => {
    if (!merchant) return;
    setCashbackPct(String(merchant.cashbackRate * 100));
    setCategory(merchant.category);
  }, [merchant]);

  async function saveProfile() {
    if (!merchant) return;
    const rate = Number(cashbackPct) / 100;
    if (Number.isNaN(rate) || rate < 0) {
      setSaveError("Cashback rate must be a valid non-negative number.");
      return;
    }
    if (!category.trim()) {
      setSaveError("Category is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await update(merchant.id, { cashbackRate: rate, category: category.trim() });
      await refetch();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatus() {
    if (!merchant || !pendingStatus) return;
    setStatusBusy(true);
    setStatusNotice(null);
    try {
      const result = await setStatus(merchant.id, pendingStatus);
      if (
        result &&
        typeof result === "object" &&
        "pendingApproval" in result &&
        result.pendingApproval
      ) {
        setStatusNotice(
          result.message ||
            "Submitted for compliance approval. Merchant status is unchanged until approved."
        );
      }
      await refetch();
      setPendingStatus(null);
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={merchant?.name ?? "Merchant"}
        description={merchant ? `${merchant.city} · ${merchant.shortCode}` : undefined}
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Link href="/merchants" className="text-sm text-emerald-800 hover:underline">
          Back to merchants
        </Link>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} />
        ) : merchant ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  <MerchantStatusBadge status={merchant.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="text-stone-500">Short code</dt>
                      <dd className="font-mono font-medium">{merchant.shortCode}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Phone</dt>
                      <dd className="font-medium">{merchant.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Integrity score</dt>
                      <dd className="font-medium tabular-nums">{merchant.integrityScore}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Credit tier</dt>
                      <dd className="font-medium capitalize">{merchant.creditTier}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Joined</dt>
                      <dd className="font-medium">
                        {format(new Date(merchant.joinedAt), "MMM d, yyyy")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">KYC</dt>
                      <dd>
                        <Badge variant={merchant.kycVerified ? "default" : "warning"}>
                          {merchant.kycVerified ? "Verified" : "Pending"}
                        </Badge>
                      </dd>
                    </div>
                  </dl>

                  <Guard permission="merchants:write">
                    <div className="grid gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cashback">Cashback rate (%)</Label>
                        <Input
                          id="cashback"
                          type="number"
                          min={0}
                          step="any"
                          value={cashbackPct}
                          onChange={(e) => setCashbackPct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </div>
                      {saveError ? (
                        <p className="sm:col-span-2 text-sm text-red-700">{saveError}</p>
                      ) : null}
                      {statusNotice ? (
                        <p className="sm:col-span-2 text-sm text-amber-800">
                          {statusNotice}
                        </p>
                      ) : null}
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <Button onClick={saveProfile} disabled={saving}>
                          {saving ? "Saving" : "Save changes"}
                        </Button>
                        {merchant.status !== "active" ? (
                          <Button
                            variant="outline"
                            onClick={() => setPendingStatus("active")}
                          >
                            {canApprove ? "Approve" : "Request activation"}
                          </Button>
                        ) : null}
                        {merchant.status !== "suspended" &&
                        merchant.status !== "deactivated" ? (
                          <Button
                            variant="outline"
                            onClick={() => setPendingStatus("suspended")}
                          >
                            {canApprove ? "Suspend" : "Request suspend"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Guard>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Volume" value={formatEtb(merchant.totalVolumeEtb)} />
                  <Row label="Transactions" value={formatNumber(merchant.totalTransactions)} />
                  <Row label="Commission" value={formatEtb(merchant.totalCommissionEtb)} />
                  <Row label="Points issued" value={formatNumber(merchant.totalPointsIssued)} />
                  <Row label="Cashback rate" value={formatPercent(merchant.cashbackRate)} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Webhook logs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Trade</th>
                        <th className="px-5 py-3 font-medium">Event</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Latency</th>
                        <th className="px-5 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.webhooks ?? []).map((w) => (
                        <tr key={w.id}>
                          <td className="px-5 py-3 font-mono text-xs">{w.outTradeNo}</td>
                          <td className="px-5 py-3 text-stone-600">{w.event}</td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={
                                w.status === "success"
                                  ? "default"
                                  : w.status === "retrying"
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              {w.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 tabular-nums text-stone-600">
                            {w.latencyMs}ms
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                            {format(new Date(w.createdAt), "MMM d · HH:mm")}
                          </td>
                        </tr>
                      ))}
                      {(data?.webhooks ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                            No webhook events
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Happy hour campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {(data?.campaigns ?? []).length === 0 ? (
                    <p className="text-sm text-stone-500">No campaigns</p>
                  ) : (
                    <ul className="divide-y divide-stone-100">
                      {(data?.campaigns ?? []).map((c) => (
                        <li key={c.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                          <div>
                            <p className="font-medium text-stone-900">{c.title}</p>
                            <p className="text-xs text-stone-500">
                              +{formatNumber(c.bonusPoints)} BP ·{" "}
                              {format(new Date(c.startsAt), "MMM d")} to{" "}
                              {format(new Date(c.endsAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <CampaignStatusBadge status={c.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>FIS history</CardTitle>
                </CardHeader>
                <CardContent>
                  {(data?.fisHistory ?? []).length === 0 ? (
                    <p className="text-sm text-stone-500">No FIS data</p>
                  ) : (
                    <ul className="space-y-2">
                      {(data?.fisHistory ?? []).map((p) => (
                        <li
                          key={p.date}
                          className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm"
                        >
                          <span className="text-stone-600">
                            {format(new Date(p.date), "MMM d, yyyy")}
                          </span>
                          <span className="font-medium tabular-nums">{p.score}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>

      <ConfirmDialog
        open={!!pendingStatus}
        title={
          pendingStatus === "active"
            ? canApprove
              ? "Approve merchant"
              : "Request merchant activation"
            : canApprove
              ? "Suspend merchant"
              : "Request merchant suspension"
        }
        description={
          merchant && pendingStatus === "active"
            ? canApprove
              ? `Activate ${merchant.name} and mark KYC verified. This is the final compliance decision.`
              : `Submit ${merchant.name} for compliance approval. Activation will not take effect until a merchant approver confirms it.`
            : merchant
              ? canApprove
                ? `Suspend ${merchant.name}.`
                : `Submit suspension of ${merchant.name} for compliance approval.`
              : ""
        }
        confirmLabel={
          pendingStatus === "active"
            ? canApprove
              ? "Approve"
              : "Request activation"
            : canApprove
              ? "Suspend"
              : "Request suspend"
        }
        destructive={pendingStatus === "suspended"}
        loading={statusBusy}
        onConfirm={confirmStatus}
        onOpenChange={(open) => {
          if (!open && !statusBusy) setPendingStatus(null);
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2 last:border-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium tabular-nums text-stone-900">{value}</span>
    </div>
  );
}
