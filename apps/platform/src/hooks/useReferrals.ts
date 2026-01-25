import { useState, useEffect, useCallback } from "react";
import { api, type PaginatedResponse } from "../lib/api";

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  totalEarningsUsd: string;
  recentReferrals: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
    createdAt: string;
  }[];
}

interface ReferralEarning {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
  buyer: {
    id: string;
    address: string;
    username: string | null;
  };
  earning: string | null;
  purchasedAt: string;
}

export function useReferralStats() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ReferralStats>("/referrals/stats");
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch referral stats"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useReferralEarnings(options: { page?: number; limit?: number } = {}) {
  const [data, setData] = useState<PaginatedResponse<ReferralEarning> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 20 } = options;

  const fetchEarnings = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse<ReferralEarning>>("/referrals/earnings", {
        page,
        limit,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch referral earnings"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchEarnings,
  };
}

export function useValidateReferralCode() {
  const [isLoading, setIsLoading] = useState(false);

  const validateCode = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await api.get<{
        valid: boolean;
        referrer: { id: string; username: string | null; avatar: string | null };
      }>(`/referrals/code/${code}`);
      return response;
    } catch {
      return { valid: false, referrer: null };
    } finally {
      setIsLoading(false);
    }
  };

  return { validateCode, isLoading };
}

export function useRegenerateReferralCode() {
  const [isLoading, setIsLoading] = useState(false);

  const regenerate = async () => {
    setIsLoading(true);
    try {
      const response = await api.post<{ referralCode: string }>("/referrals/regenerate");
      return response.referralCode;
    } finally {
      setIsLoading(false);
    }
  };

  return { regenerate, isLoading };
}
