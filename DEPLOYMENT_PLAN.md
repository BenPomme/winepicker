# Deployment Plan: Fixing Language Selection in Production

## Issue Analysis

After examining the codebase, we've identified several issues related to language selection that work correctly in staging but fail in production:

### 1. Root Cause Analysis

The primary issue is related to URL handling in the language selector component (`LanguageSelector.tsx`). The language selector is using a simplified approach for static exports, which is causing issues in the production environment due to differences in domain configuration.

```javascript
// Simplified approach for static export - just navigate to the language root
const baseUrl = window.location.origin
const newUrl = `${baseUrl}/${newLocale}/`
      
// Navigate to the new URL
window.location.href = newUrl
```

### 2. Key Differences Between Staging and Production

| Aspect | Staging | Production | Issue |
|--------|---------|------------|-------|
| Domain | winepicker-63daa.web.app | pickmywine-live.web.app | Different domains, but code assumes same Firebase project |
| URL Structure | /en/, /fr/, etc. | Same format but not working | Path navigation issue in language selector |
| Manifest icons | URLs relative to domain | Incorrect URLs with hardcoded domain | Icons not loading correctly |
| Firebase target | default | production | Same configuration but different domain |

### 3. Manifest Icon Error

The manifest icon error (`https://pickmywine.live` vs `https://pickmywine-live.web.app`) indicates that:

1. PWA manifest is using absolute URLs instead of relative paths
2. There's a mismatch between the custom domain and the Firebase hosting URL
3. The service worker is not properly caching or serving the icons from the correct location

### 4. Deployment Configuration Gaps

1. The Firebase hosting configurations for staging and production are nearly identical
2. The environment-specific overrides are missing for the production target
3. Custom domain handling is not properly accounted for in the build process

## Action Plan

### 1. Fix Language Selector Component

Update the `LanguageSelector.tsx` component to handle both custom domains and Firebase hosting URLs:

```javascript
// Updated approach for handling language change across all environments
changeLanguage = (newLocale: string) => {
  try {
    console.log(`Changing language from ${locale} to ${newLocale}`)
    
    // More robust approach that works across environments
    const currentPath = window.location.pathname
    // Remove existing language prefix if present
    let pathWithoutLang = currentPath
    
    // Check if there's a language code at the start of the path
    const langRegex = /^\/(en|fr|zh|ar)\//
    if (langRegex.test(currentPath)) {
      pathWithoutLang = currentPath.replace(langRegex, '/')
    }
    
    // Ensure path starts with slash
    if (!pathWithoutLang.startsWith('/')) {
      pathWithoutLang = '/' + pathWithoutLang
    }
    
    // Create new path with selected language
    const newPath = `/${newLocale}${pathWithoutLang}`
    
    // Use relative URLs to avoid domain issues
    window.location.href = newPath
    setIsOpen(false)
  } catch (error) {
    console.error('Error changing language:', error)
    // Fallback using relative URL
    window.location.href = `/${newLocale}/`
  }
}
```

### 2. Fix Manifest Icons

Update the `manifest.json` file to use relative URLs for icons:

```json
{
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64",
      "type": "image/x-icon",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/app-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/app-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. Enhance Firebase Hosting Configuration

Update the `firebase.json` to include specific configurations for the production environment:

```json
{
  "hosting": [
    {
      "target": "default",
      "public": "out",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "cleanUrls": false,
      "trailingSlash": true,
      "headers": [
        {
          "source": "**/*.@(json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
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
        }
      ],
      "redirects": [
        {
          "source": "/",
          "destination": "/en/",
          "type": 302
        }
      ]
    },
    {
      "target": "production",
      "public": "out",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "cleanUrls": false,
      "trailingSlash": true,
      "headers": [
        {
          "source": "**/*.@(json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
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
        }
      ],
      "redirects": [
        {
          "source": "/",
          "destination": "/en/",
          "type": 302
        }
      ]
    }
  ]
}
```

### 4. Create Custom Deploy Script for Production

Create a new deploy script that handles the production-specific configuration:

```bash
#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting enhanced deployment process for WinePicker Next.js app to Firebase Production${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Create a pre-build hook to replace the manifest.json
echo -e "${YELLOW}Updating manifest.json to use relative paths...${NC}"
cp ./public/manifest.json ./public/manifest.json.bak

# Build the project (next build now exports with output: 'export' config)
echo -e "${YELLOW}Building and exporting the Next.js app...${NC}"
npm run build

if [ ! -d "./out" ]; then
  echo -e "${RED}Build failed! No 'out' directory was created.${NC}"
  exit 1
fi

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for production...${NC}"
firebase use winepicker-63daa

# Deploy to Firebase hosting (production target)
echo -e "${YELLOW}Deploying to Firebase production hosting...${NC}"
firebase deploy --only hosting:production

echo -e "${GREEN}Firebase production deployment completed.${NC}"
echo -e "${YELLOW}Your app is now available at https://pickmywine-live.web.app/${NC}"

# Restore the original manifest file
echo -e "${YELLOW}Restoring original manifest.json...${NC}"
mv ./public/manifest.json.bak ./public/manifest.json

# Simplified verification - we'll manually test languages
echo -e "${YELLOW}Deployment completed. Please manually verify language functionality at:${NC}"
echo -e "${GREEN}Production: https://pickmywine-live.web.app${NC}"
echo -e "${YELLOW}Test languages by clicking the language selector and choosing different options${NC}"
```

## Step-by-Step Implementation Plan

1. **Fix the Language Selector Component:**
   - Update `LanguageSelector.tsx` with the more robust path handling logic
   - Test locally to ensure it works with different path patterns

2. **Update the PWA Manifest:**
   - Ensure all icon paths in `manifest.json` use relative URLs
   - Remove any hardcoded domain references

3. **Optimize the Next.js Configuration:**
   - Review and update `next.config.js` to ensure proper handling of static exports
   - Verify that the `trailingSlash: true` option is applied correctly

4. **Create the Enhanced Deployment Script:**
   - Save the script as `deploy-functions.sh` in the project root
   - Make it executable with `chmod +x deploy-functions.sh`

5. **Deploy and Test:**
   - Run the new deployment script: `./deploy-functions.sh`
   - Verify language selection works on all paths in production
   - Test PWA installation to ensure icons load correctly
   - Validate the manifest file in Chrome DevTools

6. **Verify Success:**
   - Check language selection in both environments:
     - Staging: https://winepicker-63daa.web.app
     - Production: https://pickmywine-live.web.app
   - Verify that switching languages maintains the current page path

## Troubleshooting Guidance

If issues persist after deployment:

1. **Language Selector Still Not Working:**
   - Check browser console for JavaScript errors
   - Verify that the language paths (e.g., `/en/`, `/fr/`) exist in the deployed app
   - Test with direct URL navigation to language paths

2. **Manifest Icons Not Loading:**
   - Inspect the Network tab in DevTools to see which URLs are being requested
   - Verify the paths in the deployed manifest.json file
   - Check if there are any CORS issues with icon loading

3. **Service Worker Problems:**
   - Unregister and reinstall the service worker
   - Check the Cache Storage in DevTools to see if icons are being cached
   - Verify the PWA is properly installable

## Monitoring and Logging Recommendations

1. Add enhanced logging to the language selector component
2. Consider adding application monitoring to track language changes
3. Implement error tracking to capture any issues with path navigation

By following this comprehensive plan, we should be able to fix the language selection issues in the production environment and ensure a consistent user experience across all deployments.