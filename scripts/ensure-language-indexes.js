#!/usr/bin/env node

/**
 * This script ensures that each language directory has a valid index.html file
 * It copies the main index.html file to each language directory if needed
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUT_DIR = path.join(__dirname, '../out');
const SOURCE_INDEX = path.join(OUT_DIR, 'index.html');
const LOCALES = ['en', 'fr', 'zh', 'ar', 'ru'];

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m'
};

console.log(`${colors.bright}${colors.blue}=== Ensuring Language Index Files ===${colors.reset}\n`);

// Check if source index exists
if (!fs.existsSync(SOURCE_INDEX)) {
  console.error(`${colors.red}Error: Source index file not found at ${SOURCE_INDEX}${colors.reset}`);
  process.exit(1);
}

// Read source index content
let sourceIndexContent;
try {
  sourceIndexContent = fs.readFileSync(SOURCE_INDEX, 'utf8');
  console.log(`${colors.green}✓ Read source index.html${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error reading source index: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Create index files for each locale
for (const locale of LOCALES) {
  const localeDir = path.join(OUT_DIR, locale);
  const localeIndex = path.join(localeDir, 'index.html');
  
  // Skip if locale directory doesn't exist
  if (!fs.existsSync(localeDir)) {
    console.log(`${colors.yellow}⚠ Locale directory ${locale} doesn't exist, skipping${colors.reset}`);
    continue;
  }
  
  // Check if index already exists
  if (fs.existsSync(localeIndex)) {
    console.log(`${colors.yellow}ℹ Index file for ${locale} already exists${colors.reset}`);
    continue;
  }
  
  // Create language-specific index
  try {
    // Modify the content for the specific language if needed
    let localeIndexContent = sourceIndexContent;
    
    // For Arabic, ensure RTL is applied
    if (locale === 'ar') {
      localeIndexContent = localeIndexContent
        .replace('<html', '<html dir="rtl" lang="ar"')
        .replace('lang="en"', 'lang="ar"');
    } else {
      // For other languages, just set the lang attribute
      localeIndexContent = localeIndexContent
        .replace('lang="en"', `lang="${locale}"`);
    }
    
    // Update _nextI18Next data if present
    const nextDataMatch = localeIndexContent.match(/"_nextI18Next":\s*{[^}]*"initialLocale":\s*"[^"]*"/g);
    if (nextDataMatch) {
      localeIndexContent = localeIndexContent.replace(
        /"initialLocale":\s*"[^"]*"/g, 
        `"initialLocale":"${locale}"`
      );
    }
    
    // Write the file
    fs.writeFileSync(localeIndex, localeIndexContent, 'utf8');
    console.log(`${colors.green}✓ Created index file for ${locale}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error creating index for ${locale}: ${error.message}${colors.reset}`);
  }
}

console.log(`\n${colors.green}Language index files creation complete!${colors.reset}`);