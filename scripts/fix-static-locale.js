#!/usr/bin/env node

/**
 * This script modifies the index.html files in the out directory
 * to correctly set the initialLocale value in the __NEXT_DATA__ JSON
 * for each language directory.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUT_DIR = path.join(__dirname, '../out');
const LOCALES = ['en', 'fr', 'zh', 'ar', 'ru'];

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m'
};

console.log(`${colors.bright}${colors.blue}=== Fixing Static Locale in HTML Files ===${colors.reset}\n`);

// Get all HTML files in locale directories
function findHtmlFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  
  return results;
}

// Process each locale
for (const locale of LOCALES) {
  const localeDir = path.join(OUT_DIR, locale);
  
  // Skip if locale directory doesn't exist
  if (!fs.existsSync(localeDir)) {
    console.log(`${colors.yellow}⚠ Locale directory ${locale} doesn't exist, skipping${colors.reset}`);
    continue;
  }
  
  console.log(`${colors.bright}Processing ${locale} directory...${colors.reset}`);
  
  // Find all HTML files in this locale directory
  const htmlFiles = findHtmlFiles(localeDir);
  console.log(`Found ${htmlFiles.length} HTML files in ${locale} directory`);
  
  let modifiedCount = 0;
  
  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    try {
      let content = fs.readFileSync(htmlFile, 'utf8');
      
      // Add lang attribute to html tag if not already present
      if (!content.includes(`<html lang="${locale}"`) && !content.includes(`lang="${locale}"`)) {
        content = content.replace('<html', `<html lang="${locale}"`);
      }
      
      // Add dir="rtl" for Arabic
      if (locale === 'ar' && !content.includes('dir="rtl"')) {
        content = content.replace('<html', '<html dir="rtl"');
      }
      
      // Find __NEXT_DATA__ JSON
      const nextDataMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (nextDataMatch) {
        try {
          const jsonData = JSON.parse(nextDataMatch[1]);
          
          // Check if the initialLocale needs to be updated
          const needsUpdate = 
            !jsonData.props?.pageProps?._nextI18Next?.initialLocale || 
            jsonData.props?.pageProps?._nextI18Next?.initialLocale !== locale;
          
          if (needsUpdate) {
            // Ensure the path exists
            if (!jsonData.props) jsonData.props = {};
            if (!jsonData.props.pageProps) jsonData.props.pageProps = {};
            if (!jsonData.props.pageProps._nextI18Next) jsonData.props.pageProps._nextI18Next = {};
            
            // Set the locale
            jsonData.props.pageProps._nextI18Next.initialLocale = locale;
            
            // Replace the JSON in the file
            const newJson = JSON.stringify(jsonData);
            content = content.replace(nextDataMatch[0], `<script id="__NEXT_DATA__" type="application/json">${newJson}</script>`);
            
            modifiedCount++;
          }
        } catch (e) {
          console.error(`${colors.red}Error parsing JSON in ${htmlFile}: ${e.message}${colors.reset}`);
          continue;
        }
      } else {
        console.log(`${colors.yellow}No __NEXT_DATA__ found in ${htmlFile}${colors.reset}`);
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(htmlFile, content, 'utf8');
      
    } catch (e) {
      console.error(`${colors.red}Error processing ${htmlFile}: ${e.message}${colors.reset}`);
    }
  }
  
  console.log(`${colors.green}✓ Modified ${modifiedCount} files in ${locale} directory${colors.reset}`);
}

// Create root index.html files for each locale if missing
for (const locale of LOCALES) {
  const localeDir = path.join(OUT_DIR, locale);
  const indexFile = path.join(localeDir, 'index.html');
  
  if (!fs.existsSync(localeDir)) {
    continue;
  }
  
  if (!fs.existsSync(indexFile)) {
    console.log(`${colors.yellow}Creating missing root index.html for ${locale}${colors.reset}`);
    
    // Copy from the main index.html
    const mainIndexPath = path.join(OUT_DIR, 'index.html');
    if (fs.existsSync(mainIndexPath)) {
      let content = fs.readFileSync(mainIndexPath, 'utf8');
      
      // Add lang attribute
      content = content.replace('<html', `<html lang="${locale}"`);
      
      // Add dir="rtl" for Arabic
      if (locale === 'ar') {
        content = content.replace('<html', '<html dir="rtl"');
      }
      
      // Update initialLocale in __NEXT_DATA__
      const nextDataMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (nextDataMatch) {
        try {
          const jsonData = JSON.parse(nextDataMatch[1]);
          
          // Ensure the path exists
          if (!jsonData.props) jsonData.props = {};
          if (!jsonData.props.pageProps) jsonData.props.pageProps = {};
          if (!jsonData.props.pageProps._nextI18Next) jsonData.props.pageProps._nextI18Next = {};
          
          // Set the locale
          jsonData.props.pageProps._nextI18Next.initialLocale = locale;
          
          // Replace the JSON in the file
          const newJson = JSON.stringify(jsonData);
          content = content.replace(nextDataMatch[0], `<script id="__NEXT_DATA__" type="application/json">${newJson}</script>`);
        } catch (e) {
          console.error(`${colors.red}Error updating JSON for ${locale}/index.html: ${e.message}${colors.reset}`);
        }
      }
      
      // Write the file
      fs.writeFileSync(indexFile, content, 'utf8');
      console.log(`${colors.green}✓ Created index.html for ${locale}${colors.reset}`);
    } else {
      console.error(`${colors.red}Cannot create ${locale}/index.html: source index.html not found${colors.reset}`);
    }
  }
}

console.log(`\n${colors.green}${colors.bright}Static locale fix complete!${colors.reset}`);