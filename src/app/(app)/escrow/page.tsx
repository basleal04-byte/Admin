"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useEscrow } from "@/hooks/use-data";
import { formatEtb } from "@/lib/utils";

export default function EscrowPage() {
  const { data, loading, error, reconcile } = useEscrow();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function runReconcile() {
    setBusy(true);
    try {
      await reconcile();
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const snap = data?.snapshot;

  return (
    <>
      <PageHeader
        title="Escrow"
        description="Pool balance, liability, and reconciliation"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} />
        ) : snap ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Balance" value={formatEtb(snap.balanceEtb)} />
              <Stat label="Inflows today" value={formatEtb(snap.inflowsTodayEtb)} />
              <Stat label="Outflows today" value={formatEtb(snap.outflowsTodayEtb)} />
              <Stat
                label="Outstanding liability"
                value={formatEtb(snap.outstandingLiabilityEtb)}
              />
              <Stat
                label="Scheduled breakage"
                value={formatEtb(snap.scheduledBreakageEtb)}
              />
              <Stat
                label="Formalization bonus (month)"
                value={formatEtb(snap.formalizationBonusMonthEtb)}
              />
              <Stat
                label="Formalization bonus (total)"
                value={formatEtb(snap.formalizationBonusTotalEtb)}
              />
              <Stat
                label="Last reconciled"
                value={format(new Date(snap.lastReconciledAt), "MMM d, HH:mm")}
              />
            </div>

            <div className="flex justify-end">
              <Guard permission="escrow:write">
                <Button onClick={() => setConfirmOpen(true)}>Reconcile</Button>
              </Guard>
            </div>
          </>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Breakage history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={4} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Month</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Destination</th>
                      <th className="px-5 py-3 font-medium">Transferred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.breakage ?? []).map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5 font-medium">{b.month}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(b.amountEtb)}</td>
                        <td className="px-5 py-3.5 text-stone-600">{b.destination}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(b.transferredAt), "MMM d, yyyy")}
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
            <CardTitle>Reconciliation history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={4} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">When</th>
                      <th className="px-5 py-3 font-medium">Actor</th>
                      <th className="px-5 py-3 font-medium">Ledger</th>
                      <th className="px-5 py-3 font-medium">Escrow</th>
                      <th className="px-5 py-3 font-medium">Delta</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.recon ?? []).map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(r.createdAt), "MMM d · HH:mm")}
                        </td>
                        <td className="px-5 py-3.5">{r.actor}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(r.ledgerEtb)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(r.escrowEtb)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(r.deltaEtb)}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={r.status === "matched" ? "default" : "destructive"}>
                            {r.status}
                          </Badge>
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
        open={confirmOpen}
        title="Run reconciliation"
        description="Compare ledger totals against escrow balance and record the result."
        confirmLabel="Reconcile"
        loading={busy}
        onConfirm={runReconcile}
        onOpenChange={(open) => {
          if (!busy) setConfirmOpen(open);
        }}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
