import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge, cn } from "@skola/ui";
import { useCourses } from "../hooks/useApiCourses";
import { useCategories } from "../hooks/useCategories";
import { VerifiedBadge } from "../components/VerifiedBadge";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") || undefined;
  const freeOnly = searchParams.get("free") === "true";
  const searchQuery = searchParams.get("q") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(searchQuery || "");
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });

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
    <div className="min-h-screen">
      {/* Hero Section with animated background */}
      <div ref={heroRef} className="relative overflow-hidden border-b border-border/50">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(217 91% 60% / 0.06) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <Container className="relative py-12 md:py-16">
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="max-w-3xl"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Explore{" "}
              <span className="text-gradient">Web3 Courses</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground mb-8"
            >
              Learn blockchain, DeFi, smart contracts and more from expert creators.
              Quality content, fair prices, instant access.
            </motion.p>

            {/* Search bar */}
            <motion.form variants={fadeInUp} onSubmit={handleSearch}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search courses, topics, or creators..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-background/80 backdrop-blur-sm py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <Button type="submit" size="lg" className="px-6 h-12 shadow-lg shadow-primary/20">
                  Search
                </Button>
              </div>
            </motion.form>
          </motion.div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={!categorySlug ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(null)}
              className={cn(
                "rounded-full transition-all",
                !categorySlug && "shadow-md shadow-primary/20"
              )}
            >
              All Courses
            </Button>
            <Button
              variant={freeOnly ? "default" : "outline"}
              size="sm"
              onClick={handleFreeToggle}
              className={cn(
                "rounded-full transition-all",
                freeOnly ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20" : ""
              )}
            >
              <span className="mr-1">🆓</span> Free
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            {categoriesLoading ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            ) : (
              categories.slice(0, 6).map((category) => (
                <Button
                  key={category.id}
                  variant={categorySlug === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryClick(category.slug)}
                  className={cn(
                    "rounded-full transition-all",
                    categorySlug === category.slug && "shadow-md shadow-primary/20"
                  )}
                >
                  {category.name}
                  {category.courseCount > 0 && (
                    <span className="ml-1.5 text-xs opacity-60">({category.courseCount})</span>
                  )}
                </Button>
              ))
            )}
            {categories.length > 6 && (
              <Link to="/categories">
                <Button variant="ghost" size="sm" className="rounded-full">
                  View All →
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Selected category banner */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-border/50 bg-gradient-to-r from-primary/5 to-transparent p-5"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
                style={{ backgroundColor: selectedCategory.color || "#3B82F6" }}
              >
                <CategoryIcon icon={selectedCategory.icon} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search results banner */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <p className="text-muted-foreground">
              Showing results for{" "}
              <span className="font-medium text-foreground">"{searchQuery}"</span>
              {pagination && (
                <span className="ml-2 text-sm">({pagination.total} found)</span>
              )}
            </p>
          </motion.div>
        )}

        {/* Course grid */}
        {coursesLoading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((course) => (
                <motion.div key={course.id} variants={fadeInUp}>
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 flex justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="rounded-full"
                >
                  ← Previous
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
                        variant={page === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-full",
                          page === pageNum && "shadow-md shadow-primary/20"
                        )}
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
                  className="rounded-full"
                >
                  Next →
                </Button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <BookIcon className="h-12 w-12 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No courses found</h3>
            <p className="mb-6 text-muted-foreground max-w-md">
              {searchQuery || categorySlug
                ? "Try adjusting your filters or search terms to find what you're looking for."
                : "Be the first to publish a course and start earning!"}
            </p>
            {(searchQuery || categorySlug) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchParams({});
                  setSearchInput("");
                }}
                className="rounded-full"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
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
    rating?: {
      average: number;
      count: number;
    } | null;
    creator?: {
      id: string;
      username: string | null;
      avatar: string | null;
      address: string;
      isVerified?: boolean;
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
    <Link to={`/course/${course.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookIcon className="h-16 w-16 text-primary/30" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Price badge */}
          <div className="absolute right-3 top-3">
            {course.isFree ? (
              <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                Free
              </Badge>
            ) : (
              <Badge className="bg-background/95 backdrop-blur-sm border-0 shadow-lg text-foreground">
                ${Number(course.priceUsd).toFixed(0)}
              </Badge>
            )}
          </div>

          {/* Lesson count - shows on hover */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
              {course.lessonCount} lessons
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          {course.categories && course.categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {course.categories.slice(0, 2).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="text-xs rounded-full px-2.5"
                  style={{ 
                    borderColor: cat.color || undefined, 
                    color: cat.color || undefined,
                    backgroundColor: cat.color ? `${cat.color}10` : undefined
                  }}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
          <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              {course.creator?.avatar ? (
                <img
                  src={course.creator.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-background flex-shrink-0"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-medium text-white ring-2 ring-background flex-shrink-0">
                  {(course.creator?.username || course.creator?.address || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="truncate font-medium flex items-center gap-1">
                {course.creator?.username || truncateAddress(course.creator?.address || "")}
                {course.creator?.isVerified && <VerifiedBadge size="xs" />}
              </span>
            </div>
            {course.rating && course.rating.count > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">{course.rating.average}</span>
                <span className="text-xs">({course.rating.count})</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-video bg-muted shimmer" />
      <CardHeader className="pb-2">
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-16 rounded-full bg-muted shimmer" />
        </div>
        <div className="h-6 w-3/4 rounded bg-muted shimmer" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted shimmer" />
          <div className="h-4 w-24 rounded bg-muted shimmer" />
        </div>
      </CardContent>
    </Card>
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
