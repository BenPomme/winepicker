#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting WinePicker Deployment with Fixed Internationalization ===${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Clean previous build artifacts
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf .next out

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --legacy-peer-deps

# Fix translations first
echo -e "${MAGENTA}Verifying and fixing translation files...${NC}"
node scripts/fix-translations.js

# Verify resources
echo -e "${YELLOW}Verifying app resources...${NC}"
node scripts/check-resources.js

# Remove old fix scripts to avoid conflicts
echo -e "${YELLOW}Removing old fix scripts...${NC}"
if [ -f "public/fix-language.js" ]; then
  rm public/fix-language.js
  echo -e "${BLUE}Removed public/fix-language.js${NC}"
fi
if [ -f "public/fix-redirect.js" ]; then
  rm public/fix-redirect.js
  echo -e "${BLUE}Removed public/fix-redirect.js${NC}"
fi

# Build the Next.js app
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}ERROR: Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Ensure all language directories have valid index.html files
echo -e "${MAGENTA}Ensuring index.html files for all languages...${NC}"
node scripts/ensure-language-indexes.js

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for staging...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting with the configured settings
echo -e "${YELLOW}Deploying to Firebase staging...${NC}"
firebase deploy --only hosting:default --config firebase.staging.json

echo -e "${GREEN}=== Staging deployment completed successfully! ===${NC}"
echo -e "${YELLOW}Your app is now available at:${NC} https://winepicker-63daa.web.app"
echo -e "${YELLOW}Test all languages at:${NC}"
echo -e "  ${BLUE}English:${NC} https://winepicker-63daa.web.app/en/"
echo -e "  ${BLUE}French:${NC} https://winepicker-63daa.web.app/fr/"
echo -e "  ${BLUE}Chinese:${NC} https://winepicker-63daa.web.app/zh/"
echo -e "  ${BLUE}Arabic:${NC} https://winepicker-63daa.web.app/ar/"
echo -e "  ${BLUE}Russian:${NC} https://winepicker-63daa.web.app/ru/"