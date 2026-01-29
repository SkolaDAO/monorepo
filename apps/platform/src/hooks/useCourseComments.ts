import { useState, useEffect, useCallback } from "react";
import { api, type CourseComment, type PaginatedResponse } from "../lib/api";

export function useCourseComments(courseId: string | null, page = 1, limit = 20) {
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<CourseComment>>(
        `/courses/${courseId}/comments`,
        { page, limit }
      );
      setComments(response.data);
      setPagination(response.pagination);
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [courseId, page, limit]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, pagination, isLoading, refetch: fetchComments };
}

export function usePostComment() {
  const [isLoading, setIsLoading] = useState(false);

  const postComment = async (courseId: string, content: string) => {
    setIsLoading(true);
    try {
      const comment = await api.post<CourseComment>(`/courses/${courseId}/comments`, { content });
      return comment;
    } finally {
      setIsLoading(false);
    }
  };

  return { postComment, isLoading };
}

export function useDeleteComment() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteComment = async (courseId: string, commentId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/courses/${courseId}/comments/${commentId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteComment, isLoading };
}
