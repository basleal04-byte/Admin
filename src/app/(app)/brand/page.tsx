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
import { useBrand } from "@/hooks/use-data";
import { formatEtb, formatNumber } from "@/lib/utils";

export default function BrandPage() {
  const { data, loading, error, create, invoice } = useBrand();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [merchants, setMerchants] = useState("");
  const [sku, setSku] = useState("");
  const [bonusPoints, setBonusPoints] = useState("");
  const [budget, setBudget] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [invoicing, setInvoicing] = useState<string | null>(null);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await create({
        name,
        brand,
        targetMerchants: merchants.split(",").map((s) => s.trim()).filter(Boolean),
        sku,
        bonusPoints: Number(bonusPoints),
        budgetEtb: Number(budget),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      setName("");
      setBrand("");
      setMerchants("");
      setSku("");
      setBonusPoints("");
      setBudget("");
      setStartsAt("");
      setEndsAt("");
    } finally {
      setCreating(false);
    }
  }

  async function issueInvoice(campaignId: string) {
    setInvoicing(campaignId);
    try {
      await invoice(campaignId);
    } finally {
      setInvoicing(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Brand ads"
        description="Sponsored campaigns and invoicing"
      />
      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <Guard permission="brand:write">
          <Card>
            <CardHeader>
              <CardTitle>Create campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Name" value={name} onChange={setName} />
                <Field id="brand" label="Brand" value={brand} onChange={setBrand} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="merchants">Merchants (comma-separated IDs)</Label>
                  <Input
                    id="merchants"
                    value={merchants}
                    onChange={(e) => setMerchants(e.target.value)}
                    required
                  />
                </div>
                <Field id="sku" label="SKU" value={sku} onChange={setSku} />
                <Field
                  id="bonus"
                  label="Bonus points"
                  value={bonusPoints}
                  onChange={setBonusPoints}
                  type="number"
                />
                <Field
                  id="budget"
                  label="Budget (ETB)"
                  value={budget}
                  onChange={setBudget}
                  type="number"
                />
                <div className="space-y-2">
                  <Label htmlFor="starts">Starts</Label>
                  <Input
                    id="starts"
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends">Ends</Label>
                  <Input
                    id="ends"
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating…" : "Create campaign"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Guard>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
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
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium">Impressions</th>
                      <th className="px-5 py-3 font-medium">Bonuses</th>
                      <th className="px-5 py-3 font-medium">Units</th>
                      <th className="px-5 py-3 font-medium">Revenue</th>
                      <th className="px-5 py-3 font-medium">Ethio share</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.campaigns ?? []).map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-stone-500">
                            {c.brand} · {format(new Date(c.startsAt), "MMM d")} to{" "}
                            {format(new Date(c.endsAt), "MMM d, yyyy")}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatNumber(c.impressions)}</td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatNumber(c.bonusesTriggered)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatNumber(c.unitsInfluenced)}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(c.revenueEtb)}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(c.ethioShareEtb)}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={c.status === "active" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Guard permission="brand:write">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={invoicing === c.id}
                              onClick={() => issueInvoice(c.id)}
                            >
                              {invoicing === c.id ? "Issuing…" : "Invoice"}
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

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={3} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Brand</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(data?.invoices ?? []).map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-5 py-3.5">{inv.brand}</td>
                        <td className="px-5 py-3.5 tabular-nums">{formatEtb(inv.amountEtb)}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={inv.status === "paid" ? "default" : "outline"}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-stone-500">
                          {format(new Date(inv.issuedAt), "MMM d, yyyy")}
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

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
