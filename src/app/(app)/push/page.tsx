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
import { usePush } from "@/hooks/use-data";
import { formatNumber } from "@/lib/utils";
import type { PushAudience } from "@/types";

const AUDIENCES: Array<{ id: PushAudience; label: string }> = [
  { id: "user", label: "Single user" },
  { id: "merchant_customers", label: "Merchant customers" },
  { id: "all_active", label: "All active users" },
];

export default function PushPage() {
  const { data, loading, error, send } = usePush();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<PushAudience>("user");
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);

  async function submitSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await send({ title, body, audience, target });
      setTitle("");
      setBody("");
      setTarget("");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Push"
        description="Templates and outbound messages"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={3} />
              </div>
            ) : error ? (
              <div className="p-5">
                <ErrorState message={error} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Body</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.templates ?? []).map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3.5 font-medium">{t.name}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline">{t.category}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{t.body}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Guard permission="push:write">
          <Card>
            <CardHeader>
              <CardTitle>Send message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitSend} className="grid max-w-lg gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Input
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Audience</Label>
                  <select
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as PushAudience)}
                    className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target (user ID or merchant ID)</Label>
                  <Input
                    id="target"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Guard>

        <Card>
          <CardHeader>
            <CardTitle>Messages log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={5} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Audience</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Sent</th>
                      <th className="px-5 py-3 font-medium">Delivered</th>
                      <th className="px-5 py-3 font-medium">Failed</th>
                      <th className="px-5 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.messages ?? []).map((m) => (
                      <tr key={m.id}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{m.title}</p>
                          <p className="text-xs text-stone-500">{m.body}</p>
                        </td>
                        <td className="px-5 py-3.5 capitalize">{m.audience.replace("_", " ")}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={m.status === "failed" ? "destructive" : "default"}>
                            {m.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(m.sent)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(m.delivered)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(m.failed)}</td>
                        <td className="px-5 py-3.5 text-stone-500">
                          {format(new Date(m.createdAt), "MMM d · HH:mm")}
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
    </>
  );
}
