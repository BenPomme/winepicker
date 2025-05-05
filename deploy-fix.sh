#!/bin/bash

set -e

echo "🚀 Starting Wine Picker App deployment"
echo "====================================="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf .next out

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build Next.js app (includes export with output: 'export' in next.config.js)
echo "🔨 Building app..."
npm run build

# Create .nojekyll file to prevent Jekyll processing
echo "🚧 Creating .nojekyll file..."
touch out/.nojekyll

# If deploying manually (not through GitHub Actions)
if [ "$1" == "--deploy" ]; then
    echo "🌎 Deploying to GitHub Pages..."
    
    # Install gh-pages if not available
    if ! command -v npx gh-pages &> /dev/null; then
        npm install -g gh-pages
    fi
    
    # Deploy using gh-pages
    npx gh-pages -d out -t true
    
    echo "✅ Deployment complete!"
    echo "   Your site should be available at: https://benpomme.github.io/mywine/"
else
    echo "✅ Build complete!"
    echo "   To deploy manually, run: ./deploy-fix.sh --deploy"
    echo "   Or push to main for automatic deployment via GitHub Actions."
fi 