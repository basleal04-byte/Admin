"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CampaignStatusBadge } from "@/components/status-badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useCampaigns } from "@/hooks/use-data";
import { formatNumber } from "@/lib/utils";
import type { Campaign } from "@/types";

type PendingAction = {
  id: string;
  title: string;
  status: Campaign["status"];
} | null;

export default function CampaignsPage() {
  const { data, loading, error, setStatus } = useCampaigns();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

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
        title="Campaigns"
        description="Loyalty offers"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
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
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Bonus BP</th>
                      <th className="px-5 py-3 font-medium">Window</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data ?? []).map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-stone-900">{c.title}</p>
                          <p className="text-xs text-stone-500">
                            {formatNumber(c.redemptions)} redemptions
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{c.merchantName}</td>
                        <td className="px-5 py-3.5 tabular-nums text-emerald-800">
                          +{formatNumber(c.bonusPoints)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(c.startsAt), "MMM d")} to{" "}
                          {format(new Date(c.endsAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5">
                          <CampaignStatusBadge status={c.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            {c.status === "active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPending({
                                    id: c.id,
                                    title: c.title,
                                    status: "paused",
                                  })
                                }
                              >
                                Pause
                              </Button>
                            ) : null}
                            {c.status === "paused" || c.status === "draft" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setPending({
                                    id: c.id,
                                    title: c.title,
                                    status: "active",
                                  })
                                }
                              >
                                Activate
                              </Button>
                            ) : null}
                            {c.status === "active" || c.status === "paused" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setPending({
                                    id: c.id,
                                    title: c.title,
                                    status: "ended",
                                  })
                                }
                              >
                                End
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmDialog
        open={!!pending}
        title="Update campaign"
        description={
          pending
            ? `Set "${pending.title}" to ${pending.status}.`
            : ""
        }
        confirmLabel="Confirm"
        destructive={pending?.status === "ended"}
        loading={busy}
        onConfirm={confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
      />
    </>
  );
}
