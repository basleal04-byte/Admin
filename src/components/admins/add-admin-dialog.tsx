"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/client";
import type { AdminRole } from "@/types";

const ROLES: { value: AdminRole; label: string }[] = [
  { value: "ops", label: "Ops" },
  { value: "finance", label: "Finance" },
  { value: "support", label: "Support" },
  { value: "super_admin", label: "Super admin" },
];

type AddAdminDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    name: string;
    email: string;
    role: AdminRole;
  }) => Promise<{ message: string }>;
};

export function AddAdminDialog({
  open,
  onOpenChange,
  onCreate,
}: AddAdminDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("ops");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("ops");
    setError(null);
    setSuccess(null);
    setBusy(false);
  }

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setBusy(true);
    try {
      const result = await onCreate({
        name: name.trim(),
        email: email.trim(),
        role,
      });
      setSuccess(
        result.message ||
          `Invite email sent to ${email.trim()}. The temporary password is only in that email.`
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not create admin"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-900/40" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-stone-200 bg-white p-5 shadow-lg focus:outline-none"
          )}
        >
          <Dialog.Title className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            Add admin
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-stone-500">
            A secure temporary password is generated and emailed to the new
            admin. It is not shown in this panel.
          </Dialog.Description>

          {success ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {success}
              </p>
              <p className="text-sm text-stone-500">
                Staging MFA still uses the shared{" "}
                <span className="font-mono text-stone-700">MOCK_MFA_CODE</span>{" "}
                when MFA is enabled.
              </p>
              <div className="flex justify-end">
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Full name</Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sara Bekele"
                  disabled={busy}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Work email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops@birrback.com"
                  disabled={busy}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-role">Role</Label>
                <select
                  id="admin-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  disabled={busy}
                  className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending invite…" : "Create and email invite"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
