#!/bin/bash

# Log rotation script for MyWine application

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting log rotation process...${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")/.."

# Create archive directory if it doesn't exist
mkdir -p logs/archive

# Move logs older than 7 days to archive
echo -e "${YELLOW}Archiving logs older than 7 days...${NC}"
find logs -maxdepth 1 -name "*.log" -type f -mtime +7 -exec mv {} logs/archive/ \; -print

# Delete logs older than 30 days
echo -e "${YELLOW}Cleaning up logs older than 30 days...${NC}"
find logs/archive -name "*.log" -type f -mtime +30 -delete -print

# Summary
CURRENT_COUNT=$(find logs -maxdepth 1 -name "*.log" -type f | wc -l)
ARCHIVE_COUNT=$(find logs/archive -name "*.log" -type f | wc -l)

echo -e "${GREEN}Log rotation completed.${NC}"
echo -e "${YELLOW}Current logs: $CURRENT_COUNT${NC}"
echo -e "${YELLOW}Archived logs: $ARCHIVE_COUNT${NC}"