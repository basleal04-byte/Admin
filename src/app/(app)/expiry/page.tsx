"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useExpiry } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";

export default function ExpiryPage() {
  const { data, loading, error, remind, extend } = useExpiry();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [extendBusy, setExtendBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleUser(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function sendRemind(userId: string) {
    setBusy(userId);
    setMessage(null);
    try {
      await remind(userId);
      setMessage("Reminder sent.");
    } finally {
      setBusy(null);
    }
  }

  async function submitExtend(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const ids = [...selected];
    const d = Number(days);
    if (ids.length === 0 || !reason.trim() || Number.isNaN(d) || d < 1) return;
    setExtendBusy(true);
    try {
      await extend(ids, d, reason.trim());
      setSelected(new Set());
      setReason("");
      setMessage(`Extended ${ids.length} user(s) by ${d} days.`);
    } finally {
      setExtendBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Expiry"
        description="Upcoming point expiry and extensions"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Upcoming 30 days</CardTitle>
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
                      <th className="px-5 py-3 font-medium w-10"></th>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Expires</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.upcoming ?? []).map((row) => (
                      <tr key={row.userId} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <Guard permission="expiry:write">
                            <input
                              type="checkbox"
                              checked={selected.has(row.userId)}
                              onChange={() => toggleUser(row.userId)}
                              className="h-4 w-4 rounded border-stone-300"
                            />
                          </Guard>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{row.userName}</p>
                          <p className="text-xs text-stone-500">{row.userPhone}</p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(row.points)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(row.expiresAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Guard permission="expiry:write">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === row.userId}
                              onClick={() => sendRemind(row.userId)}
                            >
                              {busy === row.userId ? "Sending…" : "Remind"}
                            </Button>
                          </Guard>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Guard permission="expiry:write">
          <Card>
            <CardHeader>
              <CardTitle>Extend expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitExtend} className="grid max-w-md gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days">Days to extend</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
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
                <p className="text-xs text-stone-500">
                  {selected.size} user(s) selected from the table above.
                </p>
                <Button type="submit" disabled={extendBusy || selected.size === 0}>
                  {extendBusy ? "Extending…" : "Extend selected"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Guard>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reminders log</CardTitle>
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
                        <th className="px-5 py-3 font-medium">Phone</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.reminders ?? []).map((r) => (
                        <tr key={r.id}>
                          <td className="px-5 py-3.5">{r.userPhone}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={r.status === "failed" ? "destructive" : "default"}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {format(new Date(r.createdAt), "MMM d · HH:mm")}
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
              <CardTitle>Monthly reports</CardTitle>
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
                        <th className="px-5 py-3 font-medium">Month</th>
                        <th className="px-5 py-3 font-medium">Points expired</th>
                        <th className="px-5 py-3 font-medium">ETB value</th>
                        <th className="px-5 py-3 font-medium">Breakage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.reports ?? []).map((r) => (
                        <tr key={r.month}>
                          <td className="px-5 py-3.5 font-medium">{r.month}</td>
                          <td className="px-5 py-3.5 tabular-nums">
                            {formatNumber(r.pointsExpired)}
                          </td>
                          <td className="px-5 py-3.5 tabular-nums">{formatEtb(r.etbValue)}</td>
                          <td className="px-5 py-3.5 tabular-nums">
                            {formatEtb(r.breakageTriggeredEtb)}
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
      </main>
    </>
  );
}
