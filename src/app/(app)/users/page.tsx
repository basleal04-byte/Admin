"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useConsumers } from "@/hooks/use-data";
import { formatNumber } from "@/lib/utils";
import type { ConsumerStatus } from "@/types";

const statusVariant: Record<
  ConsumerStatus,
  "default" | "destructive"
> = {
  active: "default",
  suspended: "destructive",
};

export default function UsersPage() {
  const { data, loading, error } = useConsumers();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((u) => {
      const balanceStr = String(u.pointsBalance);
      return (
        u.name.toLowerCase().includes(needle) ||
        u.phone.toLowerCase().includes(needle) ||
        balanceStr.includes(needle)
      );
    });
  }, [data, q]);

  return (
    <>
      <PageHeader title="Users" description="Consumer accounts and BirrPoints balances" />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Input
          placeholder="Search phone, name, balance"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-sm"
        />

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
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Balance</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Registered</th>
                      <th className="px-5 py-3 font-medium">Last active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/users/${u.id}`}
                            className="font-medium text-emerald-800 hover:underline"
                          >
                            {u.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{u.phone}</td>
                        <td className="px-5 py-3.5 tabular-nums font-medium text-emerald-800">
                          {formatNumber(u.pointsBalance)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusVariant[u.status]}>
                            {u.status === "active" ? "Active" : "Suspended"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(u.registeredAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                          {format(new Date(u.lastActiveAt), "MMM d · HH:mm")}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-stone-500">
                          No users match this search.
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
    </>
  );
}
