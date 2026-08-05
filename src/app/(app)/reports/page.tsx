"use client";

import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useReports } from "@/hooks/use-data";
import { formatEtb, formatNumber, formatPercent } from "@/lib/utils";

export default function ReportsPage() {
  const { data, loading, error } = useReports();

  function exportPdf() {
    if (!data) return;
    const lines = [
      "BirrBack Monthly Report",
      "",
      ...data.monthly.map(
        (m) =>
          `${m.month}: tx ${m.transactions}, issued ${m.pointsIssued}, redeemed ${m.pointsRedeemed}, commission ${m.commissionEtb} ETB`
      ),
    ];
    downloadBlob(lines.join("\n"), "report.txt", "text/plain");
  }

  function exportExcel() {
    if (!data) return;
    const header =
      "month,transactions,points_issued,points_redeemed,points_expired,commission_etb,brand_revenue_etb,ethio_share_etb,formalization_bonus_etb";
    const rows = data.monthly.map((m) =>
      [
        m.month,
        m.transactions,
        m.pointsIssued,
        m.pointsRedeemed,
        m.pointsExpired,
        m.commissionEtb,
        m.brandRevenueEtb,
        m.ethioShareEtb,
        m.formalizationBonusEtb,
      ].join(",")
    );
    downloadBlob([header, ...rows].join("\n"), "report.csv", "text/csv");
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Performance, uplift, and breakage"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!data} onClick={exportPdf}>
            Export PDF
          </Button>
          <Button variant="outline" disabled={!data} onClick={exportExcel}>
            Export Excel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={4} />
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
                      <th className="px-5 py-3 font-medium">Month</th>
                      <th className="px-5 py-3 font-medium">Tx</th>
                      <th className="px-5 py-3 font-medium">Issued</th>
                      <th className="px-5 py-3 font-medium">Redeemed</th>
                      <th className="px-5 py-3 font-medium">Expired</th>
                      <th className="px-5 py-3 font-medium">Commission</th>
                      <th className="px-5 py-3 font-medium">Brand revenue</th>
                      <th className="px-5 py-3 font-medium">Ethio share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.monthly ?? []).map((m) => (
                      <tr key={m.month}>
                        <td className="px-5 py-3.5 font-medium">{m.month}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(m.transactions)}</td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatNumber(m.pointsIssued)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatNumber(m.pointsRedeemed)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatNumber(m.pointsExpired)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(m.commissionEtb)}</td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatEtb(m.brandRevenueEtb)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(m.ethioShareEtb)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Merchant uplift</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-5">
                  <TableSkeleton rows={4} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Merchant</th>
                        <th className="px-5 py-3 font-medium">Before</th>
                        <th className="px-5 py-3 font-medium">After</th>
                        <th className="px-5 py-3 font-medium">Uplift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.uplift ?? []).map((u) => (
                        <tr key={u.merchantId}>
                          <td className="px-5 py-3.5">{u.merchantName}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatNumber(u.txBefore)}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatNumber(u.txAfter)}</td>
                          <td className="px-5 py-3.5 tabular-nums text-emerald-800">
                            {u.upliftPct.toFixed(1)}%
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
              <CardTitle>Cohorts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-5">
                  <TableSkeleton rows={4} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Cohort</th>
                        <th className="px-5 py-3 font-medium">D30</th>
                        <th className="px-5 py-3 font-medium">D60</th>
                        <th className="px-5 py-3 font-medium">D90</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.cohorts ?? []).map((c) => (
                        <tr key={c.cohort}>
                          <td className="px-5 py-3.5 font-medium">{c.cohort}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatPercent(c.d30)}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatPercent(c.d60)}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatPercent(c.d90)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Breakage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={3} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
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
                      <tr key={b.id}>
                        <td className="px-5 py-3.5 font-medium">{b.month}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(b.amountEtb)}</td>
                        <td className="px-5 py-3.5">{b.destination}</td>
                        <td className="px-5 py-3.5 text-stone-500">{b.transferredAt.slice(0, 10)}</td>
                      </tr>
                    ))}
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

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
