#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOT_DIR="$HOME/Desktop/wine-app-screenshots"

# Make sure we're in the project directory
cd "$(dirname "$0")/.."

# Ensure puppeteer is installed
if ! npm list -g puppeteer >/dev/null 2>&1; then
  echo -e "${YELLOW}Installing puppeteer for automated screenshots...${NC}"
  npm install -g puppeteer
fi

# Create screenshots directory if it doesn't exist
mkdir -p "$SCREENSHOT_DIR"

# Parse arguments
ENV="staging"
URL=""
SELECTOR=""
NAME=""

print_usage() {
  echo "Usage: capture-screenshots.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --env <staging|production>  Environment to capture (default: staging)"
  echo "  --url <url>                 Specific URL to capture"
  echo "  --selector <css-selector>   Specific element to capture"
  echo "  --name <filename>           Name for the screenshot file"
  echo "  --compare                   Compare staging and production environments"
  echo "  --verify                    Verify deployment"
  echo "  --help                      Show this help message"
  echo ""
  echo "Examples:"
  echo "  capture-screenshots.sh --env production                    # Capture all UI components from production"
  echo "  capture-screenshots.sh --url https://example.com --name homepage  # Capture a specific URL"
  echo "  capture-screenshots.sh --selector 'header' --name header   # Capture a specific element"
  echo "  capture-screenshots.sh --compare                           # Compare staging and production"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV="$2"
      shift 2
      ;;
    --url)
      URL="$2"
      shift 2
      ;;
    --selector)
      SELECTOR="$2"
      shift 2
      ;;
    --name)
      NAME="$2"
      shift 2
      ;;
    --compare)
      # Run comparison script
      echo -e "${YELLOW}Comparing staging and production environments...${NC}"
      node "$SCRIPT_DIR/compare-environments.js"
      echo -e "${GREEN}Comparison complete. Check $SCREENSHOT_DIR for results.${NC}"
      exit 0
      ;;
    --verify)
      # Run verification script
      echo -e "${YELLOW}Verifying deployment...${NC}"
      node "$SCRIPT_DIR/verify-deployment.js"
      echo -e "${GREEN}Verification complete. Check $SCREENSHOT_DIR for results.${NC}"
      exit 0
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
done

# If specific URL and selector are provided, capture that element
if [ -n "$URL" ] && [ -n "$SELECTOR" ] && [ -n "$NAME" ]; then
  echo -e "${YELLOW}Capturing element '$SELECTOR' from $URL...${NC}"
  node -e "require('./scripts/screenshot-ui').captureElement('$URL', '$SELECTOR', '$NAME')"
  echo -e "${GREEN}Screenshot saved to $SCREENSHOT_DIR/${NAME}-*.png${NC}"
  exit 0
fi

# Otherwise, capture all UI components from the specified environment
echo -e "${YELLOW}Capturing all UI components from $ENV environment...${NC}"
node "$SCRIPT_DIR/screenshot-ui.js" "$ENV"
echo -e "${GREEN}Screenshots saved to $SCREENSHOT_DIR${NC}"