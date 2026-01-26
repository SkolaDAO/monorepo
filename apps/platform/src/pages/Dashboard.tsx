import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, useInView } from "framer-motion";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge, cn } from "@skola/ui";
import { useUSDCBalance } from "../hooks/useUSDC";
import { useCreatorInfo, useEthPrice } from "../hooks/useCreatorRegistry";
import { useMyCourses } from "../hooks/useApiCourses";
import { useAuth } from "../contexts/AuthContext";
import type { Course } from "../lib/api";
import { CreatorModal } from "../components/CreatorModal";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export function DashboardPage() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return <NotConnectedState />;
  }

  return <ConnectedDashboard address={address!} />;
}

function ConnectedDashboard({ address }: { address: `0x${string}` }) {
  const navigate = useNavigate();
  const [isStakingModalOpen, setIsStakingModalOpen] = useState(false);
  const { data: ethBalance } = useBalance({ address });
  const { balance: usdcBalance } = useUSDCBalance(address);
  const { priceUsd: ethPriceUsd } = useEthPrice();
  const { isRegistered, paidUsdFormatted, refetch: refetchCreatorInfo } = useCreatorInfo(address);
  const { isAuthenticated, signIn } = useAuth();
  const { courses, isLoading: coursesLoading, refetch: refetchCourses } = useMyCourses();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isAuthenticated) {
      refetchCourses();
    }
  }, [isAuthenticated, refetchCourses]);

  const ethBalanceNum = ethBalance ? Number(formatEther(ethBalance.value)) : 0;
  const ethBalanceUsd = ethPriceUsd ? ethBalanceNum * ethPriceUsd : null;

  return (
    <div ref={ref} className="min-h-screen">
      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <Container className="relative py-10">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome back{" "}
                  <span className="text-gradient">Creator</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
              {isRegistered && (
                <motion.div variants={fadeInUp}>
                  <Button 
                    onClick={() => navigate("/create")} 
                    size="lg"
                    className="shadow-lg shadow-primary/20"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Course
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </Container>
      </div>

      <Container className="py-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          {/* Stats cards */}
          <motion.div variants={fadeInUp} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="ETH Balance"
              value={ethBalanceNum.toFixed(4)}
              subtitle={ethBalanceUsd !== null ? `≈ $${ethBalanceUsd.toFixed(2)}` : undefined}
              icon={<EthIcon className="w-6 h-6" />}
              gradient="from-blue-500/20 to-purple-500/20"
            />
            <StatCard 
              title="USDC Balance" 
              value={`$${Number(usdcBalance).toFixed(2)}`}
              icon={<DollarIcon className="w-6 h-6" />}
              gradient="from-emerald-500/20 to-teal-500/20"
            />
            <StatCard
              title="Published Courses"
              value={courses.length.toString()}
              subtitle={isRegistered ? "Unlimited access" : "Register to create"}
              icon={<BookIcon className="w-6 h-6" />}
              gradient="from-amber-500/20 to-orange-500/20"
            />
            <StatCard
              title="Creator Status"
              value={isRegistered ? "Active" : "Register"}
              subtitle={isRegistered ? `Paid $${paidUsdFormatted || "0"}` : "One-time $20"}
              icon={<StarIcon className="w-6 h-6" />}
              gradient="from-pink-500/20 to-rose-500/20"
              valueClassName={isRegistered ? "text-emerald-500" : "text-muted-foreground"}
            />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <Card className="overflow-hidden border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookIcon className="w-5 h-5 text-primary" />
                      Your Courses
                    </CardTitle>
                    {courses.length > 0 && (
                      <Badge variant="secondary">{courses.length} courses</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {!isAuthenticated ? (
                    <NotSignedInState onSignIn={signIn} />
                  ) : isRegistered ? (
                    coursesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : courses.length > 0 ? (
                      <CreatorCoursesList courses={courses} />
                    ) : (
                      <EmptyCoursesState onCreate={() => navigate("/create")} />
                    )
                  ) : (
                    <NotRegisteredState onRegister={() => setIsStakingModalOpen(true)} />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <RocketIcon className="w-5 h-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {isRegistered && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => navigate("/create")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PlusIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Create Course</div>
                        <div className="text-xs text-muted-foreground">Start a new course</div>
                      </div>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate("/my-courses")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BookIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">My Learning</div>
                      <div className="text-xs text-muted-foreground">Courses you've purchased</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate("/referrals")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <GiftIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Referrals</div>
                      <div className="text-xs text-muted-foreground">Earn 3% on referrals</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => navigate("/chat")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ChatIcon className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Messages</div>
                      <div className="text-xs text-muted-foreground">Chat with students</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {!isRegistered && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-primary" />
                      Become a Creator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Publish unlimited courses for a one-time payment of $20. Keep 92% of every sale.
                    </p>
                    <ul className="space-y-2 text-sm">
                      {["Unlimited courses", "92% revenue share", "Instant payments", "Built-in chat"].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-primary" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full shadow-lg shadow-primary/20" 
                      onClick={() => setIsStakingModalOpen(true)}
                    >
                      Register as Creator
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </motion.div>
      </Container>

      <CreatorModal
        isOpen={isStakingModalOpen}
        onClose={() => setIsStakingModalOpen(false)}
        onSuccess={() => {
          refetchCreatorInfo();
          setIsStakingModalOpen(false);
        }}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
  valueClassName?: string;
}

function StatCard({ title, value, subtitle, icon, gradient, valueClassName }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/50 group hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
        gradient || "from-primary/10 to-transparent"
      )} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotConnectedState() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="mb-6 inline-flex p-6 rounded-full bg-primary/10">
          <WalletIcon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">
          Connect your wallet to access your creator dashboard, manage courses, and track earnings.
        </p>
        <ConnectButton />
      </motion.div>
    </div>
  );
}

function NotSignedInState({ onSignIn }: { onSignIn: () => Promise<void> }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 inline-flex p-4 rounded-full bg-primary/10">
        <KeyIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">Sign in Required</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Sign a message to verify your wallet and access your courses.
      </p>
      <Button onClick={onSignIn}>Sign In</Button>
    </div>
  );
}

function NotRegisteredState({ onRegister }: { onRegister: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 inline-flex p-4 rounded-full bg-primary/10">
        <SparklesIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Become a Creator</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Register as a creator for a one-time $20 payment. Publish unlimited courses and keep 92% of every sale.
      </p>
      <Button onClick={onRegister} size="lg" className="shadow-lg shadow-primary/20">
        Register Now — $20
      </Button>
    </div>
  );
}

function EmptyCoursesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 inline-flex p-4 rounded-full bg-muted">
        <BookIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">No courses yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create your first course and start earning!
      </p>
      <Button onClick={onCreate}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Course
      </Button>
    </div>
  );
}

function CreatorCoursesList({ courses }: { courses: Course[] }) {
  return (
    <div className="space-y-3">
      {courses.map((course, idx) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Link
            to={`/course/${course.id}/edit`}
            className="flex items-center gap-4 rounded-xl border border-border/50 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all group"
          >
            <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt=""
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookIcon className="h-6 w-6 text-primary/50" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                {course.title}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{course.lessonCount || 0} lessons</span>
                <span>•</span>
                <span>
                  {course.isFree ? (
                    <span className="text-emerald-500">Free</span>
                  ) : (
                    `$${Number(course.priceUsd).toFixed(0)}`
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {course.isPublished ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
              <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function EthIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
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

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}
