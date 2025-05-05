#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process for mywine Next.js app${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${YELLOW}Building the Next.js app...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Create .nojekyll file to prevent Jekyll processing
echo -e "${YELLOW}Creating .nojekyll file...${NC}"
touch ./out/.nojekyll

# Display success message
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}The app is ready to be deployed to GitHub Pages.${NC}"
echo -e "${YELLOW}Commit and push your changes to GitHub, and the GitHub Actions workflow will deploy your app.${NC}"
echo -e "${YELLOW}Your app will be available at: https://benpomme.github.io/mywine/${NC}"

# Make this script executable
chmod +x deploy.sh 