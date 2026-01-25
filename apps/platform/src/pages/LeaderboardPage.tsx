import { useState, useEffect } from "react";
import { Container, Card, CardContent, cn } from "@skola/ui";
import { api, CreatorLeaderboardEntry } from "../lib/api";

interface LeaderboardResponse {
  data: CreatorLeaderboardEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

function useLeaderboard() {
  const [data, setData] = useState<CreatorLeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<LeaderboardResponse>("/leaderboard/creators", {
          limit: 50,
          offset: 0,
        });
        setData(response.data);
        setTotal(response.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { data, total, isLoading, error };
}

function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEarnings(earnings: string): string {
  const value = parseFloat(earnings);
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function LeaderboardPage() {
  const { data, total, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const totalPoints = data.reduce((sum, entry) => sum + entry.points, 0);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />

        <Container>
          <div className="relative pt-12 pb-16">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <TrophyIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Season 1</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Creator Leaderboard
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Top creators ranked by impact. Earn points through courses, students, and revenue.
              </p>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>10 pts / course</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/70" />
                  <span>1 pt / student</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  <span>5 pts / $100</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 -mt-8 mb-10">
          <StatCard
            icon={<UsersIcon className="h-5 w-5" />}
            label="Total Creators"
            value={total.toString()}
          />
          <StatCard
            icon={<StarIcon className="h-5 w-5" />}
            label="Total Points"
            value={totalPoints.toLocaleString()}
          />
          <StatCard
            icon={<TrendingUpIcon className="h-5 w-5" />}
            label="This Season"
            value="Active"
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {data.slice(0, 3).length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                {data.slice(0, 3).map((entry) => (
                  <TopCreatorCard key={entry.user.id} entry={entry} />
                ))}
              </div>
            )}

            {data.length > 3 && (
              <Card className="overflow-hidden border-border/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Creator
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                          Courses
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                          Students
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                          Earnings
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {data.slice(3).map((entry) => (
                        <LeaderboardRow key={entry.user.id} entry={entry} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

interface TopCreatorCardProps {
  entry: CreatorLeaderboardEntry;
}

function TopCreatorCard({ entry }: TopCreatorCardProps) {
  const rankStyles = {
    1: {
      border: "border-amber-400/50",
      bg: "bg-gradient-to-br from-amber-500/10 to-amber-600/5",
      badge: "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950",
      glow: "shadow-lg shadow-amber-500/10",
    },
    2: {
      border: "border-slate-400/50",
      bg: "bg-gradient-to-br from-slate-400/10 to-slate-500/5",
      badge: "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950",
      glow: "shadow-lg shadow-slate-500/10",
    },
    3: {
      border: "border-orange-600/50",
      bg: "bg-gradient-to-br from-orange-600/10 to-orange-700/5",
      badge: "bg-gradient-to-br from-orange-500 to-orange-700 text-orange-950",
      glow: "shadow-lg shadow-orange-500/10",
    },
  };

  const style = rankStyles[entry.rank as 1 | 2 | 3] || rankStyles[3];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        style.border,
        style.bg,
        style.glow,
        entry.rank === 1 && "md:order-2 md:scale-105 md:hover:scale-[1.07]"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg",
              style.badge
            )}
          >
            {entry.rank}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{entry.points.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Points</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-muted ring-2 ring-border overflow-hidden">
              {entry.user.avatar ? (
                <img
                  src={entry.user.avatar}
                  alt={entry.user.username || "Creator"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-semibold">
                  {(entry.user.username || entry.user.address || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            {entry.rank === 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                <CrownIcon className="h-3 w-3 text-amber-900" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {entry.user.username || truncateAddress(entry.user.address)}
            </p>
            {entry.user.username && (
              <p className="text-xs text-muted-foreground truncate">
                {truncateAddress(entry.user.address)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/30">
          <div className="text-center">
            <div className="text-lg font-semibold">{entry.stats.coursesCount}</div>
            <div className="text-xs text-muted-foreground">Courses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{entry.stats.studentsCount}</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatEarnings(entry.stats.totalEarnings)}</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  entry: CreatorLeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  return (
    <tr className="group transition-colors hover:bg-muted/30">
      <td className="px-6 py-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 font-semibold text-sm">
          {entry.rank}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted ring-1 ring-border overflow-hidden shrink-0">
            {entry.user.avatar ? (
              <img
                src={entry.user.avatar}
                alt={entry.user.username || "Creator"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 font-medium">
                {(entry.user.username || entry.user.address || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {entry.user.username || truncateAddress(entry.user.address)}
            </p>
            {entry.user.username && (
              <p className="text-xs text-muted-foreground">{truncateAddress(entry.user.address)}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center hidden sm:table-cell">
        <span className="font-medium">{entry.stats.coursesCount}</span>
      </td>
      <td className="px-6 py-4 text-center hidden md:table-cell">
        <span className="font-medium">{entry.stats.studentsCount}</span>
      </td>
      <td className="px-6 py-4 text-center hidden lg:table-cell">
        <span className="font-medium text-emerald-500">{formatEarnings(entry.stats.totalEarnings)}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 font-semibold text-primary">
          {entry.points.toLocaleString()}
        </span>
      </td>
    </tr>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

function StatCard({ icon, label, value, className }: StatCardProps) {
  return (
    <Card className={cn("border-border/50 bg-background/80 backdrop-blur", className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
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
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
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
          <h2 className="text-xl font-semibold mb-2">Failed to load</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </Container>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-border/50">
      <CardContent className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <TrophyIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No creators yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Be the first to publish a course and claim the top spot on the leaderboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.98 6.98 0 01-3.77 1.022h-1m0 0h-1a6.98 6.98 0 01-3.77-1.022"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
