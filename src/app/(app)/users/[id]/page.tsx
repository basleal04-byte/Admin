"use client";

import { useState } from "react";
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
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useConsumer } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, setStatus, adjustPoints } = useConsumer(id);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendBusy, setSuspendBusy] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const user = data?.user;

  async function confirmSuspend() {
    setSuspendBusy(true);
    try {
      await setStatus("suspended");
      setSuspendOpen(false);
    } finally {
      setSuspendBusy(false);
    }
  }

  function openAdjust() {
    setFormError(null);
    const pts = Number(points);
    if (Number.isNaN(pts) || pts === 0) {
      setFormError("Points must be a non-zero number.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Reason is required.");
      return;
    }
    setAdjustOpen(true);
  }

  async function confirmAdjust() {
    const pts = Number(points);
    setAdjustBusy(true);
    try {
      await adjustPoints(pts, reason.trim());
      setPoints("");
      setReason("");
      setAdjustOpen(false);
    } finally {
      setAdjustBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={user?.name ?? "User"}
        description={user?.phone}
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Link href="/users" className="text-sm text-emerald-800 hover:underline">
          Back to users
        </Link>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} />
        ) : user ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  <Badge variant={user.status === "active" ? "default" : "destructive"}>
                    {user.status === "active" ? "Active" : "Suspended"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="text-stone-500">Phone</dt>
                      <dd className="font-medium">{user.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Balance</dt>
                      <dd className="font-medium tabular-nums text-emerald-800">
                        {formatNumber(user.pointsBalance)} BP
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Registered</dt>
                      <dd className="font-medium">
                        {format(new Date(user.registeredAt), "MMM d, yyyy")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Last active</dt>
                      <dd className="font-medium">
                        {format(new Date(user.lastActiveAt), "MMM d, yyyy HH:mm")}
                      </dd>
                    </div>
                  </dl>
                  <Guard permission="users:write">
                    {user.status === "active" ? (
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => setSuspendOpen(true)}
                      >
                        Suspend user
                      </Button>
                    ) : null}
                  </Guard>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adjust points</CardTitle>
                </CardHeader>
                <CardContent>
                  <Guard permission="users:points">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="points">Points delta</Label>
                        <Input
                          id="points"
                          type="number"
                          step={1}
                          placeholder="e.g. 500 or -200"
                          value={points}
                          onChange={(e) => setPoints(e.target.value)}
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
                      {formError ? (
                        <p className="text-sm text-red-700">{formError}</p>
                      ) : null}
                      <Button onClick={openAdjust}>Apply adjustment</Button>
                    </div>
                  </Guard>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Points ledger</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Points</th>
                        <th className="px-5 py-3 font-medium">Reason</th>
                        <th className="px-5 py-3 font-medium">Merchant</th>
                        <th className="px-5 py-3 font-medium">Actor</th>
                        <th className="px-5 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(data?.ledger ?? []).map((e) => (
                        <tr key={e.id}>
                          <td className="px-5 py-3 capitalize text-stone-600">
                            {e.type.replace("_", " ")}
                          </td>
                          <td
                            className={`px-5 py-3 tabular-nums font-medium ${
                              e.points >= 0 ? "text-emerald-800" : "text-red-700"
                            }`}
                          >
                            {e.points >= 0 ? "+" : ""}
                            {formatNumber(e.points)}
                          </td>
                          <td className="px-5 py-3 text-stone-600">{e.reason}</td>
                          <td className="px-5 py-3 text-stone-500">
                            {e.merchantName ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-stone-500">{e.actor ?? "—"}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                            {format(new Date(e.createdAt), "MMM d · HH:mm")}
                          </td>
                        </tr>
                      ))}
                      {(data?.ledger ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-stone-500">
                            No ledger entries
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
                  <CardTitle>Merchant visits</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                        <tr>
                          <th className="px-5 py-3 font-medium">Merchant</th>
                          <th className="px-5 py-3 font-medium">Visits</th>
                          <th className="px-5 py-3 font-medium">Spend</th>
                          <th className="px-5 py-3 font-medium">Last visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {(data?.merchants ?? []).map((m) => (
                          <tr key={m.merchantId}>
                            <td className="px-5 py-3 font-medium">{m.merchantName}</td>
                            <td className="px-5 py-3 tabular-nums">{m.visitCount}</td>
                            <td className="px-5 py-3 tabular-nums">
                              {formatEtb(m.totalSpendEtb)}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                              {format(new Date(m.lastVisitAt), "MMM d, yyyy")}
                            </td>
                          </tr>
                        ))}
                        {(data?.merchants ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-stone-500">
                              No merchant visits
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redemption history</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                        <tr>
                          <th className="px-5 py-3 font-medium">Channel</th>
                          <th className="px-5 py-3 font-medium">Points</th>
                          <th className="px-5 py-3 font-medium">Amount</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {(data?.redemptions ?? []).map((r) => (
                          <tr key={r.id}>
                            <td className="px-5 py-3 capitalize text-stone-600">{r.channel}</td>
                            <td className="px-5 py-3 tabular-nums">{formatNumber(r.points)}</td>
                            <td className="px-5 py-3 tabular-nums">{formatEtb(r.amountEtb)}</td>
                            <td className="px-5 py-3">
                              <Badge
                                variant={
                                  r.status === "success"
                                    ? "default"
                                    : r.status === "pending"
                                      ? "warning"
                                      : "destructive"
                                }
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                              {format(new Date(r.createdAt), "MMM d · HH:mm")}
                            </td>
                          </tr>
                        ))}
                        {(data?.redemptions ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                              No redemptions
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>

      <ConfirmDialog
        open={suspendOpen}
        title="Suspend user"
        description={user ? `Suspend ${user.name}. They will not earn or redeem points.` : ""}
        confirmLabel="Suspend"
        destructive
        loading={suspendBusy}
        onConfirm={confirmSuspend}
        onOpenChange={(open) => {
          if (!open && !suspendBusy) setSuspendOpen(false);
        }}
      />

      <ConfirmDialog
        open={adjustOpen}
        title="Adjust points"
        description={
          user
            ? `Apply ${points} points to ${user.name}. Reason: ${reason.trim()}`
            : ""
        }
        confirmLabel="Apply"
        loading={adjustBusy}
        onConfirm={confirmAdjust}
        onOpenChange={(open) => {
          if (!open && !adjustBusy) setAdjustOpen(false);
        }}
      />
    </>
  );
}
