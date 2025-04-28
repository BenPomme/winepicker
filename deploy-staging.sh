#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process for WinePicker Next.js app to Firebase Staging${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies with legacy peer deps...${NC}"
npm install --legacy-peer-deps

# Build the project (next build now exports with output: 'export' config)
echo -e "${YELLOW}Building and exporting the Next.js app...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for staging...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting (default target = staging)
echo -e "${YELLOW}Deploying to Firebase staging hosting...${NC}"
firebase deploy --only hosting:default

echo -e "${GREEN}Firebase staging deployment completed.${NC}"
echo -e "${YELLOW}Your app is now available at https://winepicker-63daa.web.app/${NC}"

# Verify and screenshot the deployment
echo -e "${YELLOW}Verifying and capturing screenshots of the deployment...${NC}"
if ! npm list -g puppeteer >/dev/null 2>&1; then
  echo -e "${YELLOW}Installing puppeteer for automated verification...${NC}"
  npm install -g puppeteer
fi

node scripts/verify-deployment.js
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Deployment verification succeeded. Screenshots saved to Desktop/wine-app-screenshots/${NC}"
else
  echo -e "${RED}Deployment verification had issues. Check the logs and screenshots in Desktop/wine-app-screenshots/${NC}"
fi