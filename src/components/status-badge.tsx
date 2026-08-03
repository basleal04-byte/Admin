import { Badge } from "@/components/ui/badge";
import type { CampaignStatus, MerchantStatus, TransactionStatus } from "@/types";

const merchantMap: Record<
  MerchantStatus,
  { label: string; variant: "default" | "warning" | "destructive" | "secondary" }
> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
};

const txMap: Record<
  TransactionStatus,
  { label: string; variant: "default" | "warning" | "destructive" | "secondary" }
> = {
  success: { label: "Success", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
  disputed: { label: "Disputed", variant: "secondary" },
};

const campaignMap: Record<
  CampaignStatus,
  { label: string; variant: "default" | "warning" | "destructive" | "secondary" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  draft: { label: "Draft", variant: "outline" },
  paused: { label: "Paused", variant: "warning" },
  ended: { label: "Ended", variant: "secondary" },
};

export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  const cfg = merchantMap[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function TxStatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = txMap[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = campaignMap[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
