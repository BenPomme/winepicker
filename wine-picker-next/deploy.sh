#!/bin/bash

# Exit on error
set -e

# Clean up previous builds
rm -rf .next out

# Install dependencies
npm install

# Build the Next.js app
npm run build

# Export static files
npm run export

# Deploy to Firebase
firebase deploy --only hosting:production

echo "Deployment completed successfully!" 