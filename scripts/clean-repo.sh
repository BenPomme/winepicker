#!/bin/bash
set -e

echo "🧹 Repository Cleanup Script 🧹"
echo "==============================="
echo "This script will clean up the Git repository and reduce its size."
echo

# First, make sure we have a clean working tree
echo "Step 1: Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  You have uncommitted changes. Please commit or stash them before running this script."
  exit 1
fi

# Create .gitignore if it doesn't exist
echo "Step 2: Creating/updating .gitignore file..."
if [[ ! -f .gitignore ]]; then
  touch .gitignore
fi

# Ensure these patterns are in .gitignore
echo "Step 3: Adding patterns to .gitignore..."
PATTERNS=(
  "# Dependencies"
  "node_modules/"
  "*/node_modules/"
  ".pnp"
  ".pnp.js"
  "# Production"
  "build/"
  ".next/"
  "out/"
  "# Testing"
  "coverage/"
  "# Debug"
  "npm-debug.log*"
  "yarn-debug.log*"
  "yarn-error.log*"
  ".pnpm-debug.log*"
  "# Environment files"
  ".env*.local"
  ".env"
  ".env.local"
  ".env.development.local"
  ".env.test.local"
  ".env.production.local"
  "# Editors"
  ".idea/"
  ".vscode/"
  "*.swp"
  "# OS"
  ".DS_Store"
  "Thumbs.db"
  "# Firebase"
  "firebase-debug.log"
  "ui-debug.log"
  ".firebase/"
  "# Next.js"
  ".next/"
  "out/"
  "# Vercel"
  ".vercel"
  "# PWA"
  "public/sw.js"
  "public/workbox-*.js"
  "# Large files"
  "*.pack.gz"
)

for pattern in "${PATTERNS[@]}"; do
  if ! grep -q "$pattern" .gitignore; then
    echo "$pattern" >> .gitignore
  fi
done

# Remove files from Git index that should be ignored
echo "Step 4: Creating temporary branch for cleanup..."
CURRENT_BRANCH=$(git branch --show-current)
TEMP_BRANCH="cleanup-$(date +%s)"
git checkout -b $TEMP_BRANCH

echo "Step 5: Removing problematic files from Git history..."
git filter-branch --force --index-filter '
  # Remove node_modules
  git rm -r --cached --ignore-unmatch "node_modules" "*/node_modules"
  # Remove Next.js cache
  git rm -r --cached --ignore-unmatch ".next" 
  # Remove Firebase-related files
  git rm -r --cached --ignore-unmatch ".firebase"
  # Remove build outputs
  git rm -r --cached --ignore-unmatch "out" "build"
  # Remove env files
  git rm -r --cached --ignore-unmatch .env*
  # Other large files
  git rm -r --cached --ignore-unmatch "**/*.pack.gz"
' --prune-empty --tag-name-filter cat -- --all

echo "Step 6: Running aggressive garbage collection..."
git gc --aggressive --prune=now

# Check size after cleanup
BEFORE_SIZE=$(du -sh .git | awk '{print $1}')

echo "Step 7: Removing old reflog entries and unreachable objects..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

AFTER_SIZE=$(du -sh .git | awk '{print $1}')

echo "Repository size: $BEFORE_SIZE → $AFTER_SIZE"

# Return to original branch
echo "Step 8: Creating clean branch from current state..."
git checkout -b clean-main
echo "Your cleaned repository is now on branch 'clean-main'"
echo "If everything looks good, you may want to run:"
echo "  git branch -D $CURRENT_BRANCH"
echo "  git branch -m clean-main main"

echo "Repository cleanup complete! 🎉"