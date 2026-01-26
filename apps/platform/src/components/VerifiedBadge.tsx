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
      className={cn(sizes[size], "text-blue-500 flex-shrink-0", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Verified"
    >
      <path d="M8.52 3.59a3.5 3.5 0 0 1 6.96 0c1.2.16 2.33.8 3.1 1.83a3.5 3.5 0 0 1 4.92 4.92 3.5 3.5 0 0 1 0 6.96 3.5 3.5 0 0 1-4.92 4.92 3.5 3.5 0 0 1-6.96 0 3.5 3.5 0 0 1-4.92-4.92 3.5 3.5 0 0 1 0-6.96A3.5 3.5 0 0 1 8.52 3.6Zm6.78 6.2a.75.75 0 1 0-1.1-1.02l-3.78 4.07-1.64-1.64a.75.75 0 0 0-1.06 1.06l2.2 2.2a.75.75 0 0 0 1.08-.02l4.3-4.65Z" />
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
