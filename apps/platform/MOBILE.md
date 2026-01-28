# Skola Mobile App (Capacitor)

The Skola platform app wrapped as native iOS and Android apps using Capacitor.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (workspace setup)
- **iOS**: macOS + Xcode 15+ + CocoaPods
- **Android**: Android Studio + JDK 17+

## Quick Start

```bash
# From the monorepo root
pnpm install

# Build web + sync to native
cd apps/platform
pnpm cap:build

# Open in Xcode (iOS)
pnpm cap:ios

# Open in Android Studio (Android)
pnpm cap:android
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm cap:build` | Build web app + sync to native platforms |
| `pnpm cap:sync` | Sync web assets + plugins (after web build) |
| `pnpm cap:ios` | Open iOS project in Xcode |
| `pnpm cap:android` | Open Android project in Android Studio |
| `pnpm cap:run:ios` | Build & run on iOS simulator/device |
| `pnpm cap:run:android` | Build & run on Android emulator/device |
| `pnpm cap:dev` | Live-reload dev mode (iOS) |

## Project Structure

```
apps/platform/
├── capacitor.config.ts    # Capacitor configuration
├── assets/                # Source assets (icon, splash)
│   ├── icon-only.png      # App icon (1024×1024)
│   ├── icon-foreground.png # Adaptive icon foreground
│   ├── icon-background.png # Adaptive icon background
│   ├── splash.png         # Splash screen (2732×2732)
│   └── splash-dark.png    # Dark mode splash
├── ios/                   # Native iOS project (Xcode)
│   └── App/
│       ├── App/
│       │   ├── Assets.xcassets/  # Generated icons & splash
│       │   └── public/           # Web assets (synced)
│       └── App.xcodeproj
├── android/               # Native Android project
│   └── app/
│       └── src/main/
│           ├── assets/public/  # Web assets (synced)
│           └── res/            # Generated icons & splash
├── dist/                  # Vite build output
└── src/
    └── lib/
        └── capacitor.ts   # Native plugin initialization
```

## App Configuration

**`capacitor.config.ts`:**
- **App ID**: `academy.skola.app`
- **App Name**: `Skola`
- **Web Dir**: `dist` (Vite output)
- **Theme**: Dark (#0a0a0a)

## Building for Release

### iOS (App Store)

1. `pnpm cap:build`
2. `pnpm cap:ios` → opens Xcode
3. In Xcode:
   - Select your Team under Signing & Capabilities
   - Set the Bundle Identifier to `academy.skola.app`
   - Select "Any iOS Device" as build target
   - Product → Archive
   - Distribute to App Store Connect

### Android (Play Store)

1. `pnpm cap:build`
2. `pnpm cap:android` → opens Android Studio
3. In Android Studio:
   - Build → Generate Signed Bundle/APK
   - Choose Android App Bundle (.aab)
   - Create/select your keystore
   - Build release bundle
   - Upload to Google Play Console

## Native Features

The app includes these Capacitor plugins:

| Plugin | Purpose |
|--------|---------|
| `@capacitor/app` | Back button handling, app state |
| `@capacitor/status-bar` | Dark status bar styling |
| `@capacitor/splash-screen` | Launch splash with logo |
| `@capacitor/keyboard` | Input focus handling |
| `@capacitor/browser` | External link opening |

## Wallet Connect (WalletConnect + RainbowKit)

The app uses RainbowKit for wallet connections. On mobile:
- **iOS**: WalletConnect will deep-link to installed wallet apps (MetaMask, Rainbow, etc.)
- **Android**: Same deep-linking behavior
- **In-app browser wallets**: Work natively since the WebView supports Web3

## Regenerating Assets

If you update the logo, regenerate all icons/splash screens:

```bash
# Put new logo in assets/icon-only.png (1024×1024 recommended)
npx @capacitor/assets generate \
  --iconBackgroundColor '#0a0a0a' \
  --splashBackgroundColor '#0a0a0a' \
  --assetPath assets
```

## Environment

The app reads `VITE_API_URL` at build time. For production:

```bash
VITE_API_URL=https://api.skola.academy pnpm cap:build
```

## Troubleshooting

### iOS: "No bundle URL present"
Run `pnpm cap:build` to ensure web assets are synced.

### Android: White screen
Check that `dist/` has content. Run `pnpm build` first.

### Wallet connect not working
Ensure the app's URL scheme is registered. Check `capacitor.config.ts` → `ios.scheme`.
