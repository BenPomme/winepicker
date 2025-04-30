#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default to staging if no target is provided
TARGET=${1:-staging}

echo -e "${YELLOW}Starting deployment process for WinePicker Next.js app to Firebase $TARGET${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Display usage information if help is requested
if [ "$TARGET" == "help" ]; then
    echo -e "${GREEN}Usage: ./deploy-consolidated.sh [TARGET]${NC}"
    echo -e "Available targets:"
    echo -e "  staging        Deploy to staging environment (default)"
    echo -e "  production     Deploy to production environment"
    echo -e "  functions      Deploy only Firebase functions"
    echo -e "  clone          Clone staging to production without rebuilding"
    echo -e "  help           Display this help message"
    exit 0
fi

# Set the Firebase target based on the deployment target
if [ "$TARGET" == "staging" ]; then
    FIREBASE_TARGET="default"
    SITE_URL="https://winepicker-63daa.web.app"
elif [ "$TARGET" == "production" ]; then
    FIREBASE_TARGET="production"
    SITE_URL="https://pickmywine-live.web.app"
elif [ "$TARGET" == "clone" ]; then
    echo -e "${YELLOW}Cloning staging site to production WITHOUT rebuilding...${NC}"
    
    # Confirm with user
    read -p "Are you sure you want to clone staging to production? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment canceled.${NC}"
        exit 1
    fi
    
    # Clone staging to production
    firebase use winepicker-63daa
    firebase hosting:clone winepicker-63daa:live pickmywine-live:live
    
    echo -e "${GREEN}Clone completed successfully.${NC}"
    echo -e "${YELLOW}Staging has been copied to production.${NC}"
    echo -e "${YELLOW}Please verify both environments:${NC}"
    echo -e "${GREEN}Staging: https://winepicker-63daa.web.app${NC}"
    echo -e "${GREEN}Production: https://pickmywine-live.web.app${NC}"
    exit 0
elif [ "$TARGET" == "functions" ]; then
    echo -e "${YELLOW}Deploying only Firebase Functions...${NC}"
    
    # Install dependencies for functions
    echo -e "${YELLOW}Installing Functions dependencies...${NC}"
    cd functions
    npm install
    npm run build
    
    # Deploy only functions
    echo -e "${YELLOW}Deploying Functions...${NC}"
    firebase use winepicker-63daa
    firebase deploy --only functions
    
    echo -e "${GREEN}Firebase Functions deployment completed.${NC}"
    exit 0
else
    echo -e "${RED}Invalid target: $TARGET${NC}"
    echo -e "${YELLOW}Use 'staging', 'production', 'functions', 'clone', or 'help'${NC}"
    exit 1
fi

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
echo -e "${YELLOW}Setting up Firebase project...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting
echo -e "${YELLOW}Deploying to Firebase hosting ($TARGET)...${NC}"
firebase deploy --only hosting:$FIREBASE_TARGET

echo -e "${GREEN}Firebase $TARGET deployment completed.${NC}"
echo -e "${YELLOW}Your app is now available at $SITE_URL${NC}"

# Verify deployment for staging and production
if [ "$TARGET" == "staging" ] || [ "$TARGET" == "production" ]; then
    echo -e "${YELLOW}Verifying deployment...${NC}"
    echo -e "${YELLOW}Please manually verify the site at $SITE_URL${NC}"
    echo -e "${YELLOW}Test all supported languages (EN, FR, ZH, AR)${NC}"
fi

echo -e "${GREEN}Deployment process completed.${NC}"