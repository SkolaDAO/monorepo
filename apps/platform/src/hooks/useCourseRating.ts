import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export interface CourseRating {
  hasRating: boolean;
  totalReviews: number;
  averageRating: number | null;
  recommendationRate: number | null;
}

export function useCourseRating(courseId: string) {
  const [rating, setRating] = useState<CourseRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRating = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<CourseRating>(`/feedback/course/${courseId}/rating`);
      setRating(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch rating"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { rating, isLoading, error, refetch: fetchRating };
}
