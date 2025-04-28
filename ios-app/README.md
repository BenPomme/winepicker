# MyWine iOS App

This directory will contain iOS-specific configuration files and assets for the native app build process.

## Structure

- `/ios-app/assets/` - iOS-specific image assets and resources
- `/ios-app/config/` - iOS app configuration files
- `/ios-app/scripts/` - Build and deployment scripts for iOS

## iOS App Setup

The iOS app is built using a hybrid approach with React Native and React Native Web. This allows us to share most of the codebase between the web and native applications while providing native iOS capabilities.

### App Features

- Camera integration for taking wine label photos
- Native navigation experience
- Offline capabilities
- Push notifications
- Device-specific optimizations

### Building the iOS App

Instructions for building and running the iOS app will be added here once the implementation is complete.

### Development Workflow

1. Make changes to shared components and logic in the main project
2. Test web-specific behavior with `npm run dev`
3. Test iOS-specific behavior with iOS simulator (commands to be added)
4. Deploy web app normally
5. Deploy iOS app through App Store Connect (instructions to be added)

## Rollback Procedure

If the iOS app implementation needs to be reverted:

1. Switch back to the main branch: `git checkout staging`
2. Continue web-only development
3. No data migration is needed as the backend remains unchanged