/**
 * Script to verify the translation integrity between different languages
 * 
 * Usage: node verify-translations.js
 */

const fs = require('fs');
const path = require('path');

// Path to locales
const localesPath = path.resolve(__dirname, '../public/locales');

// Get all locales
const locales = fs.readdirSync(localesPath).filter(dir => 
  fs.statSync(path.join(localesPath, dir)).isDirectory()
);

console.log(`Found ${locales.length} locales: ${locales.join(', ')}`);

// Base locale (English)
const baseLocale = 'en';

// Get all translation files for base locale
const baseTranslationFiles = fs.readdirSync(path.join(localesPath, baseLocale))
  .filter(file => file.endsWith('.json'));

console.log(`Found ${baseTranslationFiles.length} translation files in ${baseLocale}`);

// Loop through each translation file
for (const file of baseTranslationFiles) {
  console.log(`\nChecking ${file}...`);
  
  // Load the base translation
  const basePath = path.join(localesPath, baseLocale, file);
  const baseTranslation = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  
  // Get all keys from base translation (flattened)
  const baseKeys = flattenObject(baseTranslation);
  const baseKeyCount = Object.keys(baseKeys).length;
  
  console.log(`Base (${baseLocale}) has ${baseKeyCount} translation keys`);
  
  // Loop through each locale
  for (const locale of locales) {
    if (locale === baseLocale) continue;
    
    const localePath = path.join(localesPath, locale, file);
    
    // Check if file exists
    if (!fs.existsSync(localePath)) {
      console.log(`⚠️ ${locale}: File ${file} is missing`);
      continue;
    }
    
    // Load and parse translation
    const localeTranslation = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    const localeKeys = flattenObject(localeTranslation);
    const localeKeyCount = Object.keys(localeKeys).length;
    
    // Find missing keys
    const missingKeys = findMissingKeys(baseKeys, localeKeys);
    
    if (missingKeys.length > 0) {
      console.log(`⚠️ ${locale}: Missing ${missingKeys.length} keys`);
      missingKeys.forEach(key => console.log(`   - ${key}`));
    } else {
      console.log(`✅ ${locale}: All ${baseKeyCount} keys present`);
    }
    
    // Find extra keys that don't exist in base
    const extraKeys = findMissingKeys(localeKeys, baseKeys);
    if (extraKeys.length > 0) {
      console.log(`ℹ️ ${locale}: Has ${extraKeys.length} extra keys`);
      extraKeys.forEach(key => console.log(`   + ${key}`));
    }
  }
}

/**
 * Flatten a nested object into a single-level object with dot notation
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], newKey));
    } else {
      acc[newKey] = obj[key];
    }
    
    return acc;
  }, {});
}

/**
 * Find keys that exist in source but not in target
 */
function findMissingKeys(source, target) {
  return Object.keys(source).filter(key => !target.hasOwnProperty(key));
}