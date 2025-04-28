# MyWine - Hybrid iOS and Web App

This project is a hybrid application that works as both a web app and a native iOS app using React Native. It leverages React Native Web to share code between platforms while providing a native experience on iOS devices.

## Project Structure

- `/components` - Shared web components
- `/pages` - Next.js web pages
- `/src` - React Native specific code
  - `/src/native` - Platform-specific components and screens
  - `/src/AppContainer.tsx` - Entry point that determines platform
  - `/src/NativeApp.tsx` - Main React Native app
- `/ios-app` - iOS-specific files and configuration
- `/utils` - Shared utilities and business logic

## Features

- Wine label scanning and analysis using AI
- Personal wine collection management
- User authentication via Firebase
- Multilingual support (English, French, Chinese, Arabic)
- Native iOS camera integration
- Cross-platform design

## Requirements

- Node.js (v16+)
- React Native CLI
- Xcode (for iOS development)
- CocoaPods (for iOS dependencies)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up iOS build environment (requires Xcode):

```bash
npm run ios:build
```

3. Install CocoaPods dependencies:

```bash
npm run ios:pod-install
```

## Running the App

### Web Version

```bash
npm run dev
```

This will start the Next.js development server at http://localhost:3000

### iOS Version

```bash
npm run ios:start
```

Then in another terminal:

```bash
npx react-native run-ios
```

This will launch the iOS simulator with the app running.

## Building for Production

### Web

```bash
npm run build
```

### iOS

For iOS production builds, use Xcode to archive and distribute the app.

## Platform Detection

The application uses platform detection utilities in `utils/platform.ts` to conditionally render components based on the current platform. This allows for custom optimized experiences on each platform while sharing core business logic.

## Development Workflow

1. Develop shared business logic in the `utils` directory
2. Create platform-specific UI components in `/components` (web) and `/src/native/components` (iOS)
3. Use the platform detection utilities to conditionally import or render components
4. Test on both web and iOS to ensure consistent behavior

## Rollback Procedure

If you need to revert to the web-only version:

```bash
git checkout staging
```

This will return to the web-only configuration without any React Native dependencies.