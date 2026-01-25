import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { api, type User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (api.isAuthenticated() && isConnected) {
        await refreshUser();
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    init();
  }, [isConnected, refreshUser]);

  useEffect(() => {
    if (!isConnected && user) {
      api.clearTokens();
      setUser(null);
    }
  }, [isConnected, user]);

  const signIn = async (referralCode?: string) => {
    if (!address || !chainId) {
      throw new Error("Wallet not connected");
    }

    try {
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
      disconnect();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
