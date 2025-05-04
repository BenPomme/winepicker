#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of CURRENT STAGING BUILD to production${NC}"
echo -e "${YELLOW}This will deploy the existing out/ directory to production without rebuilding${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Check that out directory exists and is not empty
if [ ! -d "./out" ] || [ -z "$(ls -A ./out)" ]; then
  echo -e "${RED}Error: out directory is missing or empty. Cannot deploy.${NC}"
  exit 1
fi

# Confirm with user
echo -e "${YELLOW}This will deploy the current staging build (2c23f0) to production WITHOUT rebuilding.${NC}"
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Deployment canceled.${NC}"
  exit 1
fi

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project...${NC}"
firebase use winepicker-63daa

# Verify current target
CURRENT_TARGET=$(firebase target:list | grep hosting | grep default || echo "Not found")
echo -e "${YELLOW}Current hosting target: ${CURRENT_TARGET}${NC}"

# Deploy ONLY to production target
echo -e "${YELLOW}Deploying current out/ directory to Firebase production hosting...${NC}"
firebase deploy --only hosting:production

echo -e "${GREEN}Firebase production deployment completed.${NC}"
echo -e "${YELLOW}Your app is now available at https://pickmywine-live.web.app/${NC}"

# Prompt for verification
echo -e "${YELLOW}Please manually verify both environments now:${NC}"
echo -e "${GREEN}Production: https://pickmywine-live.web.app${NC}"
echo -e "${GREEN}Staging: https://winepicker-63daa.web.app${NC}"

echo -e "${YELLOW}Test all languages by using the language selector.${NC}"
echo -e "${YELLOW}Verify that both staging and production function correctly.${NC}"