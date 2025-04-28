#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process for WinePicker Next.js app to Firebase${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project...${NC}"
firebase use pick-my-wine-2c853

# Deploy to Firebase hosting
echo -e "${YELLOW}Deploying to Firebase hosting...${NC}"
firebase deploy --only hosting

echo -e "${GREEN}Firebase hosting deployment completed.${NC}"
echo -e "${YELLOW}Note: If you need to update Firebase Functions as well, you'll need to configure them separately.${NC}"