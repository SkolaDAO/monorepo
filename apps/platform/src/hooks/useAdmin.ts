import { useState, useEffect, useCallback } from "react";
import { api, type PaginatedResponse } from "../lib/api";

export interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalCourses: number;
  totalBannedUsers: number;
  totalHiddenCourses: number;
  pendingReports: number;
}

export interface AdminUser {
  id: string;
  address: string;
  username: string | null;
  avatar: string | null;
  isCreator: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  thumbnail: string | null;
  priceUsd: string;
  isFree: boolean;
  isPublished: boolean;
  isHidden: boolean;
  hiddenAt: string | null;
  hiddenReason: string | null;
  createdAt: string;
  creator: {
    id: string;
    address: string;
    username: string | null;
  };
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportType: "course" | "user" | "message";
  targetCourseId: string | null;
  targetUserId: string | null;
  targetMessageId: string | null;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  reporter: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
  };
  targetCourse?: {
    id: string;
    title: string;
    thumbnail: string | null;
    creator: {
      id: string;
      address: string;
      username: string | null;
    };
  };
  targetUser?: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
  };
  targetMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      address: string;
      username: string | null;
    };
  };
  reviewer?: {
    id: string;
    username: string | null;
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<AdminStats>("/admin/stats");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  banned?: "true" | "false" | "all";
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 20, banned = "all" } = options;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<AdminUser>>("/admin/users", {
        page,
        limit,
        banned,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch users"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, banned]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, isLoading, error, refetch: fetchUsers };
}

interface UseAdminCoursesOptions {
  page?: number;
  limit?: number;
  hidden?: "true" | "false" | "all";
}

export function useAdminCourses(options: UseAdminCoursesOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminCourse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 20, hidden = "all" } = options;

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<AdminCourse>>("/admin/courses", {
        page,
        limit,
        hidden,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch courses"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, hidden]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { data, isLoading, error, refetch: fetchCourses };
}

interface UseAdminReportsOptions {
  page?: number;
  limit?: number;
  status?: "pending" | "reviewed" | "resolved" | "dismissed" | "all";
  type?: "course" | "user" | "message" | "all";
}

export function useAdminReports(options: UseAdminReportsOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminReport> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 20, status = "pending", type = "all" } = options;

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<AdminReport>>("/reports", {
        page,
        limit,
        status,
        type,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch reports"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, type]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, isLoading, error, refetch: fetchReports };
}

export function useAdminActions() {
  const [isLoading, setIsLoading] = useState(false);

  const banUser = async (userId: string, reason: string) => {
    setIsLoading(true);
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason });
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to ban user");
    } finally {
      setIsLoading(false);
    }
  };

  const unbanUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await api.post(`/admin/users/${userId}/unban`);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to unban user");
    } finally {
      setIsLoading(false);
    }
  };

  const hideCourse = async (courseId: string, reason: string) => {
    setIsLoading(true);
    try {
      await api.post(`/admin/courses/${courseId}/hide`, { reason });
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to hide course");
    } finally {
      setIsLoading(false);
    }
  };

  const unhideCourse = async (courseId: string) => {
    setIsLoading(true);
    try {
      await api.post(`/admin/courses/${courseId}/unhide`);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to unhide course");
    } finally {
      setIsLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    status: "reviewed" | "resolved" | "dismissed",
    reviewNotes?: string
  ) => {
    setIsLoading(true);
    try {
      await api.patch(`/reports/${reportId}`, { status, reviewNotes });
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update report");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/admin/messages/${messageId}`);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete message");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    banUser,
    unbanUser,
    hideCourse,
    unhideCourse,
    updateReportStatus,
    deleteMessage,
    isLoading,
  };
}
