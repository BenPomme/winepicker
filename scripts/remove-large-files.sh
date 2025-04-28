#!/bin/bash
set -e

echo "🔪 Large File Removal Script 🔪"
echo "=============================="
echo "This script will remove specific large files from the Git history."
echo

# First, check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "Error: git-filter-repo is required but not installed."
    echo "Install it with: pip3 install git-filter-repo"
    exit 1
fi

# First, make sure we have a clean working tree
echo "Step 1: Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  You have uncommitted changes. Please commit or stash them before running this script."
  exit 1
fi

# Create a backup branch
echo "Step 2: Creating backup branch..."
CURRENT_BRANCH=$(git branch --show-current)
BACKUP_BRANCH="backup-$(date +%s)"
git branch $BACKUP_BRANCH

# Get repository size before cleanup
BEFORE_SIZE=$(du -sh .git | awk '{print $1}')
echo "Current repository size: $BEFORE_SIZE"

# Remove large files
echo "Step 3: Removing large files from Git history..."
PATHS_TO_REMOVE=(
  "*.pack.gz"
  ".next/cache/webpack/"
  "node_modules/"
  "*/node_modules/"
  "functions/node_modules/typescript/lib/typescript.js"
  "functions/node_modules/typescript/lib/_tsc.js"
  ".next/"
  "out/"
  ".firebase/"
)

# Join paths with a comma for git-filter-repo
PATHS_STRING=$(IFS=,; echo "${PATHS_TO_REMOVE[*]}")

# Run git-filter-repo to remove the files
git filter-repo --path-glob $PATHS_STRING --invert-paths --force

# Run garbage collection
echo "Step 4: Running aggressive garbage collection..."
git gc --aggressive --prune=now

# Check size after cleanup
AFTER_SIZE=$(du -sh .git | awk '{print $1}')

echo "Repository size reduced: $BEFORE_SIZE → $AFTER_SIZE"
echo "Original branch was saved as '$BACKUP_BRANCH'"
echo "If everything looks good, you can delete the backup with: git branch -D $BACKUP_BRANCH"
echo "Large file removal complete! 🎉"