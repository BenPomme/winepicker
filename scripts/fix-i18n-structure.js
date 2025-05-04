/**
 * Comprehensive fix for i18n static export structure
 */
const fs = require('fs');
const path = require('path');

// Supported locales
const LOCALES = ['en', 'fr', 'zh', 'ar'];
const PROJECT_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(PROJECT_ROOT, 'out');

// Step 1: Create index.html files in each locale root
function createLocaleIndexFiles() {
  console.log('Creating locale index.html files...');
  
  // Get the content from the main index.html
  const mainIndexPath = path.join(OUT_DIR, 'index.html');
  if (!fs.existsSync(mainIndexPath)) {
    console.error('Main index.html not found. Aborting.');
    process.exit(1);
  }
  
  const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
  
  // Create index.html in each locale directory
  for (const locale of LOCALES) {
    const localeDir = path.join(OUT_DIR, locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }
    
    const localeIndexPath = path.join(localeDir, 'index.html');
    
    if (!fs.existsSync(localeIndexPath) || fs.statSync(localeIndexPath).isDirectory()) {
      if (fs.existsSync(localeIndexPath) && fs.statSync(localeIndexPath).isDirectory()) {
        try {
          fs.rmdirSync(localeIndexPath, { recursive: true });
          console.log(`Removed problematic index.html directory at ${localeIndexPath}`);
        } catch (err) {
          console.error(`Error removing directory ${localeIndexPath}:`, err);
        }
      }
      
      fs.writeFileSync(localeIndexPath, mainIndexContent);
      console.log(`Created index.html in ${localeDir}`);
    }
  }
}

// Step 2: Fix Firebase configuration
function updateFirebaseConfig() {
  console.log('Updating Firebase configuration...');
  
  const firebaseConfigPath = path.join(PROJECT_ROOT, 'firebase.json');
  const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  
  // Update both hosting targets
  for (const hosting of config.hosting) {
    // Simplify the configuration
    hosting.cleanUrls = true; // Enable clean URLs
    hosting.trailingSlash = false; // Disable trailing slash
    
    // Keep only API rewrites and simplify the rest
    hosting.rewrites = [
      // API handlers
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
      // Catch-all - this is important for SPA functionality
      {
        "source": "**",
        "destination": "/index.html"
      }
    ];
    
    // Simple redirects for language selection
    hosting.redirects = [
      {
        "source": "/",
        "destination": "/en",
        "type": 302
      },
      {
        "source": "/en",
        "destination": "/en/",
        "type": 301
      },
      {
        "source": "/fr",
        "destination": "/fr/",
        "type": 301
      },
      {
        "source": "/zh",
        "destination": "/zh/",
        "type": 301
      },
      {
        "source": "/ar",
        "destination": "/ar/",
        "type": 301
      }
    ];
  }
  
  // Write the updated config
  fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
  console.log('Firebase configuration updated!');
}

// Step 3: Ensure page directories have index.html files
function fixPageStructure() {
  console.log('Fixing page directory structure...');
  
  // List of important pages to check
  const pages = [
    'app',
    'my-list',
    'signup',
    'test',
    'no-bs-demo'
  ];
  
  // For each locale
  for (const locale of LOCALES) {
    const localeDir = path.join(OUT_DIR, locale);
    
    // For each page
    for (const page of pages) {
      const pageDir = path.join(localeDir, page);
      
      if (fs.existsSync(pageDir) && fs.statSync(pageDir).isDirectory()) {
        const indexPath = path.join(pageDir, 'index.html');
        
        // Check if index.html exists as a file
        if (!fs.existsSync(indexPath) || fs.statSync(indexPath).isDirectory()) {
          // If index.html is a directory, we need to fix it
          if (fs.existsSync(indexPath) && fs.statSync(indexPath).isDirectory()) {
            // First check if there's an index.html file inside
            const nestedIndexPath = path.join(indexPath, 'index.html');
            if (fs.existsSync(nestedIndexPath) && fs.statSync(nestedIndexPath).isFile()) {
              // Copy the nested index.html to the parent directory
              const content = fs.readFileSync(nestedIndexPath, 'utf8');
              
              // Remove the directory
              fs.rmdirSync(indexPath, { recursive: true });
              
              // Create the file instead
              fs.writeFileSync(indexPath, content);
              console.log(`Fixed nested index.html in ${pageDir}`);
            } else {
              // Remove the problematic directory
              fs.rmdirSync(indexPath, { recursive: true });
              console.log(`Removed empty index.html directory in ${pageDir}`);
              
              // Try to find a reference index.html from the root
              const rootPageDir = path.join(OUT_DIR, page);
              const rootPageIndex = path.join(rootPageDir, 'index.html');
              
              if (fs.existsSync(rootPageIndex) && fs.statSync(rootPageIndex).isFile()) {
                const content = fs.readFileSync(rootPageIndex, 'utf8');
                fs.writeFileSync(indexPath, content);
                console.log(`Created index.html in ${pageDir} from root reference`);
              }
            }
          }
        }
      }
    }
  }
}

// Main execution
console.log('Starting comprehensive i18n fix...');

try {
  createLocaleIndexFiles();
  fixPageStructure();
  updateFirebaseConfig();
  console.log('✅ i18n structure fixed successfully!');
} catch (error) {
  console.error('❌ Error fixing i18n structure:', error);
  process.exit(1);
}