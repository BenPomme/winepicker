#!/bin/bash

# Git Repository Cleanup Script
# This script uses Git's built-in features to clean up the repository

echo "🧹 Repository Cleanup with Git 🧹"
echo "================================="

# Create a backup of the repository
TIMESTAMP=$(date +%s)
BACKUP_PATH="${PWD}_backup_${TIMESTAMP}"
echo "Creating a backup of the repository at ${BACKUP_PATH}..."
cp -R "${PWD}" "${BACKUP_PATH}"
echo "Repository backed up. If anything goes wrong, you can restore from ${BACKUP_PATH}"

# Make sure we have the latest changes
echo "Fetching latest changes..."
git fetch --all

# Create a new orphan branch for the clean repository
echo "Creating a clean branch..."
git checkout --orphan temp_clean_branch

# Add all files from the current state (unstaged changes will be ignored)
echo "Adding current files to the clean branch..."
git add -A

# Commit the current state
echo "Committing the current state..."
git commit -m "Clean repository state"

# Remove the old branch and rename the temp branch
echo "Removing old main branch and renaming the clean branch..."
git branch -D main
git branch -m main

# Run garbage collection to clean up and reduce size
echo "Running garbage collection to reduce repository size..."
git gc --aggressive --prune=now

# Remove any untracked files
echo "Removing untracked files and directories..."
git clean -fd

# Calculate repository size before and after
BEFORE_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
AFTER_SIZE=$(du -sh "${PWD}" | cut -f1)

echo "✅ Repository cleanup completed!"
echo "Before size: ${BEFORE_SIZE}"
echo "After size: ${AFTER_SIZE}"
echo ""
echo "⚠️  IMPORTANT: This process has created a new branch history."
echo "To push these changes to the remote repository, you will need to force push:"
echo "git push --force origin main"
echo ""
echo "Your old repository is backed up at: ${BACKUP_PATH}"