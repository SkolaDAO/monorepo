import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useLikedCourseIds() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchLikedIds = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setLikedIds(new Set());
      setIsLoading(false);
      return;
    }
    try {
      const ids = await api.get<string[]>("/courses/liked-ids");
      setLikedIds(new Set(ids));
    } catch {
      // Not authenticated or error — that's fine
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedIds();
  }, [fetchLikedIds]);

  return { likedIds, setLikedIds, isLoading, refetch: fetchLikedIds };
}

export function useToggleLike() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async (courseId: string) => {
    setIsLoading(true);
    try {
      const result = await api.post<{ liked: boolean; likeCount: number }>(
        `/courses/${courseId}/like`
      );
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { toggleLike, isLoading };
}
