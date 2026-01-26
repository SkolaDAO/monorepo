import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface ChapterAnalytics {
  id: string;
  title: string;
  order: number;
  views: number;
  lessons: LessonAnalytics[];
}

export interface LessonAnalytics {
  id: string;
  title: string;
  order: number;
  views: number;
  completions: number;
}

export interface CourseAnalytics {
  id: string;
  title: string;
  priceUsd: string;
  isFree: boolean;
  isPublished: boolean;
  createdAt: string;
  stats: {
    views: number;
    purchases: number;
    students: number;
    revenue: string;
    conversionRate: number;
    lessonCompletions: number;
    chatStats: {
      messageCount: number;
      activeParticipants: number;
    };
  };
  chapters: ChapterAnalytics[];
}

export interface TotalStats {
  totalRevenue: string;
  totalStudents: number;
  totalCourseViews: number;
  totalPurchases: number;
  overallConversionRate: number;
}

export interface CreatorDashboardData {
  courses: CourseAnalytics[];
  totalStats: TotalStats;
}

export interface TimeSeriesData {
  dailyViews: { date: string; count: number }[];
  dailyPurchases: { date: string; count: number; revenue: string }[];
  dailyCompletions: { date: string; count: number }[];
}

export interface FunnelData {
  funnel: {
    courseViews: number;
    uniqueVisitors: number;
    purchases: number;
    activeLearners: number;
    completers: number;
  };
  conversionRates: {
    viewToPurchase: number;
    purchaseToActive: number;
    activeToComplete: number;
  };
}

export interface StudentEngagement {
  id: string;
  username: string | null;
  avatar: string | null;
  purchasedAt: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export function useCreatorDashboard() {
  const isAuthenticated = api.isAuthenticated();

  return useQuery({
    queryKey: ["creator-analytics-dashboard"],
    queryFn: async () => {
      const response = await api.get<CreatorDashboardData>("/analytics/creator/dashboard");
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCourseTimeSeries(courseId: string | null, days = 30) {
  const isAuthenticated = api.isAuthenticated();

  return useQuery({
    queryKey: ["creator-analytics-timeseries", courseId, days],
    queryFn: async () => {
      const response = await api.get<TimeSeriesData>(
        `/analytics/creator/course/${courseId}/timeseries`,
        { days }
      );
      return response;
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60 * 1000,
  });
}

export function useCourseFunnel(courseId: string | null) {
  const isAuthenticated = api.isAuthenticated();

  return useQuery({
    queryKey: ["creator-analytics-funnel", courseId],
    queryFn: async () => {
      const response = await api.get<FunnelData>(
        `/analytics/creator/course/${courseId}/funnel`
      );
      return response;
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60 * 1000,
  });
}

export function useCourseEngagement(courseId: string | null) {
  const isAuthenticated = api.isAuthenticated();

  return useQuery({
    queryKey: ["creator-analytics-engagement", courseId],
    queryFn: async () => {
      const response = await api.get<{ students: StudentEngagement[] }>(
        `/analytics/creator/course/${courseId}/engagement`
      );
      return response;
    },
    enabled: isAuthenticated && !!courseId,
    staleTime: 60 * 1000,
  });
}

// Track analytics event
export async function trackEvent(
  eventType: "course_view" | "chapter_view" | "lesson_view" | "course_purchase" | "chat_join",
  data: {
    courseId?: string;
    chapterId?: string;
    lessonId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const sessionId = getOrCreateSessionId();
  
  try {
    await api.post("/analytics/track", {
      eventType,
      sessionId,
      ...data,
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

function getOrCreateSessionId(): string {
  const key = "skola_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}
