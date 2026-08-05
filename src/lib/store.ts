import {
  SEED_AIRTIME,
  SEED_AUDIT,
  SEED_BRAND_CAMPAIGNS,
  SEED_BRAND_INVOICES,
  SEED_BREAKAGE,
  SEED_CAMPAIGNS,
  SEED_COHORTS,
  SEED_CONSUMERS,
  SEED_DUPLICATES,
  SEED_ESCROW,
  SEED_EXPIRY_REMINDERS,
  SEED_EXPIRY_REPORTS,
  SEED_EXPIRY_ROWS,
  SEED_FEE_CONFIG,
  SEED_FIS_HISTORY,
  SEED_HEALTH,
  SEED_LEDGER,
  SEED_LICENSING,
  SEED_MERCHANTS,
  SEED_MONTHLY_REPORTS,
  SEED_PUSH,
  SEED_PUSH_TEMPLATES,
  SEED_RECON,
  SEED_REDEMPTIONS,
  SEED_REFERRALS,
  SEED_SECURITY,
  SEED_TRANSACTIONS,
  SEED_UPLIFT,
  SEED_USER_MERCHANTS,
  SEED_WEBHOOK_LOGS,
  MOCK_USERS,
} from "@/lib/mock-data";
import type {
  AdminRole,
  AuditAction,
  AuditEvent,
  BrandCampaign,
  Consumer,
  ConsumerStatus,
  DashboardOverview,
  FeeConfig,
  HappyHourCampaign,
  Merchant,
  MerchantStatus,
  PanelUser,
  PushAudience,
  Redemption,
  Transaction,
} from "@/types";

const merchants = structuredClone(SEED_MERCHANTS);
const consumers = structuredClone(SEED_CONSUMERS);
const transactions = structuredClone(SEED_TRANSACTIONS);
const duplicates = structuredClone(SEED_DUPLICATES);
const webhookLogs = structuredClone(SEED_WEBHOOK_LOGS);
const campaigns = structuredClone(SEED_CAMPAIGNS);
const ledger = structuredClone(SEED_LEDGER);
const userMerchants = structuredClone(SEED_USER_MERCHANTS);
const escrow = structuredClone(SEED_ESCROW);
const breakage = structuredClone(SEED_BREAKAGE);
const recon = structuredClone(SEED_RECON);
const redemptions = structuredClone(SEED_REDEMPTIONS);
const airtime = structuredClone(SEED_AIRTIME);
const expiryRows = structuredClone(SEED_EXPIRY_ROWS);
const expiryReminders = structuredClone(SEED_EXPIRY_REMINDERS);
const expiryReports = structuredClone(SEED_EXPIRY_REPORTS);
const brandCampaigns = structuredClone(SEED_BRAND_CAMPAIGNS);
const brandInvoices = structuredClone(SEED_BRAND_INVOICES);
const fisHistory = structuredClone(SEED_FIS_HISTORY);
const referrals = structuredClone(SEED_REFERRALS);
const licensing = structuredClone(SEED_LICENSING);
const health = structuredClone(SEED_HEALTH);
const security = structuredClone(SEED_SECURITY);
const pushTemplates = structuredClone(SEED_PUSH_TEMPLATES);
const pushMessages = structuredClone(SEED_PUSH);
const monthlyReports = structuredClone(SEED_MONTHLY_REPORTS);
const uplift = structuredClone(SEED_UPLIFT);
const cohorts = structuredClone(SEED_COHORTS);
let feeConfig = structuredClone(SEED_FEE_CONFIG);
const audit = structuredClone(SEED_AUDIT);
const admins = structuredClone(MOCK_USERS);

function nid(prefix: string) {
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
    id: nid("aud"),
    action: input.action,
    actor: input.actor,
    target: input.target,
    detail: input.detail,
    ip: input.ip ?? "0.0.0.0",
    createdAt: new Date().toISOString(),
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getUTCFullYear() === n.getUTCFullYear() &&
    d.getUTCMonth() === n.getUTCMonth() &&
    d.getUTCDate() === n.getUTCDate()
  );
}

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export const db = {
  overview(): DashboardOverview {
    const success = transactions.filter((t) => t.status === "success");
    const today = success.filter((t) => isToday(t.createdAt));
    const weekStart = startOfWeek();
    const monthStart = startOfMonth();
    const week = success.filter((t) => new Date(t.createdAt) >= weekStart);
    const month = success.filter((t) => new Date(t.createdAt) >= monthStart);

    const alerts = [
      ...transactions
        .filter((t) => t.webhookStatus === "failed")
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          severity: "high" as const,
          message: `Failed webhook ${t.outTradeNo}: ${t.failureReason}`,
        })),
      ...health.integrations
        .filter((i) => i.status !== "up")
        .map((i) => ({
          id: i.name,
          severity: "medium" as const,
          message: `${i.name} is ${i.status}`,
        })),
    ];

    return {
      pointsToday: today.reduce((s, t) => s + t.birrPoints, 0),
      pointsWeek: week.reduce((s, t) => s + t.birrPoints, 0),
      pointsMonth: month.reduce((s, t) => s + t.birrPoints, 0),
      escrowBalanceEtb: escrow.balanceEtb,
      activeUsersToday: new Set(
        today.map((t) => t.userId).concat(
          consumers.filter((c) => isToday(c.lastActiveAt)).map((c) => c.id)
        )
      ).size,
      qualifyingTxToday: today.length,
      commissionTodayEtb: today.reduce((s, t) => s + t.commissionEtb, 0),
      activeMerchants: merchants.filter((m) => m.status === "active").length,
      alerts,
      liveFeed: [...transactions]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 15),
      volumeDaily: [
        { label: "Mon", value: 420 },
        { label: "Tue", value: 510 },
        { label: "Wed", value: 480 },
        { label: "Thu", value: 620 },
        { label: "Fri", value: 710 },
        { label: "Sat", value: 880 },
        { label: "Sun", value: 640 },
      ],
      volumeWeekly: [
        { label: "W1", value: 3200 },
        { label: "W2", value: 3600 },
        { label: "W3", value: 4100 },
        { label: "W4", value: 3900 },
      ],
      volumeMonthly: [
        { label: "Mar", value: 28_000 },
        { label: "Apr", value: 31_500 },
        { label: "May", value: 36_200 },
        { label: "Jun", value: 41_800 },
        { label: "Jul", value: 48_220 },
        { label: "Aug", value: 12_400 },
      ],
    };
  },

  listMerchants() {
    return merchants.map((m) => ({ ...m }));
  },

  getMerchant(id: string) {
    const m = merchants.find((x) => x.id === id);
    if (!m) throw new Error("Merchant not found");
    return {
      merchant: { ...m },
      webhooks: webhookLogs.filter((w) => w.merchantId === id),
      campaigns: campaigns.filter((c) => c.merchantId === id),
      fisHistory: fisHistory[id] ?? [],
    };
  },

  setMerchantStatus(id: string, status: MerchantStatus, actor: string, ip: string) {
    const m = merchants.find((x) => x.id === id);
    if (!m) throw new Error("Merchant not found");
    m.status = status;
    if (status === "active") m.kycVerified = true;
    const action =
      status === "active"
        ? "merchant.activate"
        : status === "suspended"
          ? "merchant.suspend"
          : "merchant.deactivate";
    appendAudit({
      action,
      actor,
      target: id,
      detail: `${status} ${m.name}`,
      ip,
    });
    return { ...m };
  },

  updateMerchant(
    id: string,
    patch: Partial<Pick<Merchant, "cashbackRate" | "category">>,
    actor: string,
    ip: string
  ) {
    const m = merchants.find((x) => x.id === id);
    if (!m) throw new Error("Merchant not found");
    if (patch.cashbackRate != null) {
      m.cashbackRate = patch.cashbackRate;
      appendAudit({
        action: "merchant.rate_update",
        actor,
        target: id,
        detail: `Cashback rate set to ${patch.cashbackRate * 100}%`,
        ip,
      });
    }
    if (patch.category != null) {
      m.category = patch.category;
      appendAudit({
        action: "merchant.category_update",
        actor,
        target: id,
        detail: `Category set to ${patch.category}`,
        ip,
      });
    }
    return { ...m };
  },

  listConsumers() {
    return consumers.map((c) => ({ ...c }));
  },

  getConsumer(id: string) {
    const user = consumers.find((c) => c.id === id);
    if (!user) throw new Error("User not found");
    return {
      user: { ...user },
      ledger: ledger.filter((l) => l.userId === id),
      merchants: userMerchants.filter((u) => u.userId === id),
      redemptions: redemptions.filter((r) => r.userId === id),
    };
  },

  setConsumerStatus(id: string, status: ConsumerStatus, actor: string, ip: string) {
    const user = consumers.find((c) => c.id === id);
    if (!user) throw new Error("User not found");
    user.status = status;
    appendAudit({
      action: "user.suspend",
      actor,
      target: id,
      detail: `User status ${status}`,
      ip,
    });
    return { ...user };
  },

  adjustPoints(
    id: string,
    points: number,
    reason: string,
    actor: string,
    ip: string
  ) {
    if (!reason.trim()) throw new Error("Reason is required");
    if (!points) throw new Error("Points must be non-zero");
    const user = consumers.find((c) => c.id === id);
    if (!user) throw new Error("User not found");
    user.pointsBalance += points;
    ledger.unshift({
      id: nid("led"),
      userId: id,
      type: points > 0 ? "adjust_credit" : "adjust_debit",
      points,
      reason,
      merchantName: null,
      actor,
      createdAt: new Date().toISOString(),
    });
    appendAudit({
      action: "user.points_adjust",
      actor,
      target: id,
      detail: `${points > 0 ? "Credit" : "Debit"} ${Math.abs(points)} BP: ${reason}`,
      ip,
    });
    return { ...user };
  },

  listTransactions() {
    return [...transactions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },

  listDuplicates() {
    return [...duplicates];
  },

  reprocessTransaction(id: string, actor: string, ip: string) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) throw new Error("Transaction not found");
    if (tx.webhookStatus !== "failed" && tx.status !== "failed") {
      throw new Error("Only failed transactions can be reprocessed");
    }
    tx.status = "success";
    tx.webhookStatus = "success";
    tx.failureReason = null;
    appendAudit({
      action: "transaction.reprocess",
      actor,
      target: id,
      detail: `Reprocessed ${tx.outTradeNo}`,
      ip,
    });
    return { ...tx };
  },

  volume() {
    return {
      daily: db.overview().volumeDaily,
      weekly: db.overview().volumeWeekly,
      monthly: db.overview().volumeMonthly,
    };
  },

  getEscrow() {
    return {
      snapshot: { ...escrow },
      breakage: [...breakage],
      recon: [...recon],
    };
  },

  reconcile(actor: string, ip: string) {
    const run = {
      id: nid("rec"),
      actor,
      ledgerEtb: escrow.outstandingLiabilityEtb,
      escrowEtb: escrow.balanceEtb,
      deltaEtb: Number(
        (escrow.balanceEtb - escrow.outstandingLiabilityEtb).toFixed(2)
      ),
      status: "matched" as const,
      createdAt: new Date().toISOString(),
    };
    recon.unshift(run);
    escrow.lastReconciledAt = run.createdAt;
    appendAudit({
      action: "escrow.reconcile",
      actor,
      target: "escrow",
      detail: `Reconciliation ${run.status} delta ${run.deltaEtb}`,
      ip,
    });
    return run;
  },

  listRedemptions() {
    return [...redemptions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },

  getAirtime() {
    return { ...airtime };
  },

  channelBreakdown() {
    const total = redemptions.length || 1;
    const counts = { wallet: 0, airtime: 0, data: 0 };
    for (const r of redemptions) counts[r.channel] += 1;
    return {
      wallet: counts.wallet / total,
      airtime: counts.airtime / total,
      data: counts.data / total,
    };
  },

  retryRedemption(id: string, actor: string, ip: string) {
    const r = redemptions.find((x) => x.id === id);
    if (!r) throw new Error("Redemption not found");
    if (r.status !== "failed") throw new Error("Only failed redemptions can retry");
    r.status = "success";
    r.failureReason = null;
    appendAudit({
      action: "redemption.retry",
      actor,
      target: id,
      detail: `Retried redemption for ${r.userPhone}`,
      ip,
    });
    return { ...r };
  },

  getExpiry() {
    return {
      upcoming: [...expiryRows],
      reminders: [...expiryReminders],
      reports: [...expiryReports],
    };
  },

  sendExpiryReminder(userId: string, actor: string, ip: string) {
    const row = expiryRows.find((r) => r.userId === userId);
    if (!row) throw new Error("Expiry row not found");
    const reminder = {
      id: nid("exr"),
      userId,
      userPhone: row.userPhone,
      status: "sent" as const,
      createdAt: new Date().toISOString(),
    };
    expiryReminders.unshift(reminder);
    appendAudit({
      action: "expiry.remind",
      actor,
      target: userId,
      detail: `Expiry reminder to ${row.userPhone}`,
      ip,
    });
    return reminder;
  },

  extendExpiry(userIds: string[], days: number, reason: string, actor: string, ip: string) {
    if (!reason.trim()) throw new Error("Reason is required");
    for (const id of userIds) {
      const row = expiryRows.find((r) => r.userId === id);
      if (!row) continue;
      const next = new Date(row.expiresAt);
      next.setUTCDate(next.getUTCDate() + days);
      row.expiresAt = next.toISOString();
    }
    appendAudit({
      action: "expiry.extend",
      actor,
      target: userIds.join(","),
      detail: `Extended ${days} days: ${reason}`,
      ip,
    });
    return expiryRows.filter((r) => userIds.includes(r.userId));
  },

  listBrandCampaigns() {
    return brandCampaigns.map((c) => ({ ...c }));
  },

  createBrandCampaign(
    input: Omit<
      BrandCampaign,
      "id" | "impressions" | "bonusesTriggered" | "unitsInfluenced" | "revenueEtb" | "ethioShareEtb" | "status"
    >,
    actor: string,
    ip: string
  ) {
    const campaign: BrandCampaign = {
      ...input,
      id: nid("brd"),
      impressions: 0,
      bonusesTriggered: 0,
      unitsInfluenced: 0,
      revenueEtb: 0,
      ethioShareEtb: 0,
      status: "active",
    };
    brandCampaigns.unshift(campaign);
    appendAudit({
      action: "brand.create",
      actor,
      target: campaign.id,
      detail: `Created ${campaign.name}`,
      ip,
    });
    return campaign;
  },

  listBrandInvoices() {
    return [...brandInvoices];
  },

  issueInvoice(campaignId: string, actor: string, ip: string) {
    const c = brandCampaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error("Campaign not found");
    const invoice = {
      id: nid("inv"),
      campaignId,
      brand: c.brand,
      amountEtb: c.revenueEtb || c.budgetEtb * 0.2,
      status: "sent" as const,
      issuedAt: new Date().toISOString(),
    };
    brandInvoices.unshift(invoice);
    appendAudit({
      action: "brand.invoice",
      actor,
      target: campaignId,
      detail: `Invoice ${invoice.amountEtb} ETB for ${c.brand}`,
      ip,
    });
    return invoice;
  },

  listFis() {
    return merchants
      .filter((m) => m.integrityScore > 0)
      .map((m) => ({
        ...m,
        history: fisHistory[m.id] ?? [],
      }));
  },

  flagFis(merchantId: string, reason: string, actor: string, ip: string) {
    if (!reason.trim()) throw new Error("Reason is required");
    const m = merchants.find((x) => x.id === merchantId);
    if (!m) throw new Error("Merchant not found");
    appendAudit({
      action: "fis.flag",
      actor,
      target: merchantId,
      detail: reason,
      ip,
    });
    return { merchantId, flagged: true, reason };
  },

  listReferrals() {
    return [...referrals];
  },

  listLicensing() {
    return [...licensing];
  },

  getHealth() {
    return {
      health: { ...health, integrations: health.integrations.map((i) => ({ ...i })) },
      security: [...security],
      failedWebhooks: webhookLogs.filter((w) => w.status === "failed"),
    };
  },

  listPush() {
    return {
      templates: [...pushTemplates],
      messages: [...pushMessages],
    };
  },

  sendPush(
    input: {
      title: string;
      body: string;
      audience: PushAudience;
      target: string;
    },
    actor: string,
    ip: string
  ) {
    const msg = {
      id: nid("psh"),
      title: input.title,
      body: input.body,
      audience: input.audience,
      target: input.target,
      status: "sent" as const,
      sent: input.audience === "all_active" ? 12_400 : input.audience === "merchant_customers" ? 2_000 : 1,
      delivered: 0,
      failed: 0,
      scheduledAt: null,
      createdAt: new Date().toISOString(),
      actor,
    };
    pushMessages.unshift(msg);
    appendAudit({
      action: "push.send",
      actor,
      target: input.target,
      detail: input.title,
      ip,
    });
    return msg;
  },

  getReports() {
    return {
      monthly: [...monthlyReports],
      uplift: [...uplift],
      cohorts: [...cohorts],
      breakage: [...breakage],
    };
  },

  listCampaigns() {
    return campaigns.map((c) => ({ ...c }));
  },

  setCampaignStatus(
    id: string,
    status: HappyHourCampaign["status"],
    actor: string,
    ip: string
  ) {
    const c = campaigns.find((x) => x.id === id);
    if (!c) throw new Error("Campaign not found");
    c.status = status;
    appendAudit({
      action: "merchant.activate",
      actor,
      target: id,
      detail: `Campaign ${c.title} -> ${status}`,
      ip,
    });
    return { ...c };
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
    feeConfig = next;
    appendAudit({
      action: "fees.update",
      actor,
      target: "fee_config",
      detail: `Fee ${next.marketingFeeRate * 100}%`,
      ip,
    });
    return { ...feeConfig };
  },

  listAdmins(): Omit<PanelUser, "passwordHash">[] {
    return admins.map((admin) => {
      const { passwordHash, ...rest } = admin;
      void passwordHash;
      return rest;
    });
  },

  setAdminStatus(id: string, status: PanelUser["status"], actor: string, ip: string) {
    const a = admins.find((x) => x.id === id);
    if (!a) throw new Error("Admin not found");
    if (a.role === "super_admin" && status === "disabled") {
      throw new Error("Cannot disable super admin");
    }
    a.status = status;
    appendAudit({
      action: "admin.disable",
      actor,
      target: id,
      detail: `Admin ${a.email} ${status}`,
      ip,
    });
    const { passwordHash, ...rest } = a;
    void passwordHash;
    return rest;
  },

  listAudit() {
    return [...audit].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },

  touchLogin(email: string) {
    const a = admins.find((x) => x.email === email);
    if (a) a.lastLoginAt = new Date().toISOString();
  },
};

export type { Merchant, Consumer, Transaction, Redemption, AuditEvent, AdminRole };
