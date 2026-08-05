"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/states";
import { Guard } from "@/components/guard";
import { useFees } from "@/hooks/use-data";
import { formatPercent } from "@/lib/utils";

export default function FeesPage() {
  const { data, loading, error, save } = useFees();
  const [marketingPct, setMarketingPct] = useState("10");
  const [userPct, setUserPct] = useState("70");
  const [birrbackPct, setBirrbackPct] = useState("30");
  const [pointsPerEtb, setPointsPerEtb] = useState("10");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setMarketingPct(String(data.marketingFeeRate * 100));
    setUserPct(String(data.userShare * 100));
    setBirrbackPct(String(data.birrbackShare * 100));
    setPointsPerEtb(String(data.pointsPerEtb));
  }, [data]);

  function validate():
    | { error: string }
    | {
        marketingFeeRate: number;
        userShare: number;
        birrbackShare: number;
        pointsPerEtb: number;
      } {
    const marketingFeeRate = Number(marketingPct) / 100;
    const userShare = Number(userPct) / 100;
    const birrbackShare = Number(birrbackPct) / 100;
    const pts = Number(pointsPerEtb);

    if (
      [marketingFeeRate, userShare, birrbackShare, pts].some(
        (n) => Number.isNaN(n) || n < 0
      )
    ) {
      return { error: "All values must be valid non-negative numbers." };
    }

    if (Math.abs(userShare + birrbackShare - 1) > 0.001) {
      return {
        error: "User share and BirrBack share of the fee must sum to 100%.",
      };
    }

    return { marketingFeeRate, userShare, birrbackShare, pointsPerEtb: pts };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setMessage(null);
    const result = validate();
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSave() {
    const result = validate();
    if ("error" in result) {
      setFormError(result.error);
      setConfirmOpen(false);
      return;
    }

    setSaving(true);
    try {
      await save({
        marketingFeeRate: result.marketingFeeRate,
        userShare: result.userShare,
        birrbackShare: result.birrbackShare,
        pointsPerEtb: result.pointsPerEtb,
      });
      setMessage("Fee config saved.");
      setConfirmOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Fee config"
        description="Marketing fee and 70/30 loyalty-platform split"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto grid max-w-3xl gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Split rules</CardTitle>
              <CardDescription>
                Merchant marketing fee is taken from each payment, then split
                between customer BirrPoints and BirrBack revenue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <ErrorState message={error} />
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <Field
                    id="marketing"
                    label="Marketing fee (% of sale)"
                    value={marketingPct}
                    onChange={setMarketingPct}
                  />
                  <Field
                    id="user"
                    label="User share of fee (%)"
                    value={userPct}
                    onChange={setUserPct}
                  />
                  <Field
                    id="birrback"
                    label="BirrBack share of fee (%)"
                    value={birrbackPct}
                    onChange={setBirrbackPct}
                  />
                  <Field
                    id="points"
                    label="BirrPoints per ETB (user share)"
                    value={pointsPerEtb}
                    onChange={setPointsPerEtb}
                  />

                  {formError ? (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {formError}
                    </p>
                  ) : null}
                  {message ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      {message}
                    </p>
                  ) : null}

                  <Guard permission="fees:write">
                    <Button type="submit">Save</Button>
                  </Guard>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>On a 1,000 ETB payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data ? (
                <>
                  <Row
                    label="Marketing fee"
                    value={formatPercent(Number(marketingPct) / 100 || 0)}
                  />
                  <Row
                    label="User points ledger"
                    value={`${(
                      1000 *
                      (Number(marketingPct) / 100) *
                      (Number(userPct) / 100)
                    ).toFixed(2)} ETB`}
                  />
                  <Row
                    label="BirrBack revenue"
                    value={`${(
                      1000 *
                      (Number(marketingPct) / 100) *
                      (Number(birrbackPct) / 100)
                    ).toFixed(2)} ETB`}
                  />
                  <Row
                    label="BirrPoints awarded"
                    value={String(
                      Math.round(
                        1000 *
                          (Number(marketingPct) / 100) *
                          (Number(userPct) / 100) *
                          (Number(pointsPerEtb) || 0)
                      )
                    )}
                  />
                  <p className="pt-2 text-xs text-stone-400">
                    Last updated{" "}
                    {format(new Date(data.updatedAt), "MMM d, yyyy HH:mm")} by{" "}
                    {data.updatedBy}
                  </p>
                </>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Save fee configuration"
        description="This updates the fee split for future payments."
        confirmLabel="Save"
        loading={saving}
        onConfirm={confirmSave}
        onOpenChange={(open) => {
          if (!saving) setConfirmOpen(open);
        }}
      />
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2 last:border-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium tabular-nums text-stone-900">{value}</span>
    </div>
  );
}
