import {
  SEED_AUDIT,
  SEED_CAMPAIGNS,
  SEED_FEE_CONFIG,
  SEED_MERCHANTS,
  SEED_TRANSACTIONS,
} from "@/lib/mock-data";
import type {
  AuditAction,
  AuditEvent,
  Campaign,
  DashboardStats,
  FeeConfig,
  Merchant,
  MerchantStatus,
  Transaction,
} from "@/types";

const merchants: Merchant[] = structuredClone(SEED_MERCHANTS);
const transactions: Transaction[] = structuredClone(SEED_TRANSACTIONS);
const campaigns: Campaign[] = structuredClone(SEED_CAMPAIGNS);
const audit: AuditEvent[] = structuredClone(SEED_AUDIT);
let feeConfig: FeeConfig = structuredClone(SEED_FEE_CONFIG);

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function appendAudit(input: {
  action: AuditAction;
  actor: string;
  target: string;
  detail: string;
  ip?: string;
}) {
  audit.unshift({
    id: id("aud"),
    action: input.action,
    actor: input.actor,
    target: input.target,
    detail: input.detail,
    ip: input.ip ?? "0.0.0.0",
    createdAt: new Date().toISOString(),
  });
}

export const db = {
  dashboard(): DashboardStats {
    return {
      totalMerchants: merchants.length,
      activeMerchants: merchants.filter((m) => m.status === "active").length,
      pendingMerchants: merchants.filter((m) => m.status === "pending").length,
      volumeEtb24h: transactions
        .filter((t) => t.status === "success")
        .reduce((s, t) => s + t.amountEtb, 0),
      revenueEtb24h: transactions
        .filter((t) => t.status === "success")
        .reduce((s, t) => s + t.birrbackFeeEtb, 0),
      pointsIssued24h: transactions
        .filter((t) => t.status === "success")
        .reduce((s, t) => s + t.birrPoints, 0),
      txCount24h: transactions.length,
      openDisputes: transactions.filter((t) => t.status === "disputed").length,
    };
  },

  listMerchants() {
    return merchants.map((m) => ({ ...m }));
  },

  setMerchantStatus(
    merchantId: string,
    status: MerchantStatus,
    actor: string,
    ip: string
  ) {
    const merchant = merchants.find((m) => m.id === merchantId);
    if (!merchant) throw new Error("Merchant not found");
    merchant.status = status;
    if (status === "active") merchant.kycVerified = true;
    appendAudit({
      action: status === "active" ? "merchant.approve" : "merchant.suspend",
      actor,
      target: merchantId,
      detail: `${status === "active" ? "Approved" : "Suspended"} ${merchant.name}`,
      ip,
    });
    return { ...merchant };
  },

  listTransactions() {
    return [...transactions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },

  listCampaigns() {
    return campaigns.map((c) => ({ ...c }));
  },

  setCampaignStatus(
    campaignId: string,
    status: Campaign["status"],
    actor: string,
    ip: string
  ) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");
    campaign.status = status;
    const action =
      status === "active"
        ? "campaign.activate"
        : status === "paused"
          ? "campaign.pause"
          : "campaign.end";
    appendAudit({
      action,
      actor,
      target: campaignId,
      detail: `Set ${campaign.title} to ${status}`,
      ip,
    });
    return { ...campaign };
  },

  getFees() {
    return { ...feeConfig };
  },

  updateFees(
    patch: Partial<
      Pick<
        FeeConfig,
        "marketingFeeRate" | "userShare" | "birrbackShare" | "pointsPerEtb"
      >
    >,
    actor: string,
    ip: string
  ) {
    const next: FeeConfig = {
      ...feeConfig,
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
    if (Math.abs(next.userShare + next.birrbackShare - 1) > 0.001) {
      throw new Error("User share and BirrBack share must sum to 100%");
    }
    if (next.marketingFeeRate < 0 || next.marketingFeeRate > 1) {
      throw new Error("Marketing fee must be between 0% and 100%");
    }
    if (next.pointsPerEtb < 0) {
      throw new Error("Points per ETB must be non-negative");
    }
    feeConfig = next;
    appendAudit({
      action: "fee.update",
      actor,
      target: "fee_config",
      detail: `Fee ${next.marketingFeeRate * 100}% · user ${next.userShare * 100}% · platform ${next.birrbackShare * 100}%`,
      ip,
    });
    return { ...feeConfig };
  },

  listAudit() {
    return [...audit].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },
};
