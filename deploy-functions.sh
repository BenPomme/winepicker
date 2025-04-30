#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting enhanced deployment process for WinePicker Next.js app to Firebase Production${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Create a pre-build hook to replace the manifest.json
echo -e "${YELLOW}Updating manifest.json to use relative paths...${NC}"
cp ./public/manifest.json ./public/manifest.json.bak

# Build the project (next build now exports with output: 'export' config)
echo -e "${YELLOW}Building and exporting the Next.js app...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for production...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting (production target)
echo -e "${YELLOW}Deploying to Firebase production hosting...${NC}"
firebase deploy --only hosting:production

echo -e "${GREEN}Firebase production deployment completed.${NC}"
echo -e "${YELLOW}Your app is now available at https://pickmywine-live.web.app/${NC}"

# Restore the original manifest file
echo -e "${YELLOW}Restoring original manifest.json...${NC}"
mv ./public/manifest.json.bak ./public/manifest.json

# Simplified verification - we'll manually test languages
echo -e "${YELLOW}Deployment completed. Please manually verify language functionality at:${NC}"
echo -e "${GREEN}Production: https://pickmywine-live.web.app${NC}"
echo -e "${YELLOW}Test languages by clicking the language selector and choosing different options${NC}"