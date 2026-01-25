import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Container, Card, CardContent, Badge, Button } from "@skola/ui";
import { useAuth } from "../contexts/AuthContext";
import { usePurchasedCourses } from "../hooks/useApiCourses";

export function MyCoursesPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, signIn } = useAuth();

  if (!isConnected) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <BookIcon className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">My Courses</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Connect your wallet to see your purchased courses.
            </p>
            <ConnectButton />
          </div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <LockIcon className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Sign In Required</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Sign in with your wallet to access your courses.
            </p>
            <Button onClick={() => signIn()}>Sign In</Button>
          </div>
        </Container>
      </div>
    );
  }

  return <AuthenticatedMyCourses />;
}

function AuthenticatedMyCourses() {
  const { courses, isLoading } = usePurchasedCourses();

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">
            Continue learning from your purchased courses
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <BookIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold">No courses yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Explore our courses and start learning
                </p>
                <Link to="/">
                  <Button>Explore Courses</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} to={`/course/${course.id}/learn`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={course.thumbnail || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop"}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{course.lessonCount} lessons</span>
                      <span>•</span>
                      <Badge variant="secondary">Purchased</Badge>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" className="w-full">
                        Continue Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
