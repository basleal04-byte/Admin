export type UserRole = "admin";

export type PanelUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  mfaEnabled: boolean;
};

export type MerchantStatus = "pending" | "active" | "suspended";

export type Merchant = {
  id: string;
  name: string;
  category: string;
  city: string;
  phone: string;
  status: MerchantStatus;
  kycVerified: boolean;
  totalVolumeEtb: number;
  joinedAt: string;
};

export type TransactionStatus = "success" | "pending" | "failed" | "disputed";

export type Transaction = {
  id: string;
  outTradeNo: string;
  merchantId: string;
  merchantName: string;
  amountEtb: number;
  feeEtb: number;
  userPointsEtb: number;
  birrbackFeeEtb: number;
  birrPoints: number;
  msisdn: string;
  status: TransactionStatus;
  type: "payment" | "remittance" | "refund";
  createdAt: string;
};

export type CampaignStatus = "draft" | "active" | "paused" | "ended";

export type Campaign = {
  id: string;
  title: string;
  merchantName: string;
  bonusPoints: number;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
  redemptions: number;
};

export type FeeConfig = {
  marketingFeeRate: number;
  userShare: number;
  birrbackShare: number;
  pointsPerEtb: number;
  updatedAt: string;
  updatedBy: string;
};

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "merchant.approve"
  | "merchant.suspend"
  | "campaign.activate"
  | "campaign.pause"
  | "campaign.end"
  | "fee.update";

export type AuditEvent = {
  id: string;
  action: AuditAction;
  actor: string;
  target: string;
  detail: string;
  ip: string;
  createdAt: string;
};

export type DashboardStats = {
  totalMerchants: number;
  activeMerchants: number;
  pendingMerchants: number;
  volumeEtb24h: number;
  revenueEtb24h: number;
  pointsIssued24h: number;
  txCount24h: number;
  openDisputes: number;
};
