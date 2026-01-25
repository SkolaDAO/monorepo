import { useState, useEffect, useCallback } from "react";
import { api, type Course, type PaginatedResponse } from "../lib/api";

interface UseCoursesOptions {
  page?: number;
  limit?: number;
  search?: string;
  creatorId?: string;
  category?: string;
  free?: boolean;
}

export function useCourses(options: UseCoursesOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<Course> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, limit = 12, search, creatorId, category, free } = options;

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse<Course>>("/courses", {
        page,
        limit,
        search,
        creatorId,
        category,
        free: free === undefined ? undefined : free ? "true" : "false",
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch courses"));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, creatorId, category, free]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { data, isLoading, error, refetch: fetchCourses };
}

export function useMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Course[] }>("/courses/my");
      setCourses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch courses"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchCourses();
    } else {
      setIsLoading(false);
    }
  }, [fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

export function usePurchasedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Course[] }>("/courses/purchased");
      setCourses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch courses"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchCourses();
    } else {
      setIsLoading(false);
    }
  }, [fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

export function useCourse(id: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Course>(`/courses/${id}`);
      setCourse(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch course"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return { course, isLoading, error, refetch: fetchCourse };
}

export function useCreateCourse() {
  const [isLoading, setIsLoading] = useState(false);

  const createCourse = async (data: {
    title: string;
    description?: string;
    thumbnail?: string;
    priceUsd: string;
    previewPercentage?: number;
    onChainId?: number;
  }) => {
    setIsLoading(true);
    try {
      const course = await api.post<Course>("/courses", data);
      return course;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCourse, isLoading };
}

export function useUpdateCourse() {
  const [isLoading, setIsLoading] = useState(false);

  const updateCourse = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      thumbnail?: string;
      priceUsd?: string;
      previewPercentage?: number;
    }
  ) => {
    setIsLoading(true);
    try {
      const course = await api.patch<Course>(`/courses/${id}`, data);
      return course;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateCourse, isLoading };
}

export function usePublishCourse() {
  const [isLoading, setIsLoading] = useState(false);

  const publishCourse = async (id: string) => {
    setIsLoading(true);
    try {
      const course = await api.post<Course>(`/courses/${id}/publish`);
      return course;
    } finally {
      setIsLoading(false);
    }
  };

  const unpublishCourse = async (id: string) => {
    setIsLoading(true);
    try {
      const course = await api.post<Course>(`/courses/${id}/unpublish`);
      return course;
    } finally {
      setIsLoading(false);
    }
  };

  return { publishCourse, unpublishCourse, isLoading };
}
