#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting WinePicker Staging Deployment (Production-Aligned) ===${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Clean previous build artifacts
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf .next out

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --legacy-peer-deps

# Verify resources
echo -e "${YELLOW}Verifying app resources...${NC}"
node scripts/check-resources.js

# Build the Next.js app
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}ERROR: Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Check that Russian pages were generated
if [ ! -d "./out/ru" ]; then
  echo -e "${RED}ERROR: Russian pages are missing from the build!${NC}"
  exit 1
fi

# DO NOT inject fix scripts as they're not used in production
echo -e "${YELLOW}Skipping script injection to align with production...${NC}"

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for staging...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting with the dedicated config
echo -e "${YELLOW}Deploying to Firebase staging...${NC}"
firebase deploy --only hosting:default --config firebase.staging.json

echo -e "${GREEN}=== Staging deployment completed successfully! ===${NC}"
echo -e "${YELLOW}Your app is now available at:${NC} https://winepicker-63daa.web.app"
echo -e "${YELLOW}Test language selection at:${NC} https://winepicker-63daa.web.app/ru/"