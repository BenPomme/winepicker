/**
 * This script fixes the static export directory structure for i18n support in Firebase
 * 
 * It verifies the structure of the /out directory and ensures that locale-specific
 * pages are properly structured for Firebase hosting.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Supported locales
const LOCALES = ['en', 'fr', 'zh', 'ar'];

// Helper function to copy a file or directory
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source does not exist: ${src}`);
    return;
  }

  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
      console.log(`Created directory: ${dest}`);
    }
    
    // Copy all files in the directory
    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      copyRecursive(srcFile, destFile);
    }
  } else {
    // Ensure the destination directory exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`Created directory: ${destDir}`);
    }
    
    // Copy the file
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  }
}

// Clean up problematic directories
function cleanupProblematicDirs() {
  // These directories are causing conflicts
  const problematicDirs = [
    'out/en/index.html',
    'out/fr/index.html',
    'out/zh/index.html',
    'out/ar/index.html',
    'out/en/app/index.html',
    'out/fr/app/index.html',
    'out/zh/app/index.html',
    'out/ar/app/index.html'
  ];
  
  for (const dir of problematicDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      try {
        execSync(`rm -rf "${dir}"`);
        console.log(`Removed problematic directory: ${dir}`);
      } catch (error) {
        console.error(`Error removing ${dir}:`, error);
      }
    }
  }
}

// Ensure locale directories have proper index.html files
function fixLocaleDirs() {
  const outDir = path.join(__dirname, '../out');
  
  // First check that the out directory exists
  if (!fs.existsSync(outDir)) {
    console.error('Error: out directory does not exist. Run the build first.');
    process.exit(1);
  }
  
  // Clean up problematic directories first
  cleanupProblematicDirs();
  
  // Make sure the root index.html exists and has proper language detection
  const rootIndexPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(rootIndexPath)) {
    console.log('Creating root index.html with language detection...');
    
    const rootIndexContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PickMyWine</title>
  <meta http-equiv="refresh" content="0;url=/en/">
  <script>
    // Get user's browser language
    const userLang = navigator.language || navigator.userLanguage;
    const shortLang = userLang.split('-')[0];
    
    // Check if we support this language
    const supportedLocales = ['en', 'fr', 'zh', 'ar'];
    const targetLocale = supportedLocales.includes(shortLang) ? shortLang : 'en';
    
    // Redirect to the appropriate language version
    window.location.href = '/' + targetLocale + '/';
  </script>
</head>
<body>
  <p>Redirecting to your preferred language...</p>
</body>
</html>`;
    
    fs.writeFileSync(rootIndexPath, rootIndexContent);
    console.log('Created root index.html');
  }
  
  // Ensure each locale directory has index.html and index/index.html
  for (const locale of LOCALES) {
    const localeDir = path.join(outDir, locale);
    
    // Create locale directory if it doesn't exist
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
      console.log(`Created directory: ${localeDir}`);
    }
    
    // Copy main index content to locale directory if needed
    const localeIndexPath = path.join(localeDir, 'index.html');
    const mainIndexPath = path.join(outDir, 'index', 'index.html');
    
    if (fs.existsSync(mainIndexPath) && !fs.existsSync(localeIndexPath)) {
      // Copy index.html content but don't create an index.html directory
      const indexContent = fs.readFileSync(mainIndexPath, 'utf8');
      fs.writeFileSync(localeIndexPath, indexContent);
      console.log(`Created ${localeIndexPath}`);
    }
    
    // Create app directory in locale if needed
    const appDir = path.join(localeDir, 'app');
    const mainAppDir = path.join(outDir, 'app');
    
    if (fs.existsSync(mainAppDir)) {
      if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
      }
      
      const appIndexPath = path.join(appDir, 'index.html');
      const mainAppIndexPath = path.join(mainAppDir, 'index.html');
      
      if (fs.existsSync(mainAppIndexPath) && !fs.existsSync(appIndexPath)) {
        // Copy the app index.html to locale/app directory
        fs.copyFileSync(mainAppIndexPath, appIndexPath);
        console.log(`Created ${appIndexPath}`);
      }
    }
    
    // Also fix other top-level pages
    const pageDirs = [
      'my-list', 'signup', 'test', 'test2', 'no-bs-demo', 
      'test-no-bs', 'test-no-bs-direct', 'test-simple', 'test-web-search-client'
    ];
    
    for (const page of pageDirs) {
      const pageDir = path.join(localeDir, page);
      const mainPageDir = path.join(outDir, page);
      
      if (fs.existsSync(mainPageDir)) {
        if (!fs.existsSync(pageDir)) {
          fs.mkdirSync(pageDir, { recursive: true });
        }
        
        const pageIndexPath = path.join(pageDir, 'index.html');
        const mainPageIndexPath = path.join(mainPageDir, 'index.html');
        
        if (fs.existsSync(mainPageIndexPath) && !fs.existsSync(pageIndexPath)) {
          fs.copyFileSync(mainPageIndexPath, pageIndexPath);
          console.log(`Created ${pageIndexPath}`);
        }
      }
    }
  }
}

// Main function
function main() {
  console.log('Starting i18n static export directory fix...');
  
  try {
    fixLocaleDirs();
    console.log('✅ Static export directory structure fixed for i18n support');
  } catch (error) {
    console.error('❌ Error fixing directory structure:', error);
    process.exit(1);
  }
}

// Run the main function
main();