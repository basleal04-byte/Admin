"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type {
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
  const state = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: MerchantStatus) => {
      await api(`/api/admin/merchants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  const update = useCallback(
    async (id: string, patch: { cashbackRate?: number; category?: string }) => {
      await api(`/api/admin/merchants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, setStatus, update };
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
  const state = useAsyncResource(loader);
  const setStatus = useCallback(
    async (status: ConsumerStatus) => {
      await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await state.refetch();
    },
    [id, state.refetch]
  );
  const adjustPoints = useCallback(
    async (points: number, reason: string) => {
      await api(`/api/admin/users/${id}`, {
        method: "POST",
        body: JSON.stringify({ points, reason }),
      });
      await state.refetch();
    },
    [id, state.refetch]
  );
  return { ...state, setStatus, adjustPoints };
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
  const state = useAsyncResource(loader);
  const reprocess = useCallback(
    async (id: string) => {
      await api(`/api/admin/transactions/${id}/reprocess`, { method: "POST" });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, reprocess };
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
  const state = useAsyncResource(loader);
  const reconcile = useCallback(async () => {
    await api("/api/admin/escrow", { method: "POST" });
    await state.refetch();
  }, [state.refetch]);
  return { ...state, reconcile };
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
  const state = useAsyncResource(loader);
  const retry = useCallback(
    async (id: string) => {
      await api(`/api/admin/redemptions/${id}/retry`, { method: "POST" });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, retry };
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
  const state = useAsyncResource(loader);
  const remind = useCallback(
    async (userId: string) => {
      await api("/api/admin/expiry", {
        method: "POST",
        body: JSON.stringify({ action: "remind", userId }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  const extend = useCallback(
    async (userIds: string[], days: number, reason: string) => {
      await api("/api/admin/expiry", {
        method: "POST",
        body: JSON.stringify({ action: "extend", userIds, days, reason }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, remind, extend };
}

export function useBrand() {
  const loader = useCallback(
    () =>
      api<{ campaigns: BrandCampaign[]; invoices: BrandInvoice[] }>(
        "/api/admin/brand"
      ),
    []
  );
  const state = useAsyncResource(loader);
  const create = useCallback(
    async (body: Record<string, unknown>) => {
      await api("/api/admin/brand", { method: "POST", body: JSON.stringify(body) });
      await state.refetch();
    },
    [state.refetch]
  );
  const invoice = useCallback(
    async (campaignId: string) => {
      await api("/api/admin/brand", {
        method: "PUT",
        body: JSON.stringify({ campaignId }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, create, invoice };
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
  const state = useAsyncResource(loader);
  const flag = useCallback(
    async (merchantId: string, reason: string) => {
      await api("/api/admin/fis", {
        method: "POST",
        body: JSON.stringify({ merchantId, reason }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, flag };
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
  const state = useAsyncResource(loader);
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
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, send };
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
  const state = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: "active" | "disabled") => {
      await api("/api/admin/admins", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, setStatus };
}

export function useFees() {
  const loader = useCallback(() => api<FeeConfig>("/api/admin/fees"), []);
  const state = useAsyncResource(loader);
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
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, save };
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
  const state = useAsyncResource(loader);
  const setStatus = useCallback(
    async (id: string, status: HappyHourCampaign["status"]) => {
      await api(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await state.refetch();
    },
    [state.refetch]
  );
  return { ...state, setStatus };
}
