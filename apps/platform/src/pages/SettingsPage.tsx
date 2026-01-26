import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, toast } from "@skola/ui";
import { useAuth } from "../contexts/AuthContext";
import { ImageUpload } from "../components/ImageUpload";
import { api } from "../lib/api";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type UserProfile = {
  id: string;
  address: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  socials: {
    twitter?: string | null;
    farcaster?: string | null;
    youtube?: string | null;
    github?: string | null;
    discord?: string | null;
    telegram?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    website?: string | null;
  } | null;
  isCreator: boolean;
  creatorTier: string | null;
  referralCode: string | null;
};

export function SettingsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, signIn, isLoading: authLoading } = useAuth();

  if (!isConnected) {
    return <NotConnectedState />;
  }

  if (!isAuthenticated) {
    return <NotSignedInState onSignIn={signIn} isLoading={authLoading} />;
  }

  return <SettingsContent />;
}

function SettingsContent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState({
    twitter: "",
    farcaster: "",
    youtube: "",
    github: "",
    discord: "",
    telegram: "",
    instagram: "",
    linkedin: "",
    website: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch profile on mount
  useEffect(() => {
    api
      .get<UserProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        setUsername(data.username || "");
        setAvatar(data.avatar || "");
        setBio(data.bio || "");
        setSocials({
          twitter: data.socials?.twitter || "",
          farcaster: data.socials?.farcaster || "",
          youtube: data.socials?.youtube || "",
          github: data.socials?.github || "",
          discord: data.socials?.discord || "",
          telegram: data.socials?.telegram || "",
          instagram: data.socials?.instagram || "",
          linkedin: data.socials?.linkedin || "",
          website: data.socials?.website || "",
        });
      })
      .catch(() => {
        toast.error("Failed to load profile");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (username && username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }
    if (bio && bio.length > 500) {
      newErrors.bio = "Bio must be under 500 characters";
    }
    if (socials.website && !isValidUrl(socials.website)) {
      newErrors.website = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updated = await api.patch<UserProfile>("/users/me", {
        username: username || null,
        avatar: avatar || null,
        bio: bio || null,
        socials: {
          twitter: socials.twitter || null,
          farcaster: socials.farcaster || null,
          youtube: socials.youtube || null,
          github: socials.github || null,
          discord: socials.discord || null,
          telegram: socials.telegram || null,
          instagram: socials.instagram || null,
          linkedin: socials.linkedin || null,
          website: socials.website || null,
        },
      });
      setProfile(updated);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const error = err as { error?: string };
      toast.error(error?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSocialChange = (platform: keyof typeof socials, value: string) => {
    setSocials((prev) => ({ ...prev, [platform]: value }));
    if (errors[platform]) {
      setErrors((prev) => ({ ...prev, [platform]: "" }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Container>
        <div className="py-8 md:py-12 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile and account settings
            </p>
          </div>

          {/* Profile Section */}
          <Card className="mb-6 border-0 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium mb-3">Profile Picture</label>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-border">
                        <UserIcon className="h-10 w-10 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <ImageUpload
                      value={avatar}
                      onChange={setAvatar}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((p) => ({ ...p, username: "" }));
                    }}
                    placeholder="yourname"
                    className={`w-full rounded-xl border-2 bg-muted/30 pl-9 pr-4 py-3 text-sm outline-none transition-all focus:bg-background ${
                      errors.username ? "border-destructive" : "border-transparent focus:border-primary"
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-destructive">{errors.username}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  This will be displayed instead of your wallet address
                </p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    if (errors.bio) setErrors((p) => ({ ...p, bio: "" }));
                  }}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className={`w-full rounded-xl border-2 bg-muted/30 px-4 py-3 text-sm outline-none transition-all focus:bg-background resize-none ${
                    errors.bio ? "border-destructive" : "border-transparent focus:border-primary"
                  }`}
                />
                {errors.bio && <p className="mt-1 text-sm text-destructive">{errors.bio}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Social Links Section */}
          <Card className="mb-6 border-0 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Twitter */}
              <SocialInput
                label="Twitter / X"
                icon={<TwitterIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="x.com/"
                value={socials.twitter}
                onChange={(v) => handleSocialChange("twitter", v)}
              />

              {/* Farcaster */}
              <SocialInput
                label="Farcaster"
                icon={<FarcasterIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="warpcast.com/"
                value={socials.farcaster}
                onChange={(v) => handleSocialChange("farcaster", v)}
              />

              {/* YouTube */}
              <SocialInput
                label="YouTube"
                icon={<YouTubeIcon className="h-5 w-5" />}
                placeholder="channel or full URL"
                prefix="youtube.com/"
                value={socials.youtube}
                onChange={(v) => handleSocialChange("youtube", v)}
              />

              {/* GitHub */}
              <SocialInput
                label="GitHub"
                icon={<GitHubIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="github.com/"
                value={socials.github}
                onChange={(v) => handleSocialChange("github", v)}
              />

              {/* Discord */}
              <SocialInput
                label="Discord"
                icon={<DiscordIcon className="h-5 w-5" />}
                placeholder="username or invite link"
                value={socials.discord}
                onChange={(v) => handleSocialChange("discord", v)}
              />

              {/* Telegram */}
              <SocialInput
                label="Telegram"
                icon={<TelegramIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="t.me/"
                value={socials.telegram}
                onChange={(v) => handleSocialChange("telegram", v)}
              />

              {/* Instagram */}
              <SocialInput
                label="Instagram"
                icon={<InstagramIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="instagram.com/"
                value={socials.instagram}
                onChange={(v) => handleSocialChange("instagram", v)}
              />

              {/* LinkedIn */}
              <SocialInput
                label="LinkedIn"
                icon={<LinkedInIcon className="h-5 w-5" />}
                placeholder="username"
                prefix="linkedin.com/in/"
                value={socials.linkedin}
                onChange={(v) => handleSocialChange("linkedin", v)}
              />

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <GlobeIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="url"
                    value={socials.website}
                    onChange={(e) => handleSocialChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={`flex-1 rounded-xl border-2 bg-muted/30 px-4 py-2.5 text-sm outline-none transition-all focus:bg-background ${
                      errors.website ? "border-destructive" : "border-transparent focus:border-primary"
                    }`}
                  />
                </div>
                {errors.website && (
                  <p className="mt-1 text-sm text-destructive">{errors.website}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="mb-8 border-0 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Wallet Address</p>
                  <p className="text-xs text-muted-foreground font-mono">{profile?.address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(profile?.address || "");
                    toast.success("Address copied!");
                  }}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>

              {profile?.referralCode && (
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div>
                    <p className="text-sm font-medium">Referral Code</p>
                    <p className="text-xs text-muted-foreground font-mono">{profile.referralCode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}?ref=${profile.referralCode}`
                      );
                      toast.success("Referral link copied!");
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Creator Status</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.isCreator ? "Active Creator" : "Not a creator"}
                  </p>
                </div>
                {profile?.isCreator ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                    {profile.creatorTier || "Starter"}
                  </span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    Become Creator
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => navigate("/dashboard")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button className="flex-1 h-12" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ============================================
   COMPONENTS
   ============================================ */

type SocialInputProps = {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
};

function SocialInput({ label, icon, placeholder, prefix, value, onChange }: SocialInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div className="flex-1 flex items-center rounded-xl border-2 border-transparent bg-muted/30 focus-within:border-primary focus-within:bg-background transition-all">
          {prefix && (
            <span className="pl-4 text-sm text-muted-foreground whitespace-nowrap">{prefix}</span>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent ${prefix ? "pl-1" : "pl-4"} pr-4 py-2.5 text-sm outline-none`}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================
   STATES
   ============================================ */

function NotConnectedState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
          <WalletIcon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-8">
          Connect your wallet to access settings.
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}

function NotSignedInState({ onSignIn, isLoading }: { onSignIn: () => void; isLoading: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
          <LockIcon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">
          Sign in with your wallet to access settings.
        </p>
        <Button size="lg" onClick={onSignIn} disabled={isLoading} className="h-14 px-8">
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </div>
    </div>
  );
}

/* ============================================
   ICONS
   ============================================ */

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.24 3.6H5.76a.96.96 0 0 0-.96.96v14.88c0 .53.43.96.96.96h12.48a.96.96 0 0 0 .96-.96V4.56a.96.96 0 0 0-.96-.96ZM7.68 14.4V9.6h2.4v4.8h-2.4Zm4.32 0V8.64h2.4v5.76H12Zm4.32 0V7.68h2.4v6.72h-2.4Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
