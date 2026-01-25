const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  getAccessToken() {
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.clearTokens();
      throw new Error("No refresh token");
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Refresh failed");
        }

        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
      } catch {
        this.clearTokens();
        throw new Error("Session expired");
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async fetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${API_BASE}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...fetchOptions, headers });

    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...fetchOptions, headers });
      } catch {
        throw new Error("Session expired");
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.fetch<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();

export interface User {
  id: string;
  address: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  isCreator: boolean;
  isAdmin: boolean;
  creatorTier: "starter" | "pro" | "elite" | null;
  referralCode: string | null;
  createdAt: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  lessons: ChapterLesson[];
}

export interface ChapterLesson {
  id: string;
  title: string;
  order: number;
  isPreview: boolean;
  videoDuration: number | null;
  hasVideo?: boolean;
  canAccess?: boolean;
  content?: string | null;
}

export interface Course {
  id: string;
  onChainId: number | null;
  creatorId: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  priceUsd: string;
  isFree: boolean;
  isPublished: boolean;
  previewPercentage: number;
  lessonCount: number;
  hasAccess?: boolean;
  creator?: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
    bio?: string | null;
  };
  chapters?: Chapter[];
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  content: string | null;
  videoId: string | null;
  videoDuration: number | null;
  order: number;
  isPreview: boolean;
  canAccess?: boolean;
  videoUrl?: string | null;
}

export interface CreatorLeaderboardEntry {
  rank: number;
  user: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
  };
  stats: {
    coursesCount: number;
    studentsCount: number;
    totalEarnings: string;
  };
  points: number;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
  };
}

export interface ChatRoom {
  id: string;
  type: "dm" | "community";
  courseId?: string;
  course?: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
  otherUser?: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
}

export interface Notification {
  id: string;
  type: "purchase" | "message" | "course_update" | "referral_earning" | "system";
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
