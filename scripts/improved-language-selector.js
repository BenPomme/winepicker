/**
 * Create an improved language selector with client-side localization
 */
const fs = require('fs');
const path = require('path');

// Create i18n-aware index page
function createImprovedIndexHtml() {
  console.log('Creating improved language selector...');
  
  // Create out directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '../out'))) {
    fs.mkdirSync(path.join(__dirname, '../out'));
  }
  
  // Create a better index.html that loads translations correctly
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PickMyWine</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      text-align: center;
      color: #333;
    }
    
    h1 {
      color: #5a2327;
      margin-bottom: 2rem;
    }
    
    .language-selector {
      margin: 2rem 0;
    }
    
    .language-btn {
      display: inline-block;
      padding: 10px 20px;
      margin: 5px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #333;
      text-decoration: none;
      font-size: 16px;
      cursor: pointer;
    }
    
    .language-btn:hover {
      background-color: #e9e9e9;
    }
    
    .language-btn.active {
      background-color: #5a2327;
      color: white;
      border-color: #5a2327;
    }
    
    .rtl {
      direction: rtl;
    }
    
    #uploadZone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin: 2rem 0;
      cursor: pointer;
    }
    
    #uploadZone:hover {
      border-color: #5a2327;
    }
    
    button.primary-btn {
      background-color: #5a2327;
      color: white;
      border: none;
      padding: 10px 25px;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 1rem;
    }
    
    button.primary-btn:hover {
      background-color: #722b30;
    }
    
    .footer {
      margin-top: 3rem;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="app">
    <h1 id="app-title">PickMyWine</h1>
    
    <div class="language-selector">
      <button class="language-btn" data-lang="en">English</button>
      <button class="language-btn" data-lang="fr">Français</button>
      <button class="language-btn" data-lang="zh">中文</button>
      <button class="language-btn" data-lang="ar">العربية</button>
    </div>
    
    <p id="upload-title">Upload a picture of bottles or a wine menu</p>
    
    <div id="uploadZone">
      <p id="dropzone-text">Drag and drop an image here, or click to select a file</p>
    </div>
    
    <button class="primary-btn" id="upload-btn">Upload</button>
    
    <div class="footer">
      <p>This is a simplified version of the application for language testing purposes.</p>
    </div>
  </div>

  <script>
    // Available languages
    const supportedLocales = ['en', 'fr', 'zh', 'ar'];
    
    // Get user's browser language
    function getPreferredLanguage() {
      const userLang = navigator.language || navigator.userLanguage;
      const shortLang = userLang.split('-')[0];
      return supportedLocales.includes(shortLang) ? shortLang : 'en';
    }
    
    // Current language
    let currentLanguage = getPreferredLanguage();
    
    // Set RTL direction if needed
    function setDirection(locale) {
      if (locale === 'ar') {
        document.documentElement.dir = 'rtl';
        document.body.classList.add('rtl');
      } else {
        document.documentElement.dir = 'ltr';
        document.body.classList.remove('rtl');
      }
    }
    
    // Load translations for a language
    function loadTranslations(locale) {
      fetch('/locales/' + locale + '/common.json')
        .then(response => response.json())
        .then(translations => {
          // Update page content with translations
          document.getElementById('app-title').textContent = translations.appName || 'PickMyWine';
          document.getElementById('upload-title').textContent = translations.upload?.title || 'Upload a picture of bottles or a wine menu';
          document.getElementById('dropzone-text').textContent = translations.upload?.dropzone || 'Drag and drop an image here, or click to select a file';
          document.getElementById('upload-btn').textContent = translations.upload?.button || 'Upload';
          
          // Update document title
          document.title = translations.appName || 'PickMyWine';
        })
        .catch(err => console.error('Failed to load translations:', err));
    }
    
    // Change the active language button
    function updateActiveLanguageButton() {
      // Remove active class from all buttons
      document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to current language button
      const activeBtn = document.querySelector('.language-btn[data-lang="' + currentLanguage + '"]');
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }
    
    // Change language
    function changeLanguage(locale) {
      currentLanguage = locale;
      setDirection(locale);
      loadTranslations(locale);
      updateActiveLanguageButton();
      
      // Save language preference
      localStorage.setItem('preferredLanguage', locale);
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      // Load saved language preference if available
      const savedLanguage = localStorage.getItem('preferredLanguage');
      if (savedLanguage && supportedLocales.includes(savedLanguage)) {
        currentLanguage = savedLanguage;
      }
      
      // Set initial language
      setDirection(currentLanguage);
      loadTranslations(currentLanguage);
      updateActiveLanguageButton();
      
      // Add click event listeners to language buttons
      document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const lang = this.getAttribute('data-lang');
          changeLanguage(lang);
        });
      });
    });
  </script>
</body>
</html>`;

  // Write the index.html
  fs.writeFileSync(path.join(__dirname, '../out/index.html'), indexHtml);
  
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
  
  console.log('✅ Created improved index.html with language selector');
  return true;
}

// Run the function
createImprovedIndexHtml();