import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Prism from "prismjs";
import "prismjs/components/prism-solidity";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
import { Container, Button, cn } from "@skola/ui";

void Prism;
import { useCourse } from "../hooks/useApiCourses";
import { useLessons, useLesson } from "../hooks/useApiLessons";
import { useCourseCommunityRoom } from "../hooks/useChat";
import { FeedbackModal } from "../components/FeedbackModal";

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(text: string | null | undefined): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}

function processLessonContent(content: string | null | undefined): string {
  if (!content) return "";
  
  // If content is markdown wrapped in <p> tags, extract and convert
  let processed = content;
  
  // Check if it looks like markdown wrapped in p tags
  if (content.includes("<p>") && (content.includes("##") || content.includes("```") || content.includes("- "))) {
    // Strip p tags and convert markdown to HTML
    processed = content
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");
    
    // Convert markdown to HTML
    processed = markdownToHtml(processed);
  }
  
  return processed;
}

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Code blocks (must be first)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  let inList = false;
  html = html.split('\n').map(line => {
    const match = line.match(/^[-*+] (.+)$/);
    if (match) {
      const item = `<li>${match[1]}</li>`;
      if (!inList) {
        inList = true;
        return `<ul>${item}`;
      }
      return item;
    } else if (inList && line.trim() === '') {
      inList = false;
      return '</ul>';
    }
    if (inList) {
      inList = false;
      return `</ul>${line}`;
    }
    return line;
  }).join('\n');
  if (inList) html += '</ul>';

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.match(/^<[a-z]/i)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function CourseLearnPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonId = searchParams.get("lesson");

  const { course, isLoading: courseLoading } = useCourse(id!);
  const { chapters, hasAccess, isLoading: lessonsLoading } = useLessons(id!);
  const { roomId: communityRoomId } = useCourseCommunityRoom(id!);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonId);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const allLessons = useMemo(() => {
    return chapters.flatMap((ch) => ch.lessons);
  }, [chapters]);

  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => l.id === selectedLessonId);
  }, [allLessons, selectedLessonId]);

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  useEffect(() => {
    if (!selectedLessonId && allLessons.length > 0) {
      const firstAccessibleLesson = allLessons.find((l) => l.canAccess);
      if (firstAccessibleLesson) {
        setSelectedLessonId(firstAccessibleLesson.id);
        const chapter = chapters.find((ch) => ch.lessons.some((l) => l.id === firstAccessibleLesson.id));
        if (chapter) {
          setExpandedChapters((prev) => new Set([...prev, chapter.id]));
        }
      }
    }
  }, [allLessons, chapters, selectedLessonId]);

  useEffect(() => {
    if (selectedLessonId) {
      setSearchParams({ lesson: selectedLessonId }, { replace: true });
      const chapter = chapters.find((ch) => ch.lessons.some((l) => l.id === selectedLessonId));
      if (chapter) {
        setExpandedChapters((prev) => new Set([...prev, chapter.id]));
      }
    }
  }, [selectedLessonId, setSearchParams, chapters]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const navigateToLesson = (lesson: typeof allLessons[0] | null) => {
    if (lesson?.canAccess) {
      setSelectedLessonId(lesson.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (courseLoading || lessonsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-8">
        <Container>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Course not found</h1>
            <p className="mt-2 text-muted-foreground">
              This course doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button className="mt-4">Back to Explore</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="py-8">
        <Container>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Required</h1>
            <p className="mt-2 text-muted-foreground">
              You need to purchase this course to access the content.
            </p>
            <Link to={`/course/${id}`}>
              <Button className="mt-4">View Course Details</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:flex-row">
      <div className="flex items-center gap-3 border-b border-border p-3 lg:hidden">
        <Link
          to={`/course/${id}`}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <h2 className="font-semibold line-clamp-1 flex-1">{course.title}</h2>
      </div>

      <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-border lg:block pb-16">
        <div className="sticky top-0 border-b border-border bg-background p-4 z-10">
          <Link to={`/course/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to course
          </Link>
          <h2 className="mt-2 font-semibold line-clamp-2">{course.title}</h2>
        </div>
        <nav className="p-2 space-y-1">
          {chapters.map((chapter) => {
            const isExpanded = expandedChapters.has(chapter.id);
            const chapterLessonsCount = chapter.lessons.length;
            const accessibleCount = chapter.lessons.filter((l) => l.canAccess).length;
            const chapterReadingTime = chapter.lessons.reduce(
              (acc, l) => acc + estimateReadingTime(l.content),
              0
            );
            
            return (
              <div key={chapter.id} className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <ChevronIcon className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-90")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{chapter.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {accessibleCount}/{chapterLessonsCount} lessons
                      {chapterReadingTime > 0 && ` · ${chapterReadingTime} min`}
                    </p>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {chapter.lessons.map((lesson) => {
                      const readingTime = estimateReadingTime(lesson.content);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => lesson.canAccess && setSelectedLessonId(lesson.id)}
                          disabled={!lesson.canAccess}
                          className={cn(
                            "w-full p-3 pl-9 text-left transition-colors",
                            selectedLessonId === lesson.id
                              ? "bg-primary/10 text-primary"
                              : lesson.canAccess
                              ? "hover:bg-muted/50"
                              : "cursor-not-allowed opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {lesson.hasVideo && lesson.videoDuration ? (
                                  <span className="flex items-center gap-1">
                                    <VideoIcon className="h-3 w-3" />
                                    {formatDuration(lesson.videoDuration)}
                                  </span>
                                ) : readingTime > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {readingTime} min read
                                  </span>
                                ) : null}
                                {lesson.isPreview && (
                                  <span className="text-primary">Preview</span>
                                )}
                              </div>
                            </div>
                            {!lesson.canAccess && (
                              <LockIcon className="h-3 w-3 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {communityRoomId && (
          <div className="border-t border-border p-4">
            <Link to={`/chat?room=${communityRoomId}`} className="block">
              <Button variant="outline" className="w-full">
                <ChatIcon className="mr-2 h-4 w-4" />
                Community Chat
              </Button>
            </Link>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto pb-20">
        {selectedLessonId ? (
          <LessonContent lessonId={selectedLessonId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Select a lesson to start learning</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 lg:pl-80">
          <button
            onClick={() => navigateToLesson(prevLesson)}
            disabled={!prevLesson?.canAccess}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              prevLesson?.canAccess
                ? "hover:bg-muted"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            <FeedbackIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          <button
            onClick={() => navigateToLesson(nextLesson)}
            disabled={!nextLesson?.canAccess}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              nextLesson?.canAccess
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "opacity-50 cursor-not-allowed bg-muted"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        courseId={id!}
        lessonId={selectedLessonId || undefined}
      />
    </div>
  );
}

function LessonContent({ lessonId }: { lessonId: string }) {
  const { lesson, isLoading, error } = useLesson(lessonId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Failed to load lesson</p>
      </div>
    );
  }

  const readingTime = estimateReadingTime(lesson.content);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      
      {(lesson.videoDuration || readingTime > 0) && (
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          {lesson.videoDuration && (
            <span className="flex items-center gap-1">
              <VideoIcon className="h-4 w-4" />
              {formatDuration(lesson.videoDuration)} video
            </span>
          )}
          {readingTime > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {readingTime} min read
            </span>
          )}
        </div>
      )}

      {lesson.videoUrl && (
        <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-black">
          <video
            src={lesson.videoUrl}
            controls
            className="h-full w-full"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {lesson.content && (
        <div 
          className="prose prose-neutral dark:prose-invert mt-6 max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-2xl prose-h1:mb-4 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-7 prose-p:mb-4 prose-li:my-1 prose-ul:my-4 prose-ol:my-4 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-pre:my-4 prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-hr:my-8"
          dangerouslySetInnerHTML={{ __html: processLessonContent(lesson.content) }}
        />
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}
