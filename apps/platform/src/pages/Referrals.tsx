import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Container, Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@skola/ui";
import { useAuth } from "../contexts/AuthContext";
import { useReferralStats, useReferralEarnings, useRegenerateReferralCode } from "../hooks/useReferrals";

export function ReferralsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, signIn } = useAuth();

  if (!isConnected) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <GiftIcon className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Referral Program</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Connect your wallet to access your referral dashboard and earn 3% on every sale.
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
              Sign in with your wallet to access your referral dashboard.
            </p>
            <Button onClick={() => signIn()}>Sign In</Button>
          </div>
        </Container>
      </div>
    );
  }

  return <AuthenticatedReferrals />;
}

function AuthenticatedReferrals() {
  const { stats, isLoading, refetch: refetchStats } = useReferralStats();
  const { earnings } = useReferralEarnings();
  const { regenerate, isLoading: isRegenerating } = useRegenerateReferralCode();
  const [copied, setCopied] = useState(false);

  const referralLink = stats?.referralCode
    ? `${window.location.origin}?ref=${stats.referralCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    await regenerate();
    refetchStats();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">
            Earn 3% on every course sale through your referral link
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="mt-2 text-3xl font-bold">{stats?.totalReferrals ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="mt-2 text-3xl font-bold">
                ${Number(stats?.totalEarningsUsd ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="mt-2 text-3xl font-bold">3%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 rounded-lg border border-input bg-muted px-4 py-2 text-sm"
                />
                <Button onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Your Code</p>
                  <p className="text-2xl font-bold text-primary">{stats?.referralCode}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
              <div className="rounded-lg bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Share your link with friends. When they sign up and purchase a course,
                  you'll earn <span className="font-semibold text-primary">3%</span> of the sale price.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReferrals.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.username || truncateAddress(user.address)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <p>No referrals yet</p>
                  <p className="text-sm mt-1">Share your link to start earning</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {earnings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Earning History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                      {earning.course.thumbnail ? (
                        <img
                          src={earning.course.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{earning.course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Purchased by {earning.buyer.username || truncateAddress(earning.buyer.address)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-green-600">
                        +${Number(earning.earning ?? 0).toFixed(2)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(earning.purchasedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
