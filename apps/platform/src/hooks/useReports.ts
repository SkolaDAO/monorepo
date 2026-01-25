import { useState } from "react";
import { api } from "../lib/api";

export type ReportType = "course" | "user" | "message";
export type ReportReason =
  | "spam"
  | "scam"
  | "inappropriate_content"
  | "harassment"
  | "copyright"
  | "misleading"
  | "other";

export interface CreateReportData {
  reportType: ReportType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportType: ReportType;
  targetCourseId: string | null;
  targetUserId: string | null;
  targetMessageId: string | null;
  reason: ReportReason;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
}

export function useCreateReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReport = async (data: CreateReportData): Promise<Report | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await api.post<Report>("/reports", data);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit report";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createReport, isLoading, error, clearError: () => setError(null) };
}

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Repetitive or promotional content" },
  { value: "scam", label: "Scam", description: "Fraudulent or deceptive content" },
  { value: "inappropriate_content", label: "Inappropriate Content", description: "Adult, violent, or offensive material" },
  { value: "harassment", label: "Harassment", description: "Bullying or targeted attacks" },
  { value: "copyright", label: "Copyright Violation", description: "Unauthorized use of copyrighted material" },
  { value: "misleading", label: "Misleading", description: "False or deceptive information" },
  { value: "other", label: "Other", description: "Other reason not listed above" },
];
