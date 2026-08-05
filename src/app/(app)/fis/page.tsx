"use client";

import { useState, Fragment } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { BarChart } from "@/components/charts";
import { useFis } from "@/hooks/use-data";
import { formatEtb } from "@/lib/utils";

export default function FisPage() {
  const { data, loading, error, flag } = useFis();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState("");
  const [reason, setReason] = useState("");
  const [flagging, setFlagging] = useState(false);

  async function submitFlag(e: React.FormEvent) {
    e.preventDefault();
    if (!merchantId.trim() || !reason.trim()) return;
    setFlagging(true);
    try {
      await flag(merchantId.trim(), reason.trim());
      setMerchantId("");
      setReason("");
    } finally {
      setFlagging(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Integrity scores"
        description="Merchant FIS tiers and bank referrals"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Scored merchants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={5} />
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
                      <th className="px-5 py-3 font-medium">Tier</th>
                      <th className="px-5 py-3 font-medium">Score</th>
                      <th className="px-5 py-3 font-medium text-right">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.merchants ?? []).map((m) => (
                      <Fragment key={m.id}>
                        <tr className="hover:bg-stone-50/60">
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs font-mono text-stone-500">{m.id}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="outline" className="capitalize">
                              {m.creditTier}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 tabular-nums font-medium">
                            {m.integrityScore}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setExpanded(expanded === m.id ? null : m.id)
                              }
                            >
                              {expanded === m.id ? "Hide" : "Show"}
                            </Button>
                          </td>
                        </tr>
                        {expanded === m.id ? (
                          <tr>
                            <td colSpan={4} className="bg-stone-50/50 px-5 py-4">
                              <BarChart
                                data={m.history.map((h) => ({
                                  label: format(new Date(h.date), "MMM d"),
                                  value: h.score,
                                }))}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
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
              <CardTitle>Referrals</CardTitle>
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
                        <th className="px-5 py-3 font-medium">Merchant</th>
                        <th className="px-5 py-3 font-medium">Partner</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.referrals ?? []).map((r) => (
                        <tr key={r.id}>
                          <td className="px-5 py-3.5">{r.merchantName}</td>
                          <td className="px-5 py-3.5">{r.partner}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant="outline">{r.status}</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {format(new Date(r.createdAt), "MMM d, yyyy")}
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
              <CardTitle>Licensing fees</CardTitle>
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
                        <th className="px-5 py-3 font-medium">Partner</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.licensing ?? []).map((l) => (
                        <tr key={l.id}>
                          <td className="px-5 py-3.5">{l.partner}</td>
                          <td className="px-5 py-3.5 tabular-nums">{formatEtb(l.amountEtb)}</td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {format(new Date(l.receivedAt), "MMM d, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Guard permission="fis:write">
          <Card>
            <CardHeader>
              <CardTitle>Flag merchant</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitFlag} className="grid max-w-md gap-4">
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Merchant ID</Label>
                  <Input
                    id="merchantId"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={flagging}>
                  {flagging ? "Submitting…" : "Flag"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Guard>
      </main>
    </>
  );
}
