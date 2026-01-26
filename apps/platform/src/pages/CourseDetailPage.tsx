import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Button, Card, CardContent, CardHeader, CardTitle, Badge, cn } from "@skola/ui";
import { useCourse } from "../hooks/useApiCourses";
import { useStartDM, useCourseCommunityRoom } from "../hooks/useChat";
import { useAuth } from "../contexts/AuthContext";
import { ReportModal } from "../components/ReportModal";
import { useCourseRating } from "../hooks/useCourseRating";
import { VerifiedBadge } from "../components/VerifiedBadge";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { course, isLoading } = useCourse(id!);
  const { rating } = useCourseRating(id!);
  const { isAuthenticated, user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!course) {
    return <NotFoundState />;
  }

  const chapters = course.chapters || [];
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const allLessons = sortedChapters.flatMap((ch) => 
    [...(ch.lessons || [])].sort((a, b) => a.order - b.order)
  );
  
  const WORDS_PER_MINUTE = 200;
  const totalReadingMinutes = allLessons.reduce((acc, l) => {
    if (l.videoDuration && l.videoDuration > 0) {
      return acc + Math.ceil(l.videoDuration / 60);
    }
    const content = l.content || "";
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return acc + Math.ceil(words / WORDS_PER_MINUTE);
  }, 0);
  const previewCount = Math.ceil(allLessons.length * (course.previewPercentage || 5) / 100);

  let globalLessonIndex = 0;
  const isLessonPreview = (lesson: { isPreview: boolean }, lessonGlobalIndex: number) => {
    if (course.isFree) return true;
    return lesson.isPreview || lessonGlobalIndex < previewCount;
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <Container>
          <div className="pt-6 pb-8">
            <button
              onClick={() => navigate("/")}
              className="group mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to courses
            </button>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <BookIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">No preview image</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute left-4 top-4 flex gap-2">
                    {course.isFree && (
                      <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm">Free</Badge>
                    )}
                    {course.hasAccess && (
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        <CheckIcon className="mr-1 h-3 w-3" />
                        Owned
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                    {course.title}
                  </h1>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted ring-2 ring-border">
                        {course.creator?.avatar ? (
                          <img
                            src={course.creator.avatar}
                            alt={course.creator.username || "Creator"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-medium">
                            {(course.creator?.username || course.creator?.address || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-1.5">
                          {course.creator?.username || truncateAddress(course.creator?.address)}
                          {course.creator?.isVerified && <VerifiedBadge size="sm" />}
                        </p>
                        <p className="text-sm text-muted-foreground">Course Creator</p>
                      </div>
                    </div>
                    
                    {isAuthenticated && course.creator?.id !== user?.id && (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                        title="Report this course"
                      >
                        <FlagIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Report</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <LayersIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{course.lessonCount || allLessons.length}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <ClockIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatReadingTime(totalReadingMinutes)}</p>
                        <p className="text-xs text-muted-foreground">Total Duration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <StarIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        {rating?.hasRating ? (
                          <>
                            <p className="text-sm font-medium flex items-center gap-1">
                              {rating.averageRating}
                              <span className="text-xs text-muted-foreground">/ 5</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{rating.totalReviews} reviews</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">No rating yet</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {course.description && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">About This Course</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                          {course.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Course Content</h2>
                    <span className="text-sm text-muted-foreground">
                      {sortedChapters.length} {sortedChapters.length === 1 ? "chapter" : "chapters"} • {allLessons.length} {allLessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sortedChapters.map((chapter) => {
                      const sortedLessons = [...(chapter.lessons || [])].sort((a, b) => a.order - b.order);
                      const chapterReadingMinutes = sortedLessons.reduce((acc, l) => {
                        if (l.videoDuration && l.videoDuration > 0) {
                          return acc + Math.ceil(l.videoDuration / 60);
                        }
                        const content = l.content || "";
                        const words = content.trim().split(/\s+/).filter(Boolean).length;
                        return acc + Math.ceil(words / WORDS_PER_MINUTE);
                      }, 0);
                      
                      return (
                        <div key={chapter.id} className="overflow-hidden rounded-xl border border-border">
                          <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <FolderIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{chapter.title}</h3>
                                {chapter.description && (
                                  <p className="text-sm text-muted-foreground">{chapter.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {sortedLessons.length} {sortedLessons.length === 1 ? "lesson" : "lessons"}
                              {chapterReadingMinutes > 0 && ` • ${formatReadingTime(chapterReadingMinutes)}`}
                            </span>
                          </div>
                          
                          <div className="divide-y divide-border">
                            {sortedLessons.map((lesson) => {
                              const currentGlobalIndex = globalLessonIndex++;
                              const isPreview = isLessonPreview(lesson, currentGlobalIndex);
                              const canAccess = course.hasAccess || isPreview;
                              
                              const content = (
                                <>
                                  <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                                    canAccess
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {lesson.order}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "truncate font-medium",
                                        !canAccess && "text-muted-foreground"
                                      )}>
                                        {lesson.title}
                                      </p>
                                      {lesson.isPreview && !course.isFree && (
                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                          Preview
                                        </Badge>
                                      )}
                                    </div>
                                    {lesson.videoDuration && (
                                      <p className="text-sm text-muted-foreground">
                                        {formatDuration(lesson.videoDuration)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="shrink-0">
                                    {canAccess ? (
                                      <PlayIcon className="h-5 w-5 text-primary" />
                                    ) : (
                                      <LockIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </>
                              );
                              
                              return canAccess ? (
                                <Link
                                  key={lesson.id}
                                  to={`/course/${course.id}/learn?lesson=${lesson.id}`}
                                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                                >
                                  {content}
                                </Link>
                              ) : (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-4 p-4 bg-muted/20"
                                >
                                  {content}
                                </div>
                              );
                            })}

                            {sortedLessons.length === 0 && (
                              <div className="p-6 text-center">
                                <p className="text-sm text-muted-foreground">No lessons in this chapter yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {sortedChapters.length === 0 && (
                      <div className="overflow-hidden rounded-xl border border-border p-8 text-center">
                        <p className="text-muted-foreground">No content available yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="sticky top-8 space-y-6">
                  <PurchaseCard course={course} />
                  <CommunityCard courseId={course.id} hasAccess={course.hasAccess || course.isFree} />
                  <CreatorCard creator={course.creator} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <MobilePurchaseBar course={course} />
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="course"
        targetId={course.id}
        targetName={course.title}
      />
    </div>
  );
}

interface PurchaseCardProps {
  course: NonNullable<ReturnType<typeof useCourse>["course"]>;
}

function PurchaseCard({ course }: PurchaseCardProps) {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          {course.isFree ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2">
              <span className="text-2xl font-bold text-emerald-500">Free Course</span>
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold">${course.priceUsd}</div>
              <p className="mt-1 text-sm text-muted-foreground">One-time payment</p>
            </>
          )}
        </div>

        {course.hasAccess ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <CheckIcon className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-medium">You have access</p>
            </div>
            <Link to={`/course/${course.id}/learn`} className="block">
              <Button className="w-full" size="lg">
                Continue Learning
              </Button>
            </Link>
          </div>
        ) : course.isFree ? (
          <Link to={`/course/${course.id}/learn`} className="block">
            <Button className="w-full" size="lg">
              Start Learning
            </Button>
          </Link>
        ) : (
          <Link to={`/course/${course.id}/buy`} className="block">
            <Button className="w-full" size="lg">
              Buy Course
            </Button>
          </Link>
        )}

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creator receives</span>
            <span className="font-medium text-emerald-500">92-95%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Platform: 5% • Referrer: 3% (if applicable)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreatorCardProps {
  creator?: {
    id: string;
    address: string;
    username: string | null;
    avatar: string | null;
    bio?: string | null;
    socials?: {
      twitter?: string | null;
      farcaster?: string | null;
      youtube?: string | null;
      github?: string | null;
      discord?: string | null;
      telegram?: string | null;
      instagram?: string | null;
      linkedin?: string | null;
      website?: string | null;
    } | null;
    isVerified?: boolean;
  };
}

function CreatorCard({ creator }: CreatorCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { startDM, isLoading: isStartingDM } = useStartDM();

  if (!creator) return null;

  const handleMessageCreator = async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const roomId = await startDM(creator.id);
      navigate(`/chat?room=${roomId}`);
    } catch {
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Meet the Creator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted ring-2 ring-border">
            {creator.avatar ? (
              <img
                src={creator.avatar}
                alt={creator.username || "Creator"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-medium">
                {(creator.username || creator.address || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium flex items-center gap-1.5">
              {creator.username || truncateAddress(creator.address)}
              {creator.isVerified && <VerifiedBadge size="sm" />}
            </p>
            {creator.bio && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{creator.bio}</p>
            )}
          </div>
        </div>

        {/* Social Links */}
        <CreatorSocialLinks socials={creator.socials} />

        <div className="text-xs text-muted-foreground">
          {isAuthenticated ? "Ask questions before buying" : "Sign in to message creator"}
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={!isAuthenticated || isStartingDM}
          onClick={handleMessageCreator}
        >
          <MessageIcon className="mr-2 h-4 w-4" />
          {isStartingDM ? "Starting chat..." : "Message Creator"}
        </Button>
      </CardContent>
    </Card>
  );
}

type SocialsType = NonNullable<NonNullable<CreatorCardProps["creator"]>["socials"]>;

function CreatorSocialLinks({ socials }: { socials?: SocialsType | null }) {
  if (!socials) return null;

  const links = [
    { key: "twitter", url: socials.twitter ? `https://x.com/${socials.twitter}` : null, icon: "𝕏", label: "Twitter" },
    { key: "farcaster", url: socials.farcaster ? `https://warpcast.com/${socials.farcaster}` : null, icon: "⬡", label: "Farcaster" },
    { key: "youtube", url: socials.youtube ? (socials.youtube.startsWith("http") ? socials.youtube : `https://youtube.com/${socials.youtube}`) : null, icon: "▶", label: "YouTube" },
    { key: "github", url: socials.github ? `https://github.com/${socials.github}` : null, icon: "◐", label: "GitHub" },
    { key: "discord", url: socials.discord ? (socials.discord.startsWith("http") ? socials.discord : `https://discord.com/users/${socials.discord}`) : null, icon: "◆", label: "Discord" },
    { key: "telegram", url: socials.telegram ? `https://t.me/${socials.telegram}` : null, icon: "✈", label: "Telegram" },
    { key: "instagram", url: socials.instagram ? `https://instagram.com/${socials.instagram}` : null, icon: "◷", label: "Instagram" },
    { key: "linkedin", url: socials.linkedin ? `https://linkedin.com/in/${socials.linkedin}` : null, icon: "in", label: "LinkedIn" },
    { key: "website", url: socials.website, icon: "🌐", label: "Website" },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-xs"
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

interface CommunityCardProps {
  courseId: string;
  hasAccess: boolean;
}

function CommunityCard({ courseId, hasAccess }: CommunityCardProps) {
  const navigate = useNavigate();
  const { roomId, isLoading } = useCourseCommunityRoom(hasAccess ? courseId : null);

  if (!hasAccess || isLoading || !roomId) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Course Community</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect with other students and the creator in the community chat.
        </p>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => navigate(`/chat?room=${roomId}`)}
        >
          <UsersIcon className="mr-2 h-4 w-4" />
          Join Community Chat
        </Button>
      </CardContent>
    </Card>
  );
}

interface MobilePurchaseBarProps {
  course: NonNullable<ReturnType<typeof useCourse>["course"]>;
}

function MobilePurchaseBar({ course }: MobilePurchaseBarProps) {
  const navigate = useNavigate();
  const { roomId: communityRoomId } = useCourseCommunityRoom(
    course.hasAccess || course.isFree ? course.id : null
  );

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        {course.isFree ? (
          <span className="text-lg font-bold text-emerald-500">Free</span>
        ) : (
          <span className="text-lg font-bold">${course.priceUsd}</span>
        )}
      </div>
      
      {(course.hasAccess || course.isFree) && communityRoomId && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/chat?room=${communityRoomId}`)}
          title="Community Chat"
        >
          <UsersIcon className="h-4 w-4" />
        </Button>
      )}
      
      {course.hasAccess ? (
        <Link to={`/course/${course.id}/learn`} className="flex-1">
          <Button className="w-full">Continue Learning</Button>
        </Link>
      ) : course.isFree ? (
        <Link to={`/course/${course.id}/learn`} className="flex-1">
          <Button className="w-full">Start Learning</Button>
        </Link>
      ) : (
        <Link to={`/course/${course.id}/buy`} className="flex-1">
          <Button className="w-full">Buy Course</Button>
        </Link>
      )}
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function NotFoundState() {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <BookIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Course Not Found</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            This course doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/")}>Browse Courses</Button>
        </div>
      </Container>
    </div>
  );
}

function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatReadingTime(minutes: number): string {
  if (minutes === 0) return "—";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes} min`;
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}
