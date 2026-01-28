import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "academy.skola.app",
  appName: "Skola",
  webDir: "dist",
  server: {
    // In production, serve from the bundled assets
    // For dev, uncomment the url below and point to your Vite dev server
    // url: "http://YOUR_LOCAL_IP:5174",
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Skola",
  },
  android: {
    backgroundColor: "#0a0a0a",
  },
};

export default config;
