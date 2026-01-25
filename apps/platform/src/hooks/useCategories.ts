import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  courseCount: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Category[] }>("/categories");
      setCategories(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch categories"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}

export function useCategory(slug: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Category>(`/categories/${slug}`);
      setCategory(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch category"));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return { category, isLoading, error, refetch: fetchCategory };
}
