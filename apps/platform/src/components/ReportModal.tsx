import { useState } from "react";
import { Button } from "@skola/ui";
import { useCreateReport, REPORT_REASONS, type ReportType, type ReportReason } from "../hooks/useReports";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  targetId: string;
  targetName?: string;
}

export function ReportModal({ isOpen, onClose, reportType, targetId, targetName }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const { createReport, isLoading, error, clearError } = useCreateReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    const report = await createReport({
      reportType,
      targetId,
      reason: selectedReason,
      description: description.trim() || undefined,
    });

    if (report) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    setSuccess(false);
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  const typeLabel = reportType === "course" ? "Course" : reportType === "user" ? "User" : "Message";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Report Submitted</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for helping keep Skola safe. Our team will review your report.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Report {typeLabel}</h2>
                {targetName && (
                  <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                    {targetName}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Why are you reporting this {typeLabel.toLowerCase()}?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReason === reason.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={() => setSelectedReason(reason.value)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <div>
                        <span className="font-medium text-sm">{reason.label}</span>
                        <p className="text-xs text-muted-foreground">{reason.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Additional details (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/1000
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!selectedReason || isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Report"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                False reports may result in account restrictions.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
