import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge } from "@skola/ui";
import { useUSDCBalance } from "../hooks/useUSDC";
import { useCreatorInfo, useEthPrice } from "../hooks/useCreatorRegistry";
import { useMyCourses } from "../hooks/useApiCourses";
import { useAuth } from "../contexts/AuthContext";
import type { Course } from "../lib/api";
import { CreatorModal } from "../components/CreatorModal";

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

  useEffect(() => {
    if (isAuthenticated) {
      refetchCourses();
    }
  }, [isAuthenticated, refetchCourses]);

  const ethBalanceNum = ethBalance ? Number(formatEther(ethBalance.value)) : 0;
  const ethBalanceUsd = ethPriceUsd ? ethBalanceNum * ethPriceUsd : null;

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Connected as {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
          {isRegistered && (
            <Button onClick={() => navigate("/create")}>Create Course</Button>
          )}
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="ETH Balance"
            value={ethBalanceNum.toFixed(4)}
            subtitle={ethBalanceUsd !== null ? `$${ethBalanceUsd.toFixed(2)}` : undefined}
          />
          <StatCard title="USDC Balance" value={`$${Number(usdcBalance).toFixed(2)}`} />
          <StatCard
            title="Courses"
            value={courses.length.toString()}
            subtitle={isRegistered ? "Unlimited" : "Register to create"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <NotSignedInState onSignIn={signIn} />
                ) : isRegistered ? (
                  coursesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={isRegistered ? "default" : "secondary"}>
                      {isRegistered ? "Registered" : "Not registered"}
                    </Badge>
                  </div>
                  {isRegistered && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-semibold">{paidUsdFormatted}</span>
                    </div>
                  )}
                  {!isRegistered && (
                    <Button className="w-full" onClick={() => setIsStakingModalOpen(true)}>
                      Become a Creator — $20
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={!isRegistered}
                  onClick={() => navigate("/create")}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
                <Button variant="secondary" className="w-full justify-start" disabled={!isRegistered}>
                  <ChartIcon className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="secondary" className="w-full justify-start" disabled>
                  <WithdrawIcon className="mr-2 h-4 w-4" />
                  Withdraw Earnings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      <CreatorModal 
        isOpen={isStakingModalOpen} 
        onClose={() => setIsStakingModalOpen(false)} 
        onSuccess={refetchCreatorInfo}
      />
    </div>
  );
}

function CreatorCoursesList({ courses }: { courses: Course[] }) {
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <Link to={`/course/${course.id}`} className="h-16 w-24 overflow-hidden rounded-md bg-muted flex-shrink-0">
            <img
              src={
                course.thumbnail ||
                "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=60&fit=crop"
              }
              alt={course.title}
              className="h-full w-full object-cover"
            />
          </Link>
          <Link to={`/course/${course.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{course.title}</h4>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{course.isFree ? "Free" : `$${Number(course.priceUsd).toFixed(0)}`}</span>
              <span>{course.lessonCount} lessons</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/course/${course.id}/edit`}>
              <Button variant="outline" size="sm">
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link to={`/course/${course.id}`}>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotConnectedState() {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <WalletIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Connect Your Wallet</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Connect your wallet to access your creator dashboard, manage courses, and track earnings.
          </p>
          <ConnectButton />
        </div>
      </Container>
    </div>
  );
}

function NotRegisteredState({ onRegister }: { onRegister: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <LockIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">Become a Creator</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        Pay once, publish forever. Early payers receive token airdrop when we launch.
      </p>
      <Button onClick={onRegister}>Get Started</Button>
    </div>
  );
}

function EmptyCoursesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <BookIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold">No courses yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">Create your first course to start earning</p>
      <Button size="sm" onClick={onCreate}>
        Create Course
      </Button>
    </div>
  );
}

function NotSignedInState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <LockIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">Sign In Required</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        Sign in with your wallet to view and manage your courses.
      </p>
      <Button onClick={onSignIn}>Sign In</Button>
    </div>
  );
}

function StatCard({
  title,
  value,
  badge,
  subtitle,
}: {
  title: string;
  value: string;
  badge?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function WithdrawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
