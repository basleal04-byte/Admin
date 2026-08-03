"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type {
  AuditEvent,
  Campaign,
  DashboardStats,
  FeeConfig,
  Merchant,
  MerchantStatus,
  Transaction,
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
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDashboard() {
  const loader = useCallback(() => api<DashboardStats>("/api/admin/dashboard"), []);
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

  return { data, loading, error, refetch, setStatus };
}

export function useTransactions() {
  const loader = useCallback(
    () => api<Transaction[]>("/api/admin/transactions"),
    []
  );
  return useAsyncResource(loader);
}

export function useCampaigns() {
  const loader = useCallback(() => api<Campaign[]>("/api/admin/campaigns"), []);
  const { data, loading, error, refetch } = useAsyncResource(loader);

  const setStatus = useCallback(
    async (id: string, status: Campaign["status"]) => {
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
      const next = await api<FeeConfig>("/api/admin/fees", {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      await refetch();
      return next;
    },
    [refetch]
  );

  return { data, loading, error, refetch, save };
}

export function useAudit() {
  const loader = useCallback(() => api<AuditEvent[]>("/api/admin/audit"), []);
  return useAsyncResource(loader);
}
