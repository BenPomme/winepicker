#!/bin/bash

set -e

echo "🧹 Cleaning up repository structure..."
echo "===================================="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# We're already in the correct directory
# Create a clean directory structure
echo "📁 Creating clean directory..."
mkdir -p ../mywine_clean

# Copy all files
echo "📦 Copying files..."
cp -r * ../mywine_clean/
cp -r .github ../mywine_clean/ 2>/dev/null || true
cp -r .gitignore ../mywine_clean/ 2>/dev/null || true
cp -r .env* ../mywine_clean/ 2>/dev/null || true

echo "✨ Setup complete!"
echo "   Files have been copied to ../mywine_clean/"
echo "   You should now:"
echo "   1. cd ../mywine_clean"
echo "   2. git init"
echo "   3. git remote add origin https://github.com/BenPomme/mywine.git"
echo "   4. git add -A"
echo "   5. git commit -m \"Clean repository structure\""
echo "   6. git push --force origin main" 