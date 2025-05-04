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

echo -e "${YELLOW}=== Deploying Final Language Fix ===${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")/.."

# Run the locale fix script to update HTML files
echo -e "${YELLOW}Running static locale fix script...${NC}"
node scripts/fix-static-locale.js

# Deploy to Firebase hosting with the fixed HTML files
echo -e "${YELLOW}Deploying to Firebase staging...${NC}"
firebase use winepicker-63daa
firebase deploy --only hosting:default --config firebase.staging.json

echo -e "${GREEN}=== Final language fix deployed successfully! ===${NC}"
echo -e "${YELLOW}Your app is now available at:${NC} https://winepicker-63daa.web.app"
echo -e "${YELLOW}Test all languages at:${NC}"
echo -e "  ${BLUE}English:${NC} https://winepicker-63daa.web.app/en"
echo -e "  ${BLUE}French:${NC} https://winepicker-63daa.web.app/fr"
echo -e "  ${BLUE}Chinese:${NC} https://winepicker-63daa.web.app/zh"
echo -e "  ${BLUE}Arabic:${NC} https://winepicker-63daa.web.app/ar"
echo -e "  ${BLUE}Russian:${NC} https://winepicker-63daa.web.app/ru"