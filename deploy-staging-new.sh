#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting WinePicker Staging Deployment ===${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Clean previous build artifacts
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf .next out

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --legacy-peer-deps

# Verify resources
echo -e "${YELLOW}Verifying app resources...${NC}"
node scripts/check-resources.js

# Build the Next.js app
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}ERROR: Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Prepare locale directories
echo -e "${YELLOW}Preparing locale directories...${NC}"
for locale in en fr zh ar ru; do
  # Ensure locale directories exist
  mkdir -p "out/$locale"
  
  # Ensure index files exist for each locale
  if [ ! -f "out/$locale/index.html" ]; then
    echo -e "${YELLOW}Creating $locale/index.html...${NC}"
    cp out/index.html "out/$locale/index.html"
  fi
  
  # Create my-list directory and copy files
  mkdir -p "out/$locale/my-list"
  if [ -f "out/my-list/index.html" ]; then
    echo -e "${YELLOW}Creating $locale/my-list/index.html...${NC}"
    cp out/my-list/index.html "out/$locale/my-list/index.html"
  elif [ -f "out/my-list.html" ]; then
    echo -e "${YELLOW}Creating $locale/my-list/index.html from my-list.html...${NC}"
    cp out/my-list.html "out/$locale/my-list/index.html"
  fi
done

# Create a more robust fix-redirect.js script
echo -e "${YELLOW}Creating redirect fix script...${NC}"
cat > public/fix-redirect.js << 'EOF'
/**
 * Robust fix for Firebase hosting redirect issues with i18n
 */
(function() {
  // Get the current path and URL
  const path = window.location.pathname;
  
  // Don't redirect static resources
  if (path.match(/\.(js|css|json|png|jpg|ico|svg|webp)$/) || 
      path.includes('/_next/') || 
      path.includes('/static/') ||
      path === '/sw.js' ||
      path === '/manifest.json') {
    return;
  }
  
  // Only run redirect logic once per page load
  if (sessionStorage.getItem('redirected')) {
    sessionStorage.removeItem('redirected');
    return;
  }
  
  // Check if we're at root
  if (path === '/' || path === '') {
    sessionStorage.setItem('redirected', 'true');
    window.location.replace('/en/');
    return;
  }
  
  // Check if path already has locale
  const localeMatch = path.match(/^\/(en|fr|zh|ar|ru)(\/|$)/);
  
  // If no locale in path, add one based on browser language
  if (!localeMatch) {
    const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
    let locale = 'en';
    
    if (browserLang.startsWith('fr')) locale = 'fr';
    else if (browserLang.startsWith('zh')) locale = 'zh';
    else if (browserLang.startsWith('ar')) locale = 'ar';
    else if (browserLang.startsWith('ru')) locale = 'ru';
    
    // Construct the new URL with locale
    let newPath = `/${locale}${path}`;
    if (!path.endsWith('/') && !path.includes('.')) {
      newPath += '/';
    }
    
    console.log('Redirecting to localized path:', newPath);
    sessionStorage.setItem('redirected', 'true');
    window.location.replace(newPath);
  }
})();
EOF

# Inject the redirect and language scripts into all HTML files
echo -e "${YELLOW}Injecting redirect and language scripts into HTML files...${NC}"
find out -name "*.html" -exec sed -i '' 's/<\/head>/<script src="\/fix-redirect.js"><\/script><script src="\/fix-language.js"><\/script><\/head>/g' {} \;

# Update Firebase configuration
echo -e "${YELLOW}Creating Firebase hosting configuration...${NC}"
cat > firebase.staging.json << 'EOF'
{
  "hosting": {
    "target": "default",
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "cleanUrls": true,
    "trailingSlash": true,
    "rewrites": [
      {
        "source": "/api/analyze-wine",
        "function": "nextApiHandler"
      },
      {
        "source": "/api/analyze-wine-openai",
        "function": "nextApiHandler"
      },
      {
        "source": "/api/get-analysis-result",
        "function": "nextApiHandler"
      },
      {
        "source": "/api/**",
        "function": "nextApiHandler"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/",
        "destination": "/en/",
        "type": 302
      }
    ],
    "headers": [
      {
        "source": "**/*.@(css|jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/fix-*.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      },
      {
        "source": "**/_next/static/**/*.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(html|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ]
  }
}
EOF

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for staging...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting with the dedicated config
echo -e "${YELLOW}Deploying to Firebase staging...${NC}"
firebase deploy --only hosting:default --config firebase.staging.json

echo -e "${GREEN}=== Staging deployment completed successfully! ===${NC}"
echo -e "${YELLOW}Your app is now available at:${NC} https://winepicker-63daa.web.app"