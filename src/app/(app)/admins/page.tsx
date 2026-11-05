"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddAdminDialog } from "@/components/admins/add-admin-dialog";
import { Guard } from "@/components/guard";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useAdmins } from "@/hooks/use-data";
import type { AdminRole } from "@/types";

export default function AdminsPage() {
  const { data: session } = useSession();
  const { data, loading, error, setStatus, create } = useAdmins();
  const [disableId, setDisableId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const currentEmail = session?.user?.email;
  const currentId = session?.user?.id;

  async function confirmDisable() {
    if (!disableId) return;
    setBusy(true);
    try {
      await setStatus(disableId, "disabled");
      setDisableId(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: {
    name: string;
    email: string;
    role: AdminRole;
  }) {
    return create(input);
  }

  return (
    <>
      <PageHeader
        title="Admins"
        description="Panel users and roles"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 sm:flex-1">
            MFA is required for all admin accounts. New admins receive a randomly
            generated password by email only.
          </p>
          <Guard permission="admins:write">
            <Button type="button" className="shrink-0" onClick={() => setAddOpen(true)}>
              Add admin
            </Button>
          </Guard>
        </div>

        <Card>
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
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Last login</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data ?? []).map((a) => {
                      const isSelf =
                        a.id === currentId ||
                        a.email.toLowerCase() === currentEmail?.toLowerCase();
                      return (
                        <tr key={a.id} className="hover:bg-stone-50/60">
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{a.email}</p>
                            <p className="text-xs text-stone-500">{a.name}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="outline">{a.role}</Badge>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-stone-500">
                            {a.lastLoginAt
                              ? format(new Date(a.lastLoginAt), "MMM d, yyyy HH:mm")
                              : "Never"}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={a.status === "active" ? "default" : "secondary"}>
                              {a.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {a.status === "active" && !isSelf ? (
                              <Guard permission="admins:write">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDisableId(a.id)}
                                >
                                  Disable
                                </Button>
                              </Guard>
                            ) : a.status === "disabled" && !isSelf ? (
                              <Guard permission="admins:write">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setStatus(a.id, "active")}
                                >
                                  Enable
                                </Button>
                              </Guard>
                            ) : isSelf ? (
                              <span className="text-xs text-stone-400">You</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddAdminDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={!!disableId}
        title="Disable admin"
        description="This account will no longer be able to sign in."
        confirmLabel="Disable"
        destructive
        loading={busy}
        onConfirm={confirmDisable}
        onOpenChange={(open) => {
          if (!open && !busy) setDisableId(null);
        }}
      />
    </>
  );
}
