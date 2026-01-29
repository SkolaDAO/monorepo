import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, cn } from "@skola/ui";
import type { Course } from "../lib/api";
import { api } from "../lib/api";
import { useLikedCourseIds, useToggleLike } from "../hooks/useCourseLikes";
import { CommentsSheet } from "./CommentsSheet";

interface MobileHomeFeedProps {
  courses: CourseWithCategories[];
  isLoading: boolean;
}

// Extended Course type with optional categories
type CourseWithCategories = Course & {
  categories?: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }[];
};

export function MobileHomeFeed({ courses, isLoading }: MobileHomeFeedProps) {
  const { likedIds, setLikedIds } = useLikedCourseIds();
  const { toggleLike } = useToggleLike();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentsCourseId, setCommentsCourseId] = useState<string | null>(null);

  // Initialize like counts from course data
  useEffect(() => {
    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      counts[c.id] = c.likeCount ?? 0;
    });
    setLikeCounts(counts);
  }, [courses]);

  const handleLike = useCallback(
    async (courseId: string) => {
      if (!api.isAuthenticated()) return;

      const wasLiked = likedIds.has(courseId);

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(courseId);
        else next.add(courseId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [courseId]: Math.max(0, (prev[courseId] ?? 0) + (wasLiked ? -1 : 1)),
      }));

      try {
        const result = await toggleLike(courseId);
        // Sync with server truth
        setLikeCounts((prev) => ({ ...prev, [courseId]: result.likeCount }));
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (result.liked) next.add(courseId);
          else next.delete(courseId);
          return next;
        });
      } catch {
        // Revert on error
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(courseId);
          else next.delete(courseId);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [courseId]: Math.max(0, (prev[courseId] ?? 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [likedIds, setLikedIds, toggleLike]
  );

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-8rem)] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No courses yet</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for new content!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="h-[calc(100dvh-8rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {courses.map((course) => (
          <FeedCard
            key={course.id}
            course={course}
            isLiked={likedIds.has(course.id)}
            likeCount={likeCounts[course.id] ?? course.likeCount ?? 0}
            commentCount={course.commentCount ?? 0}
            onLike={() => handleLike(course.id)}
            onOpenComments={() => setCommentsCourseId(course.id)}
          />
        ))}
      </div>

      {/* Comments bottom sheet */}
      <CommentsSheet
        isOpen={!!commentsCourseId}
        onClose={() => setCommentsCourseId(null)}
        courseId={commentsCourseId || ""}
      />
    </>
  );
}

function FeedCard({
  course,
  isLiked,
  likeCount,
  commentCount,
  onLike,
  onOpenComments,
}: {
  course: CourseWithCategories;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onOpenComments: () => void;
}) {
  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const displayName =
    course.creator?.username || truncateAddress(course.creator?.address || "0x0000");

  // Truncate description
  const description = course.description || "";
  const shortDesc = description.length > 100 ? description.slice(0, 100) + "…" : description;

  return (
    <div className="relative h-[calc(100dvh-8rem)] w-full snap-start snap-always">
      {/* Background thumbnail */}
      <div className="absolute inset-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-background">
            <BookIcon className="h-24 w-24 text-primary/20" />
          </div>
        )}
        {/* Dark gradient overlay from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex">
        {/* Left: Bottom info section */}
        <div className="flex flex-1 flex-col justify-end p-4 pb-6 pr-16">
          {/* Category badges */}
          {course.categories && course.categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {course.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm"
                  style={{
                    backgroundColor: cat.color
                      ? `${cat.color}99`
                      : "rgba(255,255,255,0.15)",
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Course title */}
          <h2 className="mb-1 text-xl font-bold leading-tight text-white drop-shadow-lg line-clamp-3">
            {course.title}
          </h2>

          {/* Description */}
          {shortDesc && (
            <p className="mb-2 text-sm text-white/70 line-clamp-2">
              {shortDesc}
              {description.length > 100 && (
                <Link
                  to={`/course/${course.id}`}
                  className="ml-1 text-white/90 font-medium"
                >
                  more
                </Link>
              )}
            </p>
          )}

          {/* Creator info */}
          <div className="mb-3 flex items-center gap-2">
            {course.creator?.avatar ? (
              <img
                src={course.creator.avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-sm font-medium text-white ring-2 ring-white/30">
                {displayName[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-white/90 flex items-center gap-1">
              {displayName}
              {course.creator?.isVerified && (
                <VerifiedIcon className="h-4 w-4 text-blue-400" />
              )}
            </span>
          </div>

          {/* Meta row: rating + lessons + price */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Price badge */}
            {course.isFree ? (
              <Badge className="border-0 bg-emerald-500/90 text-white text-xs backdrop-blur-sm">
                Free
              </Badge>
            ) : (
              <Badge className="border-0 bg-white/20 text-white text-xs backdrop-blur-sm">
                ${Number(course.priceUsd).toFixed(0)}
              </Badge>
            )}
            {/* Rating */}
            {course.rating && course.rating.count > 0 && (
              <div className="flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-white/90">
                  {course.rating.average}
                </span>
                <span className="text-xs text-white/50">
                  ({course.rating.count})
                </span>
              </div>
            )}
            {/* Lesson count */}
            <span className="text-xs text-white/60">
              📚 {course.lessonCount} lesson{course.lessonCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* CTA Button */}
          <Link to={`/course/${course.id}`} className="block">
            <Button
              className={cn(
                "w-full rounded-xl text-sm font-semibold shadow-lg transition-transform duration-200 active:scale-[0.97]",
                course.isFree
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30"
                  : "bg-primary hover:bg-primary/90 shadow-primary/30"
              )}
              size="lg"
            >
              {course.isFree ? "Enroll Free" : "View Course"}
            </Button>
          </Link>
        </div>

        {/* Right: Action buttons (TikTok-style vertical stack) */}
        <div className="flex flex-col items-center justify-end gap-5 pb-24 pr-3">
          {/* Like/Heart */}
          <ActionButton
            onClick={onLike}
            label={formatCount(likeCount)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isLiked ? "liked" : "unliked"}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.5 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <HeartIcon
                  className={cn(
                    "h-7 w-7 transition-colors",
                    isLiked ? "fill-red-500 text-red-500" : "text-white"
                  )}
                  filled={isLiked}
                />
              </motion.div>
            </AnimatePresence>
          </ActionButton>

          {/* Comments */}
          <ActionButton
            label={formatCount(commentCount)}
            onClick={onOpenComments}
          >
            <CommentIcon className="h-7 w-7 text-white" />
          </ActionButton>

          {/* Share */}
          <ActionButton
            label="Share"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: course.title,
                  url: `${window.location.origin}/course/${course.id}`,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(
                  `${window.location.origin}/course/${course.id}`
                ).catch(() => {});
              }
            }}
          >
            <ShareIcon className="h-7 w-7 text-white" />
          </ActionButton>

          {/* Course detail */}
          <Link to={`/course/${course.id}`}>
            <ActionButton label="Details">
              <BookOpenIcon className="h-7 w-7 text-white" />
            </ActionButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-transform duration-150 active:scale-90"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
        {children}
      </div>
      <span className="text-[10px] font-medium text-white/80">{label}</span>
    </button>
  );
}

function FeedSkeleton() {
  return (
    <div className="h-[calc(100dvh-8rem)] w-full animate-pulse">
      <div className="relative h-full w-full bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 space-y-3">
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-white/10" />
          </div>
          <div className="h-6 w-3/4 rounded bg-white/10" />
          <div className="h-5 w-1/2 rounded bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10" />
          </div>
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-11 w-full rounded-xl bg-white/10" />
        </div>
        {/* Right action buttons skeleton */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-11 w-11 rounded-full bg-white/10" />
              <div className="h-2.5 w-8 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Icons
function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );
}
