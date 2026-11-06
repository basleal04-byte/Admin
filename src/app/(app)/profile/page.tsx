"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { api } from "@/lib/client";
import { formatEtb, formatNumber } from "@/lib/utils";
import type {
  Consumer,
  PointsLedgerEntry,
  Redemption,
  UserMerchantStat,
} from "@/types";

type ProfilePayload = {
  user: Consumer;
  ledger: PointsLedgerEntry[];
  merchants: UserMerchantStat[];
  redemptions: Redemption[];
};

export default function MyProfilePage() {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api<ProfilePayload>("/api/admin/me/profile");
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const user = data?.user;

  return (
    <>
      <PageHeader
        title={user?.name ?? "My profile"}
        description={user?.phone}
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} />
        ) : user ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <Badge
                  variant={user.status === "active" ? "default" : "destructive"}
                >
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
              </CardContent>
            </Card>

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
                          <td className="px-5 py-3 text-stone-500">
                            {e.actor ?? "—"}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                            {format(new Date(e.createdAt), "MMM d · HH:mm")}
                          </td>
                        </tr>
                      ))}
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
                            <td className="px-5 py-3 font-medium">
                              {m.merchantName}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {m.visitCount}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {formatEtb(m.totalSpendEtb)}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-stone-500">
                              {format(new Date(m.lastVisitAt), "MMM d, yyyy")}
                            </td>
                          </tr>
                        ))}
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
                            <td className="px-5 py-3 capitalize text-stone-600">
                              {r.channel}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {formatNumber(r.points)}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {formatEtb(r.amountEtb)}
                            </td>
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
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
