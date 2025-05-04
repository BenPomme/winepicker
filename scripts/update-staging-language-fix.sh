#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Updating Language Fixes on Staging ===${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")/.."

# Clean the public/locales/ru directory to ensure we're updating with fresh files
mkdir -p public/locales/ru

# Fixing the redirect and language scripts
echo -e "${YELLOW}Updating fix-redirect.js and fix-language.js...${NC}"

# Deploy the changes to Firebase
echo -e "${YELLOW}Deploying language fixes to Firebase staging...${NC}"
firebase use winepicker-63daa
firebase deploy --only hosting:default --config firebase.staging.json

echo -e "${GREEN}=== Language fixes have been updated! ===${NC}"
echo -e "${YELLOW}Your app is now available at:${NC} https://winepicker-63daa.web.app"
echo -e "${YELLOW}Try accessing:${NC} https://winepicker-63daa.web.app/ru/ to test Russian language support"