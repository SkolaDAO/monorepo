import { useState, useEffect, useCallback } from "react";
import { api, type Notification, type PaginatedResponse } from "../lib/api";

interface NotificationsResponse extends PaginatedResponse<Notification> {
  unreadCount: number;
}

export function useNotifications(options: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 20, unreadOnly = false } = options;

  const fetchNotifications = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<NotificationsResponse>("/notifications", {
        page,
        limit,
        unreadOnly,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notifications"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchNotifications,
  };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<{ count: number }>("/notifications/unread-count");
      setCount(response.count);
    } catch {
      console.error("Failed to fetch unread count");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, isLoading, refetch: fetchCount };
}

export function useMarkNotificationRead() {
  const [isLoading, setIsLoading] = useState(false);

  const markRead = async (notificationIds: string[]) => {
    setIsLoading(true);
    try {
      await api.post("/notifications/mark-read", { notificationIds });
    } finally {
      setIsLoading(false);
    }
  };

  const markAllRead = async () => {
    setIsLoading(true);
    try {
      await api.post("/notifications/mark-all-read");
    } finally {
      setIsLoading(false);
    }
  };

  return { markRead, markAllRead, isLoading };
}

export function useDeleteNotification() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteNotification = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/notifications/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteNotification, isLoading };
}
