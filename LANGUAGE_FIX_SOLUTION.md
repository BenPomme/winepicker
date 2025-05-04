# Language Selection Issue: Root Cause & Solution

## Root Cause Analysis

After thorough investigation, I've identified why language selection works in production but not in staging, despite supposedly duplicating everything:

### 1. Different Language Handling Approaches

**Production Environment:**
- Uses Next.js's built-in i18n functionality
- Does NOT use external fix-language.js or fix-redirect.js scripts
- Has language-specific redirects configured in firebase.production.json

**Staging Environment:**
- Relies on injected scripts (fix-language.js and fix-redirect.js)
- Has a different Firebase configuration with a catch-all rewrite
- Different cleanUrls and trailingSlash settings

### 2. Russian Locale Missing from Static Export

The `next.config.js` file was missing Russian from its locale list:
```javascript
// Before:
const locales = ['en', 'fr', 'zh', 'ar'];

// After:
const locales = ['en', 'fr', 'zh', 'ar', 'ru'];
```

This meant that Russian pages weren't actually being generated during the static export process.

### 3. Configuration Mismatches

Several critical configuration differences between production and staging:
- `cleanUrls` and `trailingSlash` settings were different
- Staging had a catch-all rewrite (`"source": "**", "destination": "/index.html"`)
- Production had language-specific redirects that staging was missing

## Solution Implemented

Rather than continuing with two different approaches to language handling, I'm aligning staging with production by:

1. **Fixed Next.js Configuration:**
   - Added 'ru' to the locale list in exportPathMap
   - This ensures Russian pages are properly generated during build

2. **Aligned Firebase Configurations:**
   - Updated firebase.staging.json to match production settings:
     - Set cleanUrls: false and trailingSlash: false
     - Removed the catch-all rewrite
     - Added language-specific redirects including for Russian

3. **Created Aligned Deployment Script:**
   - Created deploy-staging-aligned.sh that:
     - Builds the Next.js app with proper i18n support
     - Skips script injection (no longer needed)
     - Uses the updated firebase.staging.json configuration
     - Verifies Russian pages are included in the build

4. **No More External Scripts:**
   - No longer injecting fix-language.js and fix-redirect.js
   - Using Next.js's built-in i18n handling instead

## How to Deploy

Run the new aligned deployment script:
```bash
./deploy-staging-aligned.sh
```

This will:
1. Build the Next.js app with Russian locale support
2. Deploy to Firebase staging with the correct configuration
3. Verify that Russian pages are included in the build

## Verification

After deployment, verify language selection works by:
1. Visit https://winepicker-63daa.web.app/ru/
2. The UI should display in Russian
3. The language selector should correctly show Russian
4. Try switching between languages to confirm it's working properly

This solution ensures consistent behavior between production and staging by aligning on the same approach, rather than trying to maintain two different language handling mechanisms.