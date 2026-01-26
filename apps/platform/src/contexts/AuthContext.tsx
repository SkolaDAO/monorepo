import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { api, type User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  signIn: (referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const hasAutoSignedIn = useRef(false);
  const previousAddress = useRef<string | undefined>(undefined);
  const hasTriedRestore = useRef(false);

  const refreshUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const userData = await api.get<User>("/auth/me");
      setUser(userData);
    } catch {
      api.clearTokens();
      setUser(null);
    }
  }, []);

  // Initial load - check if already authenticated
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (api.isAuthenticated() && isConnected) {
        await refreshUser();
        hasTriedRestore.current = true;
      } else if (isConnected) {
        // Connected but no tokens - mark restore as done
        hasTriedRestore.current = true;
        setUser(null);
      } else {
        // Not connected yet - don't mark restore as done, wait for connection
        setUser(null);
      }
      setIsLoading(false);
    };
    init();
  }, [isConnected, refreshUser]);

  // Clear user when wallet disconnects
  useEffect(() => {
    if (!isConnected && user) {
      api.clearTokens();
      setUser(null);
      hasAutoSignedIn.current = false;
      hasTriedRestore.current = false;
    }
  }, [isConnected, user]);

  // Auto sign-in when wallet connects (or changes)
  useEffect(() => {
    const autoSignIn = async () => {
      // Only auto sign-in if:
      // 1. Wallet is connected
      // 2. Not already authenticated
      // 3. Not currently signing in
      // 4. Not still loading
      // 5. Haven't already tried auto sign-in for this address
      // 6. Have already tried to restore existing session (prevents race condition on reload)
      if (
        isConnected &&
        address &&
        chainId &&
        !user &&
        !isSigningIn &&
        !isLoading &&
        !api.isAuthenticated() &&
        hasTriedRestore.current &&
        (previousAddress.current !== address || !hasAutoSignedIn.current)
      ) {
        previousAddress.current = address;
        hasAutoSignedIn.current = true;
        
        try {
          setIsSigningIn(true);
          
          const { nonce } = await api.get<{ nonce: string }>("/auth/nonce");

          const message = new SiweMessage({
            domain: window.location.host,
            address,
            statement: "Sign in to Skola",
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce,
          });

          const messageString = message.prepareMessage();
          const signature = await signMessageAsync({ message: messageString });

          const response = await api.post<{
            accessToken: string;
            refreshToken: string;
            user: User;
          }>("/auth/verify", {
            message: messageString,
            signature,
          });

          api.setTokens(response.accessToken, response.refreshToken);
          
          const syncResult = await api.post<{ isCreator: boolean; tier: string | null }>("/users/sync-creator").catch(() => null);
          
          if (syncResult?.isCreator) {
            setUser({ ...response.user, isCreator: true, creatorTier: syncResult.tier as User["creatorTier"] });
          } else {
            setUser(response.user);
          }
        } catch (error) {
          console.error("Auto sign-in failed:", error);
          // User rejected the signature or something went wrong
          // Don't disconnect - they can try again manually if needed
        } finally {
          setIsSigningIn(false);
        }
      }
    };

    autoSignIn();
  }, [isConnected, address, chainId, user, isSigningIn, isLoading, signMessageAsync]);

  const signIn = async (referralCode?: string) => {
    if (!address || !chainId) {
      throw new Error("Wallet not connected");
    }

    if (isSigningIn) {
      return;
    }

    try {
      setIsSigningIn(true);
      
      const { nonce } = await api.get<{ nonce: string }>("/auth/nonce");

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Skola",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const messageString = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageString });

      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/verify", {
        message: messageString,
        signature,
        referralCode,
      });

      api.setTokens(response.accessToken, response.refreshToken);
      
      const syncResult = await api.post<{ isCreator: boolean; tier: string | null }>("/users/sync-creator").catch(() => null);
      
      if (syncResult?.isCreator) {
        setUser({ ...response.user, isCreator: true, creatorTier: syncResult.tier as User["creatorTier"] });
      } else {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      if (api.isAuthenticated()) {
        await api.post("/auth/logout").catch(() => {});
      }
    } finally {
      api.clearTokens();
      setUser(null);
      hasAutoSignedIn.current = false;
      disconnect();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSigningIn,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
