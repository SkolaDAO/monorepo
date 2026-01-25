import { useState } from "react";
import { Button } from "@skola/ui";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId?: string;
}

type Rating = 1 | 2 | 3 | 4 | 5;

interface FeedbackData {
  courseId: string;
  lessonId?: string;
  clarity: Rating;
  usefulness: Rating;
  engagement: Rating;
  difficulty: "too_easy" | "just_right" | "too_hard";
  wouldRecommend: boolean;
  generalFeedback: string;
}

export function FeedbackModal({ isOpen, onClose, courseId, lessonId }: FeedbackModalProps) {
  const { isAuthenticated } = useAuth();
  const [clarity, setClarity] = useState<Rating | null>(null);
  const [usefulness, setUsefulness] = useState<Rating | null>(null);
  const [engagement, setEngagement] = useState<Rating | null>(null);
  const [difficulty, setDifficulty] = useState<FeedbackData["difficulty"] | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarity || !usefulness || !engagement || !difficulty || wouldRecommend === null) {
      setError("Please answer all questions");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/feedback", {
        courseId,
        lessonId,
        clarity,
        usefulness,
        engagement,
        difficulty,
        wouldRecommend,
        generalFeedback: generalFeedback.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setClarity(null);
    setUsefulness(null);
    setEngagement(null);
    setDifficulty(null);
    setWouldRecommend(null);
    setGeneralFeedback("");
    setSuccess(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Thank You!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your feedback helps us improve the learning experience.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Share Your Feedback</h2>
                <p className="text-sm text-muted-foreground">Help us improve this course</p>
              </div>
              <button onClick={handleClose} className="rounded-lg p-2 hover:bg-muted transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">Please sign in to submit feedback</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <RatingQuestion
                  label="How clear was the content?"
                  value={clarity}
                  onChange={setClarity}
                  lowLabel="Confusing"
                  highLabel="Crystal clear"
                />

                <RatingQuestion
                  label="How useful was this lesson?"
                  value={usefulness}
                  onChange={setUsefulness}
                  lowLabel="Not useful"
                  highLabel="Very useful"
                />

                <RatingQuestion
                  label="How engaging was the material?"
                  value={engagement}
                  onChange={setEngagement}
                  lowLabel="Boring"
                  highLabel="Very engaging"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">How was the difficulty level?</label>
                  <div className="flex gap-2">
                    {[
                      { value: "too_easy" as const, label: "Too Easy" },
                      { value: "just_right" as const, label: "Just Right" },
                      { value: "too_hard" as const, label: "Too Hard" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDifficulty(option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          difficulty === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Would you recommend this course?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        wouldRecommend === true
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        wouldRecommend === false
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="generalFeedback" className="text-sm font-medium">
                    Any other thoughts? (optional)
                  </label>
                  <textarea
                    id="generalFeedback"
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                    placeholder="What could be improved? What did you love?"
                    maxLength={2000}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {generalFeedback.length}/2000
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface RatingQuestionProps {
  label: string;
  value: Rating | null;
  onChange: (value: Rating) => void;
  lowLabel: string;
  highLabel: string;
}

function RatingQuestion({ label, value, onChange, lowLabel, highLabel }: RatingQuestionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4, 5] as Rating[]).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
              value === rating
                ? "border-primary bg-primary text-primary-foreground"
                : value && rating <= value
                ? "border-primary/50 bg-primary/10"
                : "border-border hover:bg-muted"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
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
