# Pick My Wine - App Distribution Guide

This guide provides instructions on how to distribute your Pick My Wine app to your friend for testing.

## Method 1: Using App Distribution Services (Easiest)

### For iOS: TestFlight via App Store Connect

1. **Set up an Apple Developer Account** ($99/year):
   - Register at [developer.apple.com](https://developer.apple.com)
   - Complete the enrollment process

2. **Configure Xcode with your Account**:
   - Open Xcode
   - Go to Preferences > Accounts
   - Add your Apple Developer account
   - Open your project with `open ios/Runner.xcworkspace`
   - Select the 'Runner' project and then the 'Runner' target
   - Under Signing & Capabilities, select your team
   - Ensure your bundle identifier is unique (currently `com.yourname.pickmywine`)

3. **Upload to App Store Connect**:
   - In Xcode, select Product > Archive
   - When the archive is complete, click "Distribute App"
   - Select "App Store Connect" and follow the prompts
   - Check "Upload" (not "Export")
   - Complete the upload process

4. **Set up TestFlight**:
   - Log in to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your app
   - Go to the TestFlight tab
   - Invite your friend as a tester using their email address
   - They'll receive instructions to install TestFlight and your app

### For Android: Firebase App Distribution or Email

1. **Create a Keystore** (one-time setup):
   ```
   keytool -genkey -v -keystore ~/pickmywine-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pickmywine
   ```

2. **Configure Signing**:
   - Create a file at `android/key.properties` with:
   ```
   storePassword=your-keystore-password
   keyPassword=your-key-password
   keyAlias=pickmywine
   storeFile=/Users/yourname/pickmywine-key.jks
   ```
   - Update `android/app/build.gradle` to use this keystore

3. **Build the APK**:
   ```
   flutter build apk --release
   ```

4. **Share the APK**:
   - The APK will be at `build/app/outputs/flutter-apk/app-release.apk`
   - Email this file to your friend or use a file sharing service
   - They'll need to enable "Install from Unknown Sources" to install it

## Method 2: Direct to Device (for quick tests)

### For iOS: Direct Installation via Xcode

If your friend is nearby, this is the fastest method:
1. Connect their iPhone to your Mac
2. Open your project in Xcode
3. Select their device from the device dropdown
4. Click Run
5. They'll need to trust your developer certificate on their device

### For Android: Direct Installation via USB

1. Enable Developer Options on their Android device
2. Connect their device to your computer via USB
3. Enable USB debugging on their device
4. Run `flutter install` to install directly to their device

## Method 3: Use Web-based Platforms

If setting up developer environments is challenging, consider web-based alternatives:

### FlutterFlow

1. Import your project to FlutterFlow
2. Share a preview URL with your friend
3. They can test the app in their browser

### Use a Build Service

Services like Codemagic or Bitrise can build iOS and Android apps without local setup:
1. Push your code to GitHub
2. Connect the repository to a build service
3. Configure the build
4. Share the resulting app with your friend

## Need Help?

If you encounter issues, consider:
1. Following Flutter's deployment guides: [iOS](https://flutter.dev/docs/deployment/ios) and [Android](https://flutter.dev/docs/deployment/android)
2. Searching Stack Overflow for specific error messages
3. Using Flutter's Discord community for realtime help 