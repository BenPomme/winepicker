#!/bin/bash

set -e

echo "Starting deployment process..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the Next.js app
echo "Building the Next.js app..."
npm run build

# Export the app as static files (output folder 'out')
echo "Exporting the app as static files..."
npm run export

# Deploy to GitHub Pages using the gh-pages package
echo "Deploying to GitHub Pages..."
npx gh-pages -d out

echo "Deployment successful. Your GitHub Pages site is updated." 