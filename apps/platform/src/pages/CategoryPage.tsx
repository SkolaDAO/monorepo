import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@skola/ui";
import { useCategory } from "../hooks/useCategories";
import { useCourses } from "../hooks/useApiCourses";

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { category, isLoading: categoryLoading, error: categoryError } = useCategory(slug || "");
  const { data, isLoading: coursesLoading } = useCourses({
    page,
    limit: 12,
    category: slug,
  });

  const courses = data?.data || [];
  const pagination = data?.pagination;

  if (categoryLoading) {
    return <LoadingState />;
  }

  if (categoryError || !category) {
    return <ErrorState message={categoryError?.message || "Category not found"} />;
  }

  const baseColor = category.color || "#3B82F6";

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${baseColor}40 0%, transparent 50%, ${baseColor}20 100%)`,
          }}
        />
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: baseColor }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: baseColor }}
        />

        <Container>
          <div className="relative pt-8 pb-12">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to categories</span>
            </Link>

            <div className="flex items-start gap-6">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                style={{ backgroundColor: baseColor }}
              >
                <CategoryIcon icon={category.icon} className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {category.name}
                  </h1>
                  {category.courseCount > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {category.courseCount} {category.courseCount === 1 ? "course" : "courses"}
                    </Badge>
                  )}
                </div>
                {category.description && (
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="-mt-4">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState categoryName={category.name} />
          )}
        </div>
      </Container>
    </div>
  );
}

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    priceUsd: string;
    isFree: boolean;
    lessonCount: number;
    creator?: {
      id: string;
      username: string | null;
      avatar: string | null;
      address: string;
    };
    categories?: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
    }[];
  };
}

function CourseCard({ course }: CourseCardProps) {
  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Link to={`/course/${course.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute right-3 top-3">
            {course.isFree ? (
              <Badge className="bg-emerald-500 text-white">Free</Badge>
            ) : (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                ${Number(course.priceUsd).toFixed(0)}
              </Badge>
            )}
          </div>
        </div>
        <CardHeader className="pb-2">
          {course.categories && course.categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {course.categories.slice(0, 2).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: cat.color || undefined, color: cat.color || undefined }}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
          <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {course.creator?.avatar ? (
                <img
                  src={course.creator.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  {(course.creator?.username || course.creator?.address || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="truncate">
                {course.creator?.username || truncateAddress(course.creator?.address || "")}
              </span>
            </div>
            <span>{course.lessonCount} lessons</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading category...</p>
        </div>
      </Container>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <AlertIcon className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Category not found</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Link to="/categories">
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to categories
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}

function EmptyState({ categoryName }: { categoryName: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <BookIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses in {categoryName}</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Be the first to publish a course in this category!
          </p>
          <Link to="/explore">
            <Button variant="outline">Browse all courses</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryIcon({ icon, className }: { icon: string | null; className?: string }) {
  const iconMap: Record<string, JSX.Element> = {
    cube: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    code: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    palette: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    camera: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    music: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    briefcase: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    heart: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    default: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  };

  return iconMap[icon || "default"] || iconMap.default;
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
