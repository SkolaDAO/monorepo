import { useState, useEffect, useCallback } from "react";
import { api, type Lesson, type ChapterLesson } from "../lib/api";

interface ChapterWithLessons {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: ChapterLesson[];
}

interface ChaptersResponse {
  chapters: ChapterWithLessons[];
  hasAccess: boolean;
}

export function useLessons(courseId: string) {
  const [data, setData] = useState<ChaptersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ChaptersResponse>(`/lessons/course/${courseId}`);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch lessons"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    chapters: data?.chapters ?? [],
    hasAccess: data?.hasAccess ?? false,
    isLoading,
    error,
    refetch: fetchLessons,
  };
}

export function useLesson(id: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLesson = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Lesson>(`/lessons/${id}`);
      setLesson(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch lesson"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  return { lesson, isLoading, error, refetch: fetchLesson };
}

export function useCreateLesson() {
  const [isLoading, setIsLoading] = useState(false);

  const createLesson = async (
    courseId: string,
    data: {
      title: string;
      content?: string;
      isPreview?: boolean;
    }
  ) => {
    setIsLoading(true);
    try {
      const lesson = await api.post<Lesson>(`/lessons/course/${courseId}`, data);
      return lesson;
    } finally {
      setIsLoading(false);
    }
  };

  return { createLesson, isLoading };
}

export function useUpdateLesson() {
  const [isLoading, setIsLoading] = useState(false);

  const updateLesson = async (
    id: string,
    data: {
      title?: string;
      content?: string;
      isPreview?: boolean;
      order?: number;
    }
  ) => {
    setIsLoading(true);
    try {
      const lesson = await api.patch<Lesson>(`/lessons/${id}`, data);
      return lesson;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateLesson, isLoading };
}

export function useDeleteLesson() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteLesson = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/lessons/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteLesson, isLoading };
}

export function useReorderLessons() {
  const [isLoading, setIsLoading] = useState(false);

  const reorderLessons = async (courseId: string, lessonIds: string[]) => {
    setIsLoading(true);
    try {
      await api.post(`/lessons/course/${courseId}/reorder`, { lessonIds });
    } finally {
      setIsLoading(false);
    }
  };

  return { reorderLessons, isLoading };
}

export function useVideoUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const createVideoUpload = async (lessonId: string) => {
    const response = await api.post<{
      videoId: string;
      uploadUrl: string;
      uploadHeaders: Record<string, string>;
    }>(`/lessons/${lessonId}/video`);
    return response;
  };

  const uploadVideo = async (
    lessonId: string,
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    setIsLoading(true);
    setProgress(0);

    try {
      const { uploadUrl, uploadHeaders } = await createVideoUpload(lessonId);

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
            onProgress?.(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("PUT", uploadUrl);
        Object.entries(uploadHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        xhr.send(file);
      });

      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVideo = async (lessonId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/lessons/${lessonId}/video`);
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadVideo, deleteVideo, isLoading, progress };
}
