import { Badge } from "@/components/ui/badge";
import type {
  CampaignStatus,
  MerchantStatus,
  TransactionStatus,
  WebhookStatus,
} from "@/types";

const merchantMap: Record<
  MerchantStatus,
  { label: string; variant: "default" | "warning" | "destructive" | "secondary" }
> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  deactivated: { label: "Deactivated", variant: "secondary" },
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

const webhookMap: Record<
  WebhookStatus,
  { label: string; variant: "default" | "warning" | "destructive" | "secondary" }
> = {
  success: { label: "Success", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  duplicate: { label: "Duplicate", variant: "secondary" },
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

export function WebhookStatusBadge({ status }: { status: WebhookStatus }) {
  const cfg = webhookMap[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = campaignMap[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
