#!/bin/bash

set -e

echo "🧹 Cleaning up repository structure..."
echo "===================================="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create temporary directory
echo "📁 Creating temporary directory..."
mkdir -p temp_migration

# Move all files from wine-picker-next to temp directory
echo "📦 Moving files..."
cp -r wine-picker-next/* temp_migration/
cp -r wine-picker-next/.* temp_migration/ 2>/dev/null || true

# Remove .git from temp if it exists
rm -rf temp_migration/.git 2>/dev/null || true

# Move files from temp to root, overwriting if needed
echo "📦 Moving files to repository root..."
cp -r temp_migration/* .
cp -r temp_migration/.* . 2>/dev/null || true

# Cleanup
echo "🗑️ Cleaning up temporary files..."
rm -rf temp_migration
rm -rf wine-picker-next

echo "✨ Setup complete!"
echo "   You can now commit the changes with:"
echo "   git add -A && git commit -m \"Reorganize repository structure\"" 