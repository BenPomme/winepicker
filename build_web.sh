#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "===== Building mobile-friendly web version of Pick My Wine ====="

# Make sure Flutter is using the latest web support
echo "Enabling Flutter web support..."
flutter config --enable-web

# Get dependencies
echo "Getting dependencies..."
flutter pub get

# Build for web in release mode
echo "Building web app in release mode..."
flutter build web --release

echo "Build completed! The web app is available in build/web/"
echo ""
echo "===== DEPLOYMENT OPTIONS ====="
echo "1. GitHub Pages: Copy the contents of build/web/ to your GitHub Pages repository"
echo "2. Firebase Hosting: Install Firebase CLI and run 'firebase deploy'"
echo "3. Netlify: Drag and drop the build/web folder to Netlify or set up CI/CD"
echo "4. Local testing: Run 'cd build/web && python -m http.server 8000' and open http://localhost:8000"
echo ""
echo "For best results, host on a service that supports HTTPS, as this is required for camera access and other features." 