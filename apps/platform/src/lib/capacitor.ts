import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";

/**
 * Initialize Capacitor native plugins.
 * Safe to call on web — guards against non-native platforms.
 */
export function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar: dark content on dark background
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  if (Capacitor.getPlatform() === "android") {
    StatusBar.setBackgroundColor({ color: "#0a0a0a" }).catch(() => {});
  }

  // Hide splash screen after app is ready
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

  // Keyboard: scroll into view on input focus (iOS)
  if (Capacitor.getPlatform() === "ios") {
    Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
  }

  // Handle Android back button
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}

/**
 * Check if running inside a native Capacitor shell.
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * Get the current platform: 'ios' | 'android' | 'web'
 */
export const platform = Capacitor.getPlatform();
