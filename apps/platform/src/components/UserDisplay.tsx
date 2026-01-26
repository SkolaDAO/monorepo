import { Link } from "react-router-dom";

type User = {
  id?: string;
  address: string;
  username?: string | null;
  avatar?: string | null;
};

type UserDisplayProps = {
  user: User;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  linkToProfile?: boolean;
  className?: string;
};

export function UserDisplay({
  user,
  showAvatar = false,
  avatarSize = "sm",
  linkToProfile = false,
  className = "",
}: UserDisplayProps) {
  const displayName = user.username || formatAddress(user.address);

  const avatarSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showAvatar && (
        <span className={`${avatarSizes[avatarSize]} rounded-full overflow-hidden flex-shrink-0`}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-xs font-medium text-primary/60">
                {(user.username || user.address.slice(2, 4)).slice(0, 2).toUpperCase()}
              </span>
            </span>
          )}
        </span>
      )}
      <span className={user.username ? "font-medium" : "font-mono text-muted-foreground"}>
        {user.username ? `@${displayName}` : displayName}
      </span>
    </span>
  );

  if (linkToProfile && user.id) {
    return (
      <Link
        to={`/user/${user.id}`}
        className="hover:text-primary transition-colors"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getDisplayName(user: { username?: string | null; address: string }): string {
  return user.username || formatAddress(user.address);
}

// Avatar component for standalone use
type UserAvatarProps = {
  user: User;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const sizes = {
    xs: "w-5 h-5 text-[8px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-12 h-12 text-base",
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {user.avatar ? (
        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="font-medium text-primary/60">
            {(user.username || user.address.slice(2, 4)).slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
