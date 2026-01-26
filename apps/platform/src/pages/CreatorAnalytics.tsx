import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  Badge,
  Button,
  cn,
} from "@skola/ui";
import {
  useCreatorDashboard,
  useCourseTimeSeries,
  useCourseFunnel,
  useCourseEngagement,
  type CourseAnalytics,
} from "../hooks/useCreatorAnalytics";
import { useAuth } from "../contexts/AuthContext";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function CreatorAnalyticsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useCreatorDashboard();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet and sign in to view your creator analytics.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Analytics</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
        </div>
      </Container>
    );
  }

  if (data.courses.length === 0) {
    return (
      <Container className="py-12">
        <div className="text-center py-20">
          <div className="mb-4 inline-flex p-4 rounded-full bg-muted">
            <ChartIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Courses Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first course to start tracking analytics.
          </p>
          <Button onClick={() => navigate("/create")}>Create Course</Button>
        </div>
      </Container>
    );
  }

  const selectedCourse = selectedCourseId
    ? data.courses.find((c) => c.id === selectedCourseId)
    : null;

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track performance across all your courses
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Overall Stats */}
          <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <StatCard
              title="Total Revenue"
              value={`$${Number(data.totalStats.totalRevenue).toFixed(2)}`}
              icon={<DollarIcon className="w-5 h-5" />}
              gradient="from-emerald-500/20 to-teal-500/20"
            />
            <StatCard
              title="Total Students"
              value={data.totalStats.totalStudents.toString()}
              icon={<UsersIcon className="w-5 h-5" />}
              gradient="from-blue-500/20 to-indigo-500/20"
            />
            <StatCard
              title="Total Purchases"
              value={data.totalStats.totalPurchases.toString()}
              icon={<CartIcon className="w-5 h-5" />}
              gradient="from-purple-500/20 to-pink-500/20"
            />
            <StatCard
              title="Course Views"
              value={data.totalStats.totalCourseViews.toString()}
              icon={<EyeIcon className="w-5 h-5" />}
              gradient="from-amber-500/20 to-orange-500/20"
            />
            <StatCard
              title="Conversion Rate"
              value={`${data.totalStats.overallConversionRate}%`}
              icon={<TrendingIcon className="w-5 h-5" />}
              gradient="from-rose-500/20 to-red-500/20"
            />
          </motion.div>

          {/* Course Selector */}
          <motion.div variants={fadeInUp} className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCourseId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCourseId(null)}
              >
                All Courses
              </Button>
              {data.courses.map((course) => (
                <Button
                  key={course.id}
                  variant={selectedCourseId === course.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCourseId(course.id)}
                  className="whitespace-nowrap"
                >
                  {course.title}
                </Button>
              ))}
            </div>
          </motion.div>

          {selectedCourse ? (
            <CourseDetailedAnalytics course={selectedCourse} />
          ) : (
            <AllCoursesOverview courses={data.courses} />
          )}
        </motion.div>
      </Container>
    </div>
  );
}

function AllCoursesOverview({ courses }: { courses: CourseAnalytics[] }) {
  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader>
          <CardTitle>All Courses Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4">Course</th>
                  <th className="pb-3 px-4 text-right">Views</th>
                  <th className="pb-3 px-4 text-right">Purchases</th>
                  <th className="pb-3 px-4 text-right">Revenue</th>
                  <th className="pb-3 px-4 text-right">Conversion</th>
                  <th className="pb-3 px-4 text-right">Completions</th>
                  <th className="pb-3 pl-4 text-right">Chat Activity</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.isFree ? (
                              <Badge variant="secondary" className="text-xs">Free</Badge>
                            ) : (
                              `$${Number(course.priceUsd).toFixed(0)}`
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums">
                      {course.stats.views.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums">
                      {course.stats.purchases.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums">
                      ${Number(course.stats.revenue).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={cn(
                        "tabular-nums",
                        course.stats.conversionRate > 5 ? "text-emerald-500" :
                        course.stats.conversionRate > 2 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {course.stats.conversionRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right tabular-nums">
                      {course.stats.lessonCompletions.toLocaleString()}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="text-sm">
                        <span className="tabular-nums">{course.stats.chatStats.messageCount}</span>
                        <span className="text-muted-foreground"> msgs</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {course.stats.chatStats.activeParticipants} active
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CourseDetailedAnalytics({ course }: { course: CourseAnalytics }) {
  // Time series data available for future chart implementation
  useCourseTimeSeries(course.id);
  const { data: funnel, isLoading: funnelLoading } = useCourseFunnel(course.id);
  const { data: engagement, isLoading: engagementLoading } = useCourseEngagement(course.id);

  return (
    <div className="space-y-6">
      {/* Course Stats */}
      <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Course Views"
          value={course.stats.views.toString()}
          icon={<EyeIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Purchases"
          value={course.stats.purchases.toString()}
          subtitle={`$${Number(course.stats.revenue).toFixed(2)} revenue`}
          icon={<CartIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Conversion Rate"
          value={`${course.stats.conversionRate}%`}
          subtitle="Views → Purchases"
          icon={<TrendingIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Lesson Completions"
          value={course.stats.lessonCompletions.toString()}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />
      </motion.div>

      {/* Funnel Analysis */}
      {funnel && !funnelLoading && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <FunnelStep
                  label="Unique Visitors"
                  value={funnel.funnel.uniqueVisitors}
                  percentage={100}
                />
                <FunnelStep
                  label="Purchased"
                  value={funnel.funnel.purchases}
                  percentage={funnel.conversionRates.viewToPurchase}
                  previousLabel="of visitors"
                />
                <FunnelStep
                  label="Started Learning"
                  value={funnel.funnel.activeLearners}
                  percentage={funnel.conversionRates.purchaseToActive}
                  previousLabel="of buyers"
                />
                <FunnelStep
                  label="Completed Course"
                  value={funnel.funnel.completers}
                  percentage={funnel.conversionRates.activeToComplete}
                  previousLabel="of learners"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Chapter & Lesson Analytics */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Content Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            {course.chapters.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No chapters yet. Add content to see engagement data.
              </p>
            ) : (
              <div className="space-y-4">
                {course.chapters.map((chapter) => (
                  <div key={chapter.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">
                        Chapter {chapter.order}: {chapter.title}
                      </h4>
                      <Badge variant="secondary">
                        {chapter.views} views
                      </Badge>
                    </div>
                    {chapter.lessons.length > 0 && (
                      <div className="space-y-2 ml-4">
                        {chapter.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
                          >
                            <span className="text-muted-foreground">
                              {lesson.order}. {lesson.title}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="tabular-nums">
                                <EyeIcon className="w-3 h-3 inline mr-1" />
                                {lesson.views}
                              </span>
                              <span className="tabular-nums text-emerald-500">
                                <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                                {lesson.completions}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Student Progress */}
      {engagement && !engagementLoading && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {engagement.students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No students yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {engagement.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {student.avatar ? (
                          <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UsersIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {student.username || `${student.id.slice(0, 8)}...`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(student.purchasedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {student.completedLessons}/{student.totalLessons} lessons
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${student.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <Badge
                        variant={
                          student.progressPercent === 100
                            ? "default"
                            : student.progressPercent > 50
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {student.progressPercent}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Chat Stats */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Community Chat Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {course.stats.chatStats.messageCount}
                </div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {course.stats.chatStats.activeParticipants}
                </div>
                <div className="text-sm text-muted-foreground">Active Participants</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  previousLabel,
}: {
  label: string;
  value: number;
  percentage: number;
  previousLabel?: string;
}) {
  return (
    <div className="text-center">
      <div className="h-24 relative mb-2">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-primary/20 rounded-t-lg transition-all"
          style={{ height: `${percentage}%`, width: "80%" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <div className="font-medium text-sm">{label}</div>
      {previousLabel && (
        <div className="text-xs text-muted-foreground">
          {percentage}% {previousLabel}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {gradient && (
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
      )}
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Icons
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default CreatorAnalyticsPage;
