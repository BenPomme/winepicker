#!/usr/bin/env node

/**
 * Translation Verification and Fix Script
 * 
 * This script:
 * 1. Verifies all language translation files against English (source of truth)
 * 2. Identifies missing or inconsistent translations
 * 3. Optionally fixes issues by copying English defaults for missing keys
 * 4. Ensures structure consistency across all translation files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['fr', 'zh', 'ar', 'ru'];
const TRANSLATION_FILE = 'common.json';
const AUTO_FIX = true; // Set to true to automatically fix issues

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

console.log(`${colors.bright}${colors.blue}=== Translation Verification Tool ===${colors.reset}\n`);

// Read source locale (English) translations
const sourceLocaleFilePath = path.join(LOCALES_DIR, SOURCE_LOCALE, TRANSLATION_FILE);
let sourceTranslations;

try {
  sourceTranslations = JSON.parse(fs.readFileSync(sourceLocaleFilePath, 'utf8'));
  console.log(`${colors.green}✓ Loaded source translations from ${SOURCE_LOCALE}/${TRANSLATION_FILE}${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error loading source translations: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Get all keys from source translations (recursively)
function getAllKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((keys, key) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return [...keys, ...getAllKeys(obj[key], newPrefix)];
    }
    
    return [...keys, newPrefix];
  }, []);
}

// Get value from object using dotted path notation
function getValueByPath(obj, path) {
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
}

// Set value in object using dotted path notation
function setValueByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, key) => {
    o[key] = o[key] || {};
    return o[key];
  }, obj);
  
  target[lastKey] = value;
}

// Format missing key stats for console output
function formatMissingKeyStats(locale, missingKeys, fixedKeys) {
  if (missingKeys.length === 0) {
    return `${colors.green}✓ ${locale}: Complete (no missing translations)${colors.reset}`;
  }
  
  if (AUTO_FIX) {
    return `${colors.yellow}⚠ ${locale}: ${missingKeys.length} keys automatically fixed${colors.reset}`;
  }
  
  return `${colors.red}✗ ${locale}: ${missingKeys.length} keys missing translations${colors.reset}`;
}

// Process each target locale
let summaryStats = {};
const sourceKeys = getAllKeys(sourceTranslations);
console.log(`\n${colors.cyan}Found ${sourceKeys.length} translation keys in source locale${colors.reset}\n`);

// Process all target locales
for (const locale of TARGET_LOCALES) {
  console.log(`\n${colors.bright}Checking ${locale} translations...${colors.reset}`);
  const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
  
  // Skip if locale file doesn't exist
  if (!fs.existsSync(localeFilePath)) {
    console.log(`${colors.red}✗ ${locale} translation file doesn't exist${colors.reset}`);
    continue;
  }
  
  // Read target locale translations
  let targetTranslations;
  try {
    targetTranslations = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}Error reading ${locale} translations: ${error.message}${colors.reset}`);
    continue;
  }
  
  // Check for missing keys
  const missingKeys = [];
  const fixedKeys = [];
  
  for (const key of sourceKeys) {
    const sourceValue = getValueByPath(sourceTranslations, key);
    const targetValue = getValueByPath(targetTranslations, key);
    
    if (targetValue === undefined) {
      missingKeys.push(key);
      
      // Auto-fix missing keys if enabled
      if (AUTO_FIX) {
        setValueByPath(targetTranslations, key, sourceValue);
        fixedKeys.push(key);
      }
    }
  }
  
  // Save fixed translations if any keys were fixed
  if (AUTO_FIX && fixedKeys.length > 0) {
    try {
      fs.writeFileSync(
        localeFilePath,
        JSON.stringify(targetTranslations, null, 2),
        'utf8'
      );
      console.log(`${colors.green}✓ Fixed and saved ${fixedKeys.length} missing translations for ${locale}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error saving fixed translations for ${locale}: ${error.message}${colors.reset}`);
    }
  }
  
  // Print results
  console.log(formatMissingKeyStats(locale, missingKeys, fixedKeys));
  
  if (missingKeys.length > 0 && !AUTO_FIX) {
    console.log(`\n${colors.yellow}Missing keys:${colors.reset}`);
    missingKeys.forEach(key => console.log(`  - ${key}`));
  }
  
  // Save stats for summary
  summaryStats[locale] = {
    total: sourceKeys.length,
    missing: missingKeys.length,
    fixed: fixedKeys.length
  };
}

// Print summary
console.log(`\n${colors.bright}${colors.blue}=== Translation Summary ===${colors.reset}`);
console.log(`${colors.cyan}Total keys in source locale: ${sourceKeys.length}${colors.reset}\n`);

for (const locale of TARGET_LOCALES) {
  if (!summaryStats[locale]) continue;
  
  const { total, missing, fixed } = summaryStats[locale];
  const completeness = ((total - missing + fixed) / total * 100).toFixed(1);
  
  console.log(`${colors.bright}${locale}:${colors.reset} ${completeness}% complete${fixed > 0 ? ` (${fixed} keys auto-fixed)` : ''}`);
}

console.log(`\n${colors.green}Translation verification complete!${colors.reset}`);