import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider, useTheme } from "@skola/ui";
import { config } from "./wagmi";
import { AuthProvider } from "../contexts/AuthContext";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent serialization issues with DOM elements
      structuralSharing: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('40')) return false;
        return failureCount < 3;
      },
    },
  },
});

function RainbowKitThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const rainbowTheme = isDark
    ? darkTheme({
        accentColor: "#8b5cf6",
        accentColorForeground: "white",
        borderRadius: "large",
      })
    : lightTheme({
        accentColor: "#8b5cf6",
        accentColorForeground: "white",
        borderRadius: "large",
      });

  return <RainbowKitProvider theme={rainbowTheme}>{children}</RainbowKitProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <RainbowKitThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </RainbowKitThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
