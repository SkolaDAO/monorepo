import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base } from "wagmi/chains";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Skola",
  projectId,
  chains: [base],
  ssr: false,
  transports: {
    [base.id]: http(undefined, {
      batch: {
        batchSize: 100,
        wait: 50,
      },
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export { base };
