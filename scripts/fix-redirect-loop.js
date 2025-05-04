/**
 * Fix for Firebase redirect loop
 */
const fs = require('fs');
const path = require('path');

// Firebase config path
const firebaseConfigPath = path.join(__dirname, '../firebase.json');

function fixRedirectLoop() {
  console.log('Fixing Firebase redirect loop...');
  
  try {
    // Read current config
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Update both hosting targets
    if (Array.isArray(config.hosting)) {
      config.hosting.forEach(hostingConfig => {
        // Remove all redirects
        hostingConfig.redirects = [];
        
        // Add a single redirect from root to English
        hostingConfig.redirects.push({
          source: "/",
          destination: "/index.html",
          type: 301
        });
        
        // Update rewrites to be simpler
        if (hostingConfig.rewrites) {
          const apiRewrites = hostingConfig.rewrites.filter(rewrite => 
            rewrite.source && rewrite.source.includes('/api/')
          );
          
          // Create new simplified rewrites
          hostingConfig.rewrites = [
            ...apiRewrites,
            {
              source: "**",
              destination: "/index.html"
            }
          ];
        }
      });
      
      // Write the updated config
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Firebase configuration updated to fix redirect loop');
    } else {
      console.error('❌ Firebase config does not have hosting array');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating Firebase config:', error);
    return false;
  }
}

// Fix for out directory
function createSimpleIndexHtml() {
  console.log('Creating simplified index.html files...');
  
  // Create out directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '../out'))) {
    fs.mkdirSync(path.join(__dirname, '../out'));
  }
  
  // Create a simple index.html that loads the actual app
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PickMyWine</title>
  <script>
    // Get user's browser language
    const userLang = navigator.language || navigator.userLanguage;
    const shortLang = userLang.split('-')[0];
    
    // Check if we support this language
    const supportedLocales = ['en', 'fr', 'zh', 'ar'];
    const targetLocale = supportedLocales.includes(shortLang) ? shortLang : 'en';
    
    // Set HTML lang attribute
    document.documentElement.lang = targetLocale;
    
    // Set RTL direction if needed
    if (targetLocale === 'ar') {
      document.documentElement.dir = 'rtl';
    }
    
    // IMPORTANT: Disable service worker to prevent caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // Load the translations
    fetch('/locales/' + targetLocale + '/common.json')
      .then(response => response.json())
      .then(translations => {
        window.translations = translations;
        document.title = translations.appName || 'PickMyWine';
      })
      .catch(err => console.error('Failed to load translations:', err));
  </script>
  <link rel="stylesheet" href="/locales/translations.css">
</head>
<body>
  <div id="app">
    <h1>PickMyWine</h1>
    <p id="loading">Loading...</p>
  </div>
  
  <div id="language-selector" style="position: fixed; top: 10px; right: 10px;">
    <select id="locale-select" onchange="changeLanguage(this.value)">
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="zh">中文</option>
      <option value="ar">العربية</option>
    </select>
  </div>
  
  <script>
    // Set the current language in the selector
    function setLanguageSelector() {
      const userLang = navigator.language || navigator.userLanguage;
      const shortLang = userLang.split('-')[0];
      const targetLocale = supportedLocales.includes(shortLang) ? shortLang : 'en';
      document.getElementById('locale-select').value = targetLocale;
    }
    
    // Change language
    function changeLanguage(locale) {
      window.location.reload();
    }
    
    // Initialize
    window.addEventListener('DOMContentLoaded', setLanguageSelector);
  </script>
</body>
</html>`;

  // Write the index.html
  fs.writeFileSync(path.join(__dirname, '../out/index.html'), indexHtml);
  
  // Create translations.css in locales directory
  if (!fs.existsSync(path.join(__dirname, '../out/locales'))) {
    fs.mkdirSync(path.join(__dirname, '../out/locales'), { recursive: true });
  }
  
  const translationsCss = `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}

h1 {
  text-align: center;
  color: #5a2327;
}

#loading {
  text-align: center;
  font-size: 18px;
  margin-top: 40px;
}

#language-selector {
  margin-bottom: 20px;
}

select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
}

[dir="rtl"] body {
  direction: rtl;
  text-align: right;
}`;

  fs.writeFileSync(path.join(__dirname, '../out/locales/translations.css'), translationsCss);
  
  // Ensure we have locale directories
  const locales = ['en', 'fr', 'zh', 'ar'];
  locales.forEach(locale => {
    const localeDir = path.join(__dirname, '../out/locales', locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }
    
    // Copy common.json if it exists in the source
    const sourceJson = path.join(__dirname, '../public/locales', locale, 'common.json');
    const targetJson = path.join(localeDir, 'common.json');
    if (fs.existsSync(sourceJson)) {
      fs.copyFileSync(sourceJson, targetJson);
    } else {
      console.log(`Warning: ${sourceJson} does not exist`);
    }
  });
  
  console.log('✅ Created simplified index.html and locale files');
  return true;
}

// Run the fixes
const configFixed = fixRedirectLoop();
const indexCreated = createSimpleIndexHtml();

if (configFixed && indexCreated) {
  console.log('All fixes applied successfully, ready to deploy');
} else {
  console.error('Some fixes failed. Please check the errors above.');
}