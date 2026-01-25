import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge } from "@skola/ui";
import { useCourses } from "../hooks/useApiCourses";
import { useCategories } from "../hooks/useCategories";

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") || undefined;
  const freeOnly = searchParams.get("free") === "true";
  const searchQuery = searchParams.get("q") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(searchQuery || "");

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { data, isLoading: coursesLoading } = useCourses({
    page,
    limit: 12,
    search: searchQuery,
    category: categorySlug,
    free: freeOnly ? true : undefined,
  });

  const courses = data?.data || [];
  const pagination = data?.pagination;

  const handleCategoryClick = (slug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleFreeToggle = () => {
    const params = new URLSearchParams(searchParams);
    if (freeOnly) {
      params.delete("free");
    } else {
      params.set("free", "true");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Courses</h1>
          <p className="text-muted-foreground">
            Learn from expert creators. Quality content, fair prices.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant={!categorySlug ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryClick(null)}
          >
            All
          </Button>
          <Button
            variant={freeOnly ? "default" : "outline"}
            size="sm"
            onClick={handleFreeToggle}
            className={freeOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            Free
          </Button>
          <div className="h-6 w-px bg-border" />
          {categoriesLoading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          ) : (
            categories.slice(0, 8).map((category) => (
              <Button
                key={category.id}
                variant={categorySlug === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category.slug)}
              >
                {category.name}
                {category.courseCount > 0 && (
                  <span className="ml-1 text-xs opacity-70">({category.courseCount})</span>
                )}
              </Button>
            ))
          )}
          {categories.length > 8 && (
            <Link to="/categories">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>

        {selectedCategory && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: selectedCategory.color || "#3B82F6" }}
              >
                <CategoryIcon icon={selectedCategory.icon} className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">{selectedCategory.name}</h2>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {searchQuery && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Search results for "<span className="font-medium text-foreground">{searchQuery}</span>"
              {pagination && ` (${pagination.total} results)`}
            </p>
          </div>
        )}

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
                  onClick={() => handlePageChange(page - 1)}
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
                        onClick={() => handlePageChange(pageNum)}
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
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <BookIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold">No courses found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery || categorySlug
                ? "Try adjusting your filters or search terms."
                : "Be the first to publish a course!"}
            </p>
            {(searchQuery || categorySlug) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchParams({});
                  setSearchInput("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
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
    default: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  };

  return iconMap[icon || "default"] || iconMap.default;
}
