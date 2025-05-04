/**
 * Fix for i18n redirects in static export
 */
const fs = require('fs');
const path = require('path');

// Paths to update
const outDir = path.join(__dirname, '../out');
const locales = ['en', 'fr', 'zh', 'ar'];

function fixIndexFiles() {
  console.log('Fixing i18n redirects for static export...');
  
  // First, ensure the root index.html exists and contains a proper redirect
  const rootIndexPath = path.join(outDir, 'index.html');
  
  if (fs.existsSync(rootIndexPath)) {
    console.log('Updating root index.html...');
    
    // Create a redirect to the default locale (en)
    const rootRedirectContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=/en/">
    <script>
      // Get user's browser language
      const userLang = navigator.language || navigator.userLanguage;
      const shortLang = userLang.split('-')[0];
      
      // Check if we support this language
      const supportedLocales = ['en', 'fr', 'zh', 'ar'];
      const targetLocale = supportedLocales.includes(shortLang) ? shortLang : 'en';
      
      // Redirect to the appropriate language version
      window.location.replace('/' + targetLocale + '/');
    </script>
  </head>
  <body>
    <p>Redirecting to your preferred language...</p>
  </body>
</html>`;

    fs.writeFileSync(rootIndexPath, rootRedirectContent);
    console.log('✅ Root index.html updated with language detection');
  } else {
    console.log('⚠️ Root index.html not found. Creating it...');
    fs.writeFileSync(rootIndexPath, `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=/en/">
  </head>
  <body>
    <p>Redirecting to English version...</p>
  </body>
</html>`);
  }
  
  // Now ensure each locale folder has its index.html file
  locales.forEach(locale => {
    const localeDir = path.join(outDir, locale);
    const localeIndexPath = path.join(localeDir, 'index.html');
    
    if (!fs.existsSync(localeDir)) {
      console.log(`⚠️ Locale directory ${locale} not found. Creating it...`);
      fs.mkdirSync(localeDir, { recursive: true });
    }
    
    if (!fs.existsSync(localeIndexPath)) {
      console.log(`⚠️ Index file for locale ${locale} not found. Creating it...`);
      
      // Copy the index page from the en folder if it exists
      const sourceIndexPath = path.join(outDir, 'en', 'index.html');
      if (fs.existsSync(sourceIndexPath)) {
        fs.copyFileSync(sourceIndexPath, localeIndexPath);
        console.log(`✅ Created ${locale}/index.html from English template`);
      } else {
        // Create a basic index page
        fs.writeFileSync(localeIndexPath, `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <title>PickMyWine</title>
  </head>
  <body>
    <h1>PickMyWine - ${locale.toUpperCase()}</h1>
    <p>Welcome to PickMyWine</p>
  </body>
</html>`);
        console.log(`✅ Created basic ${locale}/index.html`);
      }
    }
  });
  
  console.log('✅ All index files fixed for i18n static export');
}

// Update the service worker to handle i18n routes properly
function updateServiceWorker() {
  const swPath = path.join(outDir, 'sw.js');
  
  if (fs.existsSync(swPath)) {
    console.log('Updating service worker for i18n support...');
    
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Add custom handling for locale navigation
    if (!swContent.includes('handleI18nNavigation')) {
      // Find where to insert our custom code
      const insertPoint = swContent.lastIndexOf('});');
      
      if (insertPoint !== -1) {
        const customCode = `
// Add custom handler for i18n navigation
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle navigation requests to our origin
  if (event.request.mode === 'navigate' && url.origin === self.location.origin) {
    const path = url.pathname;
    
    // Check if this is a request to a locale path
    const localeMatch = path.match(/^\\/([a-z]{2})\\/?$/);
    if (localeMatch) {
      const locale = localeMatch[1];
      
      // If this is a valid locale, make sure we serve the index.html
      if (['en', 'fr', 'zh', 'ar'].includes(locale)) {
        event.respondWith(
          caches.match(\`/\${locale}/index.html\`)
            .then(response => {
              return response || fetch(event.request);
            })
        );
        return;
      }
    }
  }
});`;
        
        // Insert our custom code before the last closing bracket
        swContent = swContent.slice(0, insertPoint) + customCode + swContent.slice(insertPoint);
        
        fs.writeFileSync(swPath, swContent);
        console.log('✅ Service worker updated with i18n support');
      } else {
        console.log('⚠️ Could not find insertion point in service worker');
      }
    } else {
      console.log('✅ Service worker already contains i18n handling');
    }
  } else {
    console.log('⚠️ Service worker not found');
  }
}

// Execute the fixes
fixIndexFiles();
updateServiceWorker();

console.log('All i18n fixes applied. Ready to deploy.');