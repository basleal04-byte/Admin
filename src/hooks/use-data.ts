"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type {
  AdminRole,
  AuditEvent,
  BrandCampaign,
  BrandInvoice,
  BreakageSettlement,
  CohortRetention,
  Consumer,
  ConsumerStatus,
  DashboardOverview,
  DuplicateEvent,
  EscrowSnapshot,
  ExpiryReminder,
  ExpiryReport,
  ExpiryRow,
  FeeConfig,
  HappyHourCampaign,
  LicensingFee,
  Merchant,
  MerchantStatus,
  MerchantUplift,
  MonthlyReport,
  PanelUser,
  PointsLedgerEntry,
  PushAudience,
  PushMessage,
  PushTemplate,
  ReconciliationRun,
  Redemption,
  SecurityEvent,
  SystemHealth,
  Transaction,
  UserMerchantStat,
  BankReferral,
  MerchantWebhookLog,
  FisHistoryPoint,
  AirtimeArbitrage,
} from "@/types";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function useAsyncResource<T>(loader: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useOverview() {
  const loader = useCallback(() => api<DashboardOverview>("/api/admin/dashboard"), []);
  return useAsyncResource(loader);
}

export function useMerchants() {
  const loader = useCallback(() => api<Merchant[]>("/api/admin/merchants"), []);
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: MerchantStatus) => {
      await api(`/api/admin/merchants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refetch();
    },
    [refetch]
  );
  const update = useCallback(
    async (id: string, patch: { cashbackRate?: number; category?: string }) => {
      await api(`/api/admin/merchants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, setStatus, update };
}

export function useMerchant(id: string) {
  const loader = useCallback(
    () =>
      api<{
        merchant: Merchant;
        webhooks: MerchantWebhookLog[];
        campaigns: HappyHourCampaign[];
        fisHistory: FisHistoryPoint[];
      }>(`/api/admin/merchants/${id}`),
    [id]
  );
  return useAsyncResource(loader);
}

export function useConsumers() {
  const loader = useCallback(() => api<Consumer[]>("/api/admin/users"), []);
  return useAsyncResource(loader);
}

export function useConsumer(id: string) {
  const loader = useCallback(
    () =>
      api<{
        user: Consumer;
        ledger: PointsLedgerEntry[];
        merchants: UserMerchantStat[];
        redemptions: Redemption[];
      }>(`/api/admin/users/${id}`),
    [id]
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const setStatus = useCallback(
    async (status: ConsumerStatus) => {
      await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refetch();
    },
    [id, refetch]
  );
  const adjustPoints = useCallback(
    async (points: number, reason: string) => {
      await api(`/api/admin/users/${id}`, {
        method: "POST",
        body: JSON.stringify({ points, reason }),
      });
      await refetch();
    },
    [id, refetch]
  );
  return { data, loading, error, refetch, setStatus, adjustPoints };
}

export function useTransactionsBundle() {
  const loader = useCallback(
    () =>
      api<{
        transactions: Transaction[];
        duplicates: DuplicateEvent[];
        volume: {
          daily: Array<{ label: string; value: number }>;
          weekly: Array<{ label: string; value: number }>;
          monthly: Array<{ label: string; value: number }>;
        };
      }>("/api/admin/transactions"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const reprocess = useCallback(
    async (id: string) => {
      await api(`/api/admin/transactions/${id}/reprocess`, { method: "POST" });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, reprocess };
}

export function useEscrow() {
  const loader = useCallback(
    () =>
      api<{
        snapshot: EscrowSnapshot;
        breakage: BreakageSettlement[];
        recon: ReconciliationRun[];
      }>("/api/admin/escrow"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const reconcile = useCallback(async () => {
    await api("/api/admin/escrow", { method: "POST" });
    await refetch();
  }, [refetch]);
  return { data, loading, error, refetch, reconcile };
}

export function useRedemptions() {
  const loader = useCallback(
    () =>
      api<{
        redemptions: Redemption[];
        airtime: AirtimeArbitrage;
        channels: { wallet: number; airtime: number; data: number };
      }>("/api/admin/redemptions"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const retry = useCallback(
    async (id: string) => {
      await api(`/api/admin/redemptions/${id}/retry`, { method: "POST" });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, retry };
}

export function useExpiry() {
  const loader = useCallback(
    () =>
      api<{
        upcoming: ExpiryRow[];
        reminders: ExpiryReminder[];
        reports: ExpiryReport[];
      }>("/api/admin/expiry"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const remind = useCallback(
    async (userId: string) => {
      await api("/api/admin/expiry", {
        method: "POST",
        body: JSON.stringify({ action: "remind", userId }),
      });
      await refetch();
    },
    [refetch]
  );
  const extend = useCallback(
    async (userIds: string[], days: number, reason: string) => {
      await api("/api/admin/expiry", {
        method: "POST",
        body: JSON.stringify({ action: "extend", userIds, days, reason }),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, remind, extend };
}

export function useBrand() {
  const loader = useCallback(
    () =>
      api<{ campaigns: BrandCampaign[]; invoices: BrandInvoice[] }>(
        "/api/admin/brand"
      ),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const create = useCallback(
    async (body: Record<string, unknown>) => {
      await api("/api/admin/brand", { method: "POST", body: JSON.stringify(body) });
      await refetch();
    },
    [refetch]
  );
  const invoice = useCallback(
    async (campaignId: string) => {
      await api("/api/admin/brand", {
        method: "PUT",
        body: JSON.stringify({ campaignId }),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, create, invoice };
}

export function useFis() {
  const loader = useCallback(
    () =>
      api<{
        merchants: Array<Merchant & { history: FisHistoryPoint[] }>;
        referrals: BankReferral[];
        licensing: LicensingFee[];
      }>("/api/admin/fis"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const flag = useCallback(
    async (merchantId: string, reason: string) => {
      await api("/api/admin/fis", {
        method: "POST",
        body: JSON.stringify({ merchantId, reason }),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, flag };
}

export function useWebhooks() {
  const loader = useCallback(
    () =>
      api<{
        health: SystemHealth;
        security: SecurityEvent[];
        failedWebhooks: MerchantWebhookLog[];
      }>("/api/admin/webhooks"),
    []
  );
  return useAsyncResource(loader);
}

export function usePush() {
  const loader = useCallback(
    () =>
      api<{ templates: PushTemplate[]; messages: PushMessage[] }>(
        "/api/admin/push"
      ),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const send = useCallback(
    async (input: {
      title: string;
      body: string;
      audience: PushAudience;
      target: string;
    }) => {
      await api("/api/admin/push", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, send };
}

export function useReports() {
  const loader = useCallback(
    () =>
      api<{
        monthly: MonthlyReport[];
        uplift: MerchantUplift[];
        cohorts: CohortRetention[];
        breakage: BreakageSettlement[];
      }>("/api/admin/reports"),
    []
  );
  return useAsyncResource(loader);
}

export function useAdmins() {
  const loader = useCallback(
    () => api<Omit<PanelUser, "passwordHash">[]>("/api/admin/admins"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: "active" | "disabled") => {
      await api("/api/admin/admins", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      await refetch();
    },
    [refetch]
  );
  const create = useCallback(
    async (input: { name: string; email: string; role: AdminRole }) => {
      const result = await api<{
        admin: Omit<PanelUser, "passwordHash">;
        emailSent: boolean;
        message: string;
      }>("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refetch();
      return result;
    },
    [refetch]
  );
  return { data, loading, error, refetch, setStatus, create };
}

export function useFees() {
  const loader = useCallback(() => api<FeeConfig>("/api/admin/fees"), []);
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const save = useCallback(
    async (
      patch: Partial<
        Pick<
          FeeConfig,
          "marketingFeeRate" | "userShare" | "birrbackShare" | "pointsPerEtb"
        >
      >
    ) => {
      await api("/api/admin/fees", {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, save };
}

export function useAudit() {
  const loader = useCallback(() => api<AuditEvent[]>("/api/admin/audit"), []);
  return useAsyncResource(loader);
}

export function useCampaigns() {
  const loader = useCallback(
    () => api<HappyHourCampaign[]>("/api/admin/campaigns"),
    []
  );
  const { data, loading, error, refetch } = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: HappyHourCampaign["status"]) => {
      await api(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refetch();
    },
    [refetch]
  );
  return { data, loading, error, refetch, setStatus };
}
