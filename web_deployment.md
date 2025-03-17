# Mobile-Friendly Web Version of Pick My Wine

This guide explains how to build, test, and deploy the web version of the Pick My Wine app. The web version allows users to access your app from any device with a web browser, without installing anything.

## Prerequisites

- Flutter SDK installed and configured
- A code editor (VS Code, Android Studio, etc.)
- Git (optional, for version control)

## Building the Web App

### 1. Using the provided script

We've included a build script that handles the entire process for you:

```bash
# Make the script executable
chmod +x build_web.sh

# Run the script
./build_web.sh
```

The script will:
- Enable Flutter web support
- Get all dependencies
- Build the web app in release mode with optimal settings for mobile
- Provide deployment options

### 2. Manual build (if script doesn't work)

```bash
# Enable web support
flutter config --enable-web

# Get dependencies
flutter pub get

# Build for web in release mode
flutter build web --release
```

## Testing the Web App Locally

After building, test the app locally to ensure everything works correctly:

```bash
# Navigate to the build directory
cd build/web

# Start a local web server (using Python)
python -m http.server 8000
```

Now open a browser and visit `http://localhost:8000` to see your app.

## Mobile Optimization Features

The web version includes several mobile-friendly features:

1. **Adaptive UI**: Layout adjusts based on screen size
2. **App-like experience**: Full-screen mode when added to home screen
3. **Touch optimization**: Prevents unwanted pinch-to-zoom
4. **Offline support**: Service worker for offline access
5. **Fast loading**: Optimized loading screen
6. **Adaptive rendering**: Uses appropriate renderer based on device
7. **iOS PWA support**: Splash screens and home screen icon

## Deployment Options

### Option 1: GitHub Pages

1. Create a GitHub repository for your app
2. Push your code including the `build/web` directory
3. Enable GitHub Pages in the repository settings

### Option 2: Firebase Hosting (Recommended)

1. Create a Firebase account and project
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Login to Firebase: `firebase login`
4. Initialize Firebase: `firebase init` (select Hosting)
5. Deploy: `firebase deploy`

### Option 3: Netlify

1. Create a Netlify account
2. Drag and drop the `build/web` folder to Netlify's upload area
3. Configure domain settings if needed

### Option 4: Other Services

You can deploy to any web hosting service that supports static websites, including:
- Vercel
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps

## Important Notes for Web Version

1. **Camera Access**: Camera functionality requires HTTPS to work in most browsers
2. **Performance**: The web version may be slightly slower than the native app
3. **Storage**: Web storage is limited compared to native app storage
4. **Push Notifications**: Requires additional setup for web
5. **API Keys**: Ensure your API keys are properly secured
6. **Image Picking**: Web version uses browser's file picker instead of native gallery

## Promoting Your Web App

- Add the web URL to your app's social media profiles
- Include a QR code on marketing materials that links to the web app
- Add an "Add to Home Screen" tutorial for first-time visitors

## Maintenance

Remember to update your web app whenever you make significant changes to the mobile app. The process is the same:

```bash
./build_web.sh
# Then redeploy to your hosting service
``` 