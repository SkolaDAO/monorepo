import { cn } from "@skola/ui";

type VerifiedBadgeProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

export function VerifiedBadge({ size = "sm", className }: VerifiedBadgeProps) {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <svg
      className={cn(sizes[size], "flex-shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Verified"
    >
      <circle cx="12" cy="12" r="11" fill="url(#goldGradient)" />
      <path
        d="M7.5 12.5L10.5 15.5L16.5 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B928" />
          <stop offset="1" stopColor="#D4941C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type CreatorNameProps = {
  username?: string | null;
  address: string;
  isVerified?: boolean;
  showBadge?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

export function CreatorName({
  username,
  address,
  isVerified,
  showBadge = true,
  size = "sm",
  className,
}: CreatorNameProps) {
  const displayName = username ? `@${username}` : formatAddress(address);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={username ? "font-medium" : "font-mono text-muted-foreground"}>
        {displayName}
      </span>
      {showBadge && isVerified && <VerifiedBadge size={size} />}
    </span>
  );
}

function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
