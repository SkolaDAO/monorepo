import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge, toast } from "@skola/ui";
import { api } from "../lib/api";
import { ImageUpload } from "../components/ImageUpload";
import { useCategories } from "../hooks/useCategories";
import { NovelEditor } from "../components/NovelEditor";

type CourseCategory = {
  id: string;
  name: string;
  slug: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  priceUsd: string;
  isFree: boolean;
  isPublished: boolean;
  chapters: Chapter[];
  categories?: CourseCategory[];
};

type Chapter = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  order: number;
  isPreview: boolean;
  videoId: string | null;
  videoDuration: number | null;
};

type Tab = "details" | "content";

export function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (id && api.isAuthenticated()) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const [courseData, chaptersData] = await Promise.all([
        api.get<Course>(`/courses/${id}`),
        api.get<{ chapters: Chapter[] }>(`/lessons/course/${id}`),
      ]);

      setCourse({
        ...courseData,
        chapters: chaptersData.chapters || [],
      });
    } catch {
      toast.error("Failed to load course");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (data: Partial<Course>) => {
    setSaving(true);
    try {
      const updated = await api.patch<Course>(`/courses/${id}`, data);
      setCourse((prev) => (prev ? { ...prev, ...updated } : null));
      toast.success("Course updated");
    } catch {
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const publishCourse = async () => {
    setSaving(true);
    try {
      await api.post(`/courses/${id}/publish`);
      setCourse((prev) => (prev ? { ...prev, isPublished: true } : null));
      toast.success("Course published!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const unpublishCourse = async () => {
    setSaving(true);
    try {
      await api.post(`/courses/${id}/unpublish`);
      setCourse((prev) => (prev ? { ...prev, isPublished: false } : null));
      toast.success("Course unpublished");
    } catch {
      toast.error("Failed to unpublish");
    } finally {
      setSaving(false);
    }
  };

  const addChapter = async () => {
    try {
      const chapter = await api.post<Chapter>(`/chapters/course/${id}`, { title: "New Chapter" });
      setCourse((prev) =>
        prev ? { ...prev, chapters: [...prev.chapters, { ...chapter, lessons: [] }] } : null
      );
      toast.success("Chapter added");
    } catch {
      toast.error("Failed to add chapter");
    }
  };

  const updateChapter = async (chapterId: string, data: { title?: string; description?: string }) => {
    try {
      const updated = await api.patch<Chapter>(`/chapters/${chapterId}`, data);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((ch) => (ch.id === chapterId ? { ...ch, ...updated } : ch)),
            }
          : null
      );
    } catch {
      toast.error("Failed to update chapter");
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter and all its lessons?")) return;

    try {
      await api.delete(`/chapters/${chapterId}`);
      setCourse((prev) =>
        prev ? { ...prev, chapters: prev.chapters.filter((ch) => ch.id !== chapterId) } : null
      );
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete chapter");
    }
  };

  const addLesson = async (chapterId: string) => {
    try {
      const lesson = await api.post<Lesson>(`/lessons/chapter/${chapterId}`, { title: "New Lesson" });
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, lessons: [...ch.lessons, lesson] } : ch
              ),
            }
          : null
      );
      setSelectedLesson(lesson);
      toast.success("Lesson added");
    } catch {
      toast.error("Failed to add lesson");
    }
  };

  const updateLesson = async (lessonId: string, data: Partial<Lesson>) => {
    try {
      const updated = await api.patch<Lesson>(`/lessons/${lessonId}`, data);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((ch) => ({
                ...ch,
                lessons: ch.lessons.map((l) => (l.id === lessonId ? { ...l, ...updated } : l)),
              })),
            }
          : null
      );
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      toast.error("Failed to update lesson");
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;

    try {
      await api.delete(`/lessons/${lessonId}`);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((ch) => ({
                ...ch,
                lessons: ch.lessons.filter((l) => l.id !== lessonId),
              })),
            }
          : null
      );
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(null);
      }
      toast.success("Lesson deleted");
    } catch {
      toast.error("Failed to delete lesson");
    }
  };

  if (!isConnected) {
    return (
      <div className="py-8">
        <Container>
          <p className="text-center text-muted-foreground">Please connect your wallet</p>
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </Container>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-8">
        <Container>
          <p className="text-center text-muted-foreground">Course not found</p>
        </Container>
      </div>
    );
  }

  const lessonCount = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {course.chapters.length} chapters · {lessonCount} lessons
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {course.isPublished ? (
              <Button variant="outline" onClick={unpublishCourse} disabled={saving}>
                Unpublish
              </Button>
            ) : (
              <Button onClick={publishCourse} disabled={saving || lessonCount === 0}>
                {lessonCount === 0 ? "Add lessons to publish" : "Publish"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "details"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "content"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Content
          </button>
        </div>

        {activeTab === "details" ? (
          <DetailsTab course={course} onUpdate={updateCourse} saving={saving} courseId={id!} />
        ) : (
          <ContentTab
            course={course}
            selectedLesson={selectedLesson}
            onSelectLesson={setSelectedLesson}
            onAddChapter={addChapter}
            onUpdateChapter={updateChapter}
            onDeleteChapter={deleteChapter}
            onAddLesson={addLesson}
            onUpdateLesson={updateLesson}
            onDeleteLesson={deleteLesson}
          />
        )}
      </Container>
    </div>
  );
}

function DetailsTab({
  course,
  onUpdate,
  saving,
  courseId,
}: {
  course: Course;
  onUpdate: (data: Partial<Course>) => void;
  saving: boolean;
  courseId: string;
}) {
  const { categories: allCategories, isLoading: categoriesLoading } = useCategories();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [thumbnail, setThumbnail] = useState(course.thumbnail || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    course.categories?.map((c) => c.id) || []
  );
  const [savingCategories, setSavingCategories] = useState(false);

  const handleSave = () => {
    onUpdate({ title, description, thumbnail });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      if (prev.length >= 3) {
        toast.error("Maximum 3 categories allowed");
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const saveCategories = async () => {
    setSavingCategories(true);
    try {
      await api.put(`/courses/${courseId}/categories`, { categoryIds: selectedCategoryIds });
      toast.success("Categories updated");
    } catch {
      toast.error("Failed to update categories");
    } finally {
      setSavingCategories(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          <ImageUpload value={thumbnail} onChange={setThumbnail} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Categories</label>
            <span className="text-xs text-muted-foreground">{selectedCategoryIds.length}/3 selected</span>
          </div>
          {categoriesLoading ? (
            <div className="text-sm text-muted-foreground">Loading categories...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={saveCategories}
            disabled={savingCategories}
            className="mt-2"
          >
            {savingCategories ? "Saving..." : "Save Categories"}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Pricing</p>
          <p className="text-2xl font-bold mt-1">
            {course.isFree ? "Free" : `$${course.priceUsd}`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Price is set on-chain and cannot be changed here.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ContentTab({
  course,
  selectedLesson,
  onSelectLesson,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
}: {
  course: Course;
  selectedLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson | null) => void;
  onAddChapter: () => void;
  onUpdateChapter: (id: string, data: { title?: string }) => void;
  onDeleteChapter: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
  onUpdateLesson: (id: string, data: Partial<Lesson>) => void;
  onDeleteLesson: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Chapters</h3>
          <Button size="sm" variant="outline" onClick={onAddChapter}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Chapter
          </Button>
        </div>

        {course.chapters.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No chapters yet</p>
              <Button size="sm" className="mt-4" onClick={onAddChapter}>
                Add First Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {course.chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                selectedLessonId={selectedLesson?.id}
                onUpdate={onUpdateChapter}
                onDelete={onDeleteChapter}
                onAddLesson={onAddLesson}
                onSelectLesson={onSelectLesson}
                onDeleteLesson={onDeleteLesson}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {selectedLesson ? (
          <LessonEditor
            lesson={selectedLesson}
            onUpdate={onUpdateLesson}
            onClose={() => onSelectLesson(null)}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a lesson to edit</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ChapterCard({
  chapter,
  selectedLessonId,
  onUpdate,
  onDelete,
  onAddLesson,
  onSelectLesson,
  onDeleteLesson,
}: {
  chapter: Chapter;
  selectedLessonId?: string;
  onUpdate: (id: string, data: { title?: string }) => void;
  onDelete: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);

  const handleSave = () => {
    onUpdate(chapter.id, { title });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="flex-1 bg-transparent border-b border-primary outline-none text-sm font-medium"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium hover:text-primary text-left"
            >
              {chapter.title}
            </button>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => onAddLesson(chapter.id)}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Add lesson"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(chapter.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
              title="Delete chapter"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {chapter.lessons.length > 0 && (
          <div className="space-y-1 mt-2">
            {chapter.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded text-sm cursor-pointer group ${
                  selectedLessonId === lesson.id ? "bg-primary/10" : "hover:bg-muted"
                }`}
                onClick={() => onSelectLesson(lesson)}
              >
                <div className="flex items-center gap-2">
                  {lesson.videoId ? (
                    <VideoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="truncate">{lesson.title}</span>
                  {lesson.isPreview && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Preview
                    </Badge>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLesson(lesson.id);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LessonEditor({
  lesson,
  onUpdate,
  onClose,
}: {
  lesson: Lesson;
  onUpdate: (id: string, data: Partial<Lesson>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content || "");
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitle(lesson.title);
    setContent(lesson.content || "");
    setIsPreview(lesson.isPreview);
  }, [lesson.id]);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(lesson.id, { title, content, isPreview });
    setSaving(false);
    toast.success("Lesson saved");
  };

  const handleVideoUpload = async (file: File) => {
    if (!api.isAuthenticated()) return;

    setUploading(true);
    try {
      const { uploadUrl, uploadHeaders } = await api.post<{ uploadUrl: string; uploadHeaders: Record<string, string> }>(
        `/lessons/${lesson.id}/video`
      );

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      toast.success("Video uploaded! Processing...");
      onUpdate(lesson.id, {});
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Edit Lesson</CardTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <XIcon className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Free preview (visible to non-purchasers)</span>
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium">Video</label>
          {lesson.videoId ? (
            <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-primary" />
                <span className="text-sm">Video uploaded</span>
              </div>
              <Button variant="outline" size="sm" disabled>
                Replace (coming soon)
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                className="hidden"
                id="video-upload"
                disabled={uploading}
              />
              <label
                htmlFor="video-upload"
                className={`cursor-pointer ${uploading ? "opacity-50" : ""}`}
              >
                <VideoIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Click to upload video"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">MP4, WebM up to 2GB</p>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <NovelEditor
            initialContent={content}
            onChange={setContent}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Lesson"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
