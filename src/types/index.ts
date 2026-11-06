export type AdminRole =
  | "super_admin"
  | "ops"
  | "finance"
  | "support"
  | "end_user";

export type Permission =
  | "profile:read"
  | "dashboard:read"
  | "merchants:read"
  | "merchants:write"
  /** Final merchant activate / status decision. Ops may request only. */
  | "merchants:approve"
  | "users:read"
  | "users:write"
  | "users:points"
  | "transactions:read"
  | "transactions:reprocess"
  | "escrow:read"
  | "escrow:write"
  | "redemptions:read"
  | "redemptions:write"
  | "expiry:read"
  | "expiry:write"
  | "brand:read"
  | "brand:write"
  | "fis:read"
  | "fis:write"
  | "webhooks:read"
  | "push:read"
  | "push:write"
  | "reports:read"
  | "admins:read"
  | "admins:write"
  | "fees:write"
  | "audit:read"
  | "approvals:read"
  | "approvals:write";

export type PanelUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  status: "active" | "disabled";
  /** Linked consumer record for sample end_user logins */
  consumerId?: string;
};

export type MerchantStatus = "pending" | "active" | "suspended" | "deactivated";
export type CreditTier = "ineligible" | "bronze" | "silver" | "gold";

export type Merchant = {
  id: string;
  name: string;
  category: string;
  city: string;
  phone: string;
  shortCode: string;
  cashbackRate: number;
  status: MerchantStatus;
  kycVerified: boolean;
  totalVolumeEtb: number;
  totalTransactions: number;
  totalCommissionEtb: number;
  totalPointsIssued: number;
  integrityScore: number;
  creditTier: CreditTier;
  joinedAt: string;
};

export type MerchantWebhookLog = {
  id: string;
  merchantId: string;
  outTradeNo: string;
  event: string;
  status: "success" | "failed" | "retrying";
  reason: string | null;
  latencyMs: number;
  createdAt: string;
};

export type HappyHourCampaign = {
  id: string;
  merchantId: string;
  title: string;
  bonusPoints: number;
  status: "draft" | "active" | "paused" | "ended";
  startsAt: string;
  endsAt: string;
  redemptions: number;
  pointsIssued: number;
};

export type CampaignStatus = HappyHourCampaign["status"];

export type ConsumerStatus = "active" | "suspended";

export type Consumer = {
  id: string;
  name: string;
  phone: string;
  pointsBalance: number;
  status: ConsumerStatus;
  registeredAt: string;
  lastActiveAt: string;
};

export type PointsLedgerEntry = {
  id: string;
  userId: string;
  type: "earn" | "redeem" | "expire" | "adjust_credit" | "adjust_debit";
  points: number;
  reason: string;
  merchantName: string | null;
  actor: string | null;
  createdAt: string;
};

export type UserMerchantStat = {
  userId: string;
  merchantId: string;
  merchantName: string;
  visitCount: number;
  totalSpendEtb: number;
  lastVisitAt: string;
};

export type WebhookStatus = "success" | "failed" | "pending" | "duplicate";
export type TransactionStatus = "success" | "pending" | "failed" | "disputed";

export type Transaction = {
  id: string;
  outTradeNo: string;
  merchantId: string;
  merchantName: string;
  userId: string;
  userPhone: string;
  amountEtb: number;
  feeEtb: number;
  userPointsEtb: number;
  birrbackFeeEtb: number;
  birrPoints: number;
  commissionEtb: number;
  status: TransactionStatus;
  webhookStatus: WebhookStatus;
  type: "payment" | "remittance" | "refund";
  failureReason: string | null;
  createdAt: string;
};

export type DuplicateEvent = {
  id: string;
  outTradeNo: string;
  merchantName: string;
  firstSeenAt: string;
  duplicateSeenAt: string;
  resolution: "ignored" | "merged";
};

export type EscrowSnapshot = {
  balanceEtb: number;
  inflowsTodayEtb: number;
  outflowsTodayEtb: number;
  scheduledBreakageEtb: number;
  outstandingLiabilityEtb: number;
  formalizationBonusMonthEtb: number;
  formalizationBonusTotalEtb: number;
  lastReconciledAt: string;
};

export type BreakageSettlement = {
  id: string;
  month: string;
  amountEtb: number;
  transferredAt: string;
  destination: string;
};

export type ReconciliationRun = {
  id: string;
  actor: string;
  ledgerEtb: number;
  escrowEtb: number;
  deltaEtb: number;
  status: "matched" | "mismatch";
  createdAt: string;
};

export type RedemptionChannel = "wallet" | "airtime" | "data";
export type RedemptionStatus = "pending" | "success" | "failed";

export type Redemption = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  points: number;
  amountEtb: number;
  channel: RedemptionChannel;
  status: RedemptionStatus;
  failureReason: string | null;
  createdAt: string;
};

export type AirtimeArbitrage = {
  wholesalePurchasedEtb: number;
  faceValueRedeemedEtb: number;
  spreadEtb: number;
};

export type ExpiryRow = {
  userId: string;
  userName: string;
  userPhone: string;
  points: number;
  expiresAt: string;
};

export type ExpiryReminder = {
  id: string;
  userId: string;
  userPhone: string;
  status: "sent" | "delivered" | "failed";
  createdAt: string;
};

export type ExpiryReport = {
  month: string;
  pointsExpired: number;
  etbValue: number;
  breakageTriggeredEtb: number;
};

export type BrandCampaign = {
  id: string;
  name: string;
  brand: string;
  targetMerchants: string[];
  sku: string;
  bonusPoints: number;
  budgetEtb: number;
  impressions: number;
  bonusesTriggered: number;
  unitsInfluenced: number;
  revenueEtb: number;
  ethioShareEtb: number;
  status: "draft" | "active" | "ended";
  startsAt: string;
  endsAt: string;
};

export type BrandInvoice = {
  id: string;
  campaignId: string;
  brand: string;
  amountEtb: number;
  status: "draft" | "sent" | "paid";
  issuedAt: string;
};

export type FisHistoryPoint = {
  date: string;
  score: number;
};

export type BankReferral = {
  id: string;
  merchantId: string;
  merchantName: string;
  partner: string;
  status: "referred" | "under_review" | "approved" | "declined";
  createdAt: string;
};

export type LicensingFee = {
  id: string;
  partner: string;
  amountEtb: number;
  receivedAt: string;
};

export type IntegrationStatus = "up" | "degraded" | "down";

export type SystemHealth = {
  webhookDeliveryRate: number;
  avgProcessingMs: number;
  integrations: Array<{ name: string; status: IntegrationStatus; latencyMs: number }>;
  dbResponseMs: number;
  memoryUsedMb: number;
  activeConnections: number;
};

export type SecurityEvent = {
  id: string;
  type: "auth_failed" | "invalid_rsa" | "replay_suspected" | "data_access";
  detail: string;
  actor: string;
  createdAt: string;
};

export type PushAudience = "user" | "merchant_customers" | "all_active";
export type PushStatus = "scheduled" | "sent" | "delivered" | "failed";

export type PushTemplate = {
  id: string;
  name: string;
  body: string;
  category: "earn" | "redeem" | "expiry" | "campaign";
};

export type PushMessage = {
  id: string;
  title: string;
  body: string;
  audience: PushAudience;
  target: string;
  status: PushStatus;
  sent: number;
  delivered: number;
  failed: number;
  scheduledAt: string | null;
  createdAt: string;
  actor: string;
};

export type MonthlyReport = {
  month: string;
  transactions: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsExpired: number;
  commissionEtb: number;
  brandRevenueEtb: number;
  ethioShareEtb: number;
  formalizationBonusEtb: number;
};

export type MerchantUplift = {
  merchantId: string;
  merchantName: string;
  txBefore: number;
  txAfter: number;
  upliftPct: number;
};

export type CohortRetention = {
  cohort: string;
  d30: number;
  d60: number;
  d90: number;
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
  | "auth.forbidden"
  | "auth.password_reset_request"
  | "auth.password_reset"
  | "merchant.activate"
  | "merchant.suspend"
  | "merchant.deactivate"
  | "merchant.rate_update"
  | "merchant.category_update"
  | "user.suspend"
  | "user.points_adjust"
  | "transaction.reprocess"
  | "escrow.reconcile"
  | "redemption.retry"
  | "expiry.extend"
  | "expiry.remind"
  | "brand.create"
  | "brand.invoice"
  | "fis.flag"
  | "push.send"
  | "fees.update"
  | "admin.create"
  | "admin.disable"
  | "admin.password_change"
  | "approval.requested"
  | "approval.approved"
  | "approval.rejected";

export type AuditResult = "success" | "failure" | "pending";

export type AuditEvent = {
  id: string;
  action: AuditAction;
  actor: string;
  actorId?: string;
  target: string;
  detail: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
  result?: AuditResult;
  reason?: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
};

export type ApprovalKind =
  | "fees.update"
  | "user.points_adjust"
  | "user.status"
  | "merchant.status"
  | "merchant.update"
  | "escrow.reconcile"
  | "redemption.retry"
  | "transaction.reprocess"
  | "expiry.action"
  | "brand.create"
  | "brand.invoice"
  | "fis.flag"
  | "push.send"
  | "admin.status"
  | "campaign.status";

export type PendingApproval = {
  id: string;
  kind: ApprovalKind;
  action: AuditAction;
  actor: string;
  actorId?: string;
  actorRole: AdminRole;
  target: string;
  payload: Record<string, unknown>;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
};

export type DashboardOverview = {
  pointsToday: number;
  pointsWeek: number;
  pointsMonth: number;
  escrowBalanceEtb: number;
  activeUsersToday: number;
  qualifyingTxToday: number;
  commissionTodayEtb: number;
  activeMerchants: number;
  alerts: Array<{ id: string; severity: "high" | "medium" | "low"; message: string }>;
  liveFeed: Transaction[];
  volumeDaily: Array<{ label: string; value: number }>;
  volumeWeekly: Array<{ label: string; value: number }>;
  volumeMonthly: Array<{ label: string; value: number }>;
};

export type VolumeSeries = {
  daily: Array<{ label: string; value: number }>;
  weekly: Array<{ label: string; value: number }>;
  monthly: Array<{ label: string; value: number }>;
};
