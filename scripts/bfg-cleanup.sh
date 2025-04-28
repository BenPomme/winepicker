#!/bin/bash
set -e

echo "🧹 Repository Cleanup with BFG 🧹"
echo "================================="
echo "This script will clean up the Git repository using BFG Repo-Cleaner."
echo

# Check if Java is installed
if ! command -v java &> /dev/null; then
  echo "Java is required to run BFG Repo-Cleaner but was not found."
  echo "Please install Java and try again."
  exit 1
fi

# Download BFG if not already present
if [ ! -f bfg.jar ]; then
  echo "Downloading BFG Repo-Cleaner..."
  curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
fi

# Create a backup of the repository
REPO_DIR=$(pwd)
CURRENT_BRANCH=$(git branch --show-current)
BACKUP_DIR="${REPO_DIR}_backup_$(date +%s)"

echo "Creating a backup of the repository at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
git clone --mirror "$REPO_DIR/.git" "$BACKUP_DIR/.git"

echo "Repository backed up. If anything goes wrong, you can restore from $BACKUP_DIR"

# Create a file with patterns to remove
echo "Creating file with patterns to remove..."
cat > remove-patterns.txt << EOF
# Large JavaScript files
.*/typescript.js
.*/tsc.js
# Build outputs
.next/
out/
# Node modules
node_modules/
# Webpack cache
.*\.pack.gz
EOF

# Run BFG to remove files matching patterns
echo "Running BFG to remove files specified in patterns file..."
java -jar bfg.jar --delete-folders "{node_modules,.next,out,.firebase}" --delete-files "*.pack.gz" "$REPO_DIR/.git"

# Clean up references and run garbage collection
echo "Cleaning up references and running garbage collection..."
cd "$REPO_DIR"
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Create the cleaned branch
echo "Creating clean branch..."
git checkout -b cleaned-main

# Check repository size reduction
BEFORE_SIZE=$(du -sh "$BACKUP_DIR/.git" | awk '{print $1}')
AFTER_SIZE=$(du -sh "$REPO_DIR/.git" | awk '{print $1}')

echo "Repository size reduced from $BEFORE_SIZE to $AFTER_SIZE"
echo "Cleanup complete! You are now on branch 'cleaned-main'"
echo "If everything looks good, you can run:"
echo "  git branch -D $CURRENT_BRANCH"
echo "  git branch -m cleaned-main main"
echo "  git push -f origin main  # Warning: This will rewrite remote history"