#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}=== MyWine App Resource Checker ===${colors.reset}\n`);

const rootDir = path.join(__dirname, '..');
const iconsDir = path.join(rootDir, 'public', 'icons');

// Clean up any old font files
const fontsDir = path.join(rootDir, 'public', 'fonts');
const fontPlaceholder = path.join(fontsDir, 'CalSans-SemiBold.woff2.placeholder');

if (fs.existsSync(fontPlaceholder)) {
  try {
    fs.unlinkSync(fontPlaceholder);
    console.log(`${colors.yellow}ℹ Removed old font placeholder file (no longer needed)${colors.reset}`);
  } catch (err) {
    console.error('Could not remove old placeholder file:', err);
  }
}

// Check icons
console.log(`\n${colors.bold}Checking icon resources...${colors.reset}`);
const icon192 = path.join(iconsDir, 'app-icon-192.png');
const icon512 = path.join(iconsDir, 'app-icon-512.png');

let icon192Valid = false;
let icon512Valid = false;

if (fs.existsSync(icon192)) {
  try {
    const fileInfo = execSync(`file "${icon192}"`).toString();
    icon192Valid = fileInfo.includes('PNG image data');
    console.log(icon192Valid 
      ? `${colors.green}✓ app-icon-192.png is valid${colors.reset}` 
      : `${colors.red}✗ app-icon-192.png exists but is not a valid PNG${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Error checking app-icon-192.png${colors.reset}`);
  }
} else {
  console.log(`${colors.red}✗ app-icon-192.png is missing${colors.reset}`);
}

if (fs.existsSync(icon512)) {
  try {
    const fileInfo = execSync(`file "${icon512}"`).toString();
    icon512Valid = fileInfo.includes('PNG image data');
    console.log(icon512Valid 
      ? `${colors.green}✓ app-icon-512.png is valid${colors.reset}` 
      : `${colors.red}✗ app-icon-512.png exists but is not a valid PNG${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Error checking app-icon-512.png${colors.reset}`);
  }
} else {
  console.log(`${colors.red}✗ app-icon-512.png is missing${colors.reset}`);
}

// Generate placeholders if needed
if (!icon192Valid || !icon512Valid) {
  console.log(`\n${colors.yellow}ℹ Generating placeholder icons...${colors.reset}`);
  try {
    execSync('node ' + path.join(__dirname, 'generate-icons.js'));
    console.log(`${colors.green}✓ Placeholder icons generated successfully${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to generate placeholder icons: ${error.message}${colors.reset}`);
  }
}

// Final status summary
console.log(`\n${colors.bold}${colors.blue}=== Resource Status Summary ===${colors.reset}`);
  
const iconsStatus = (icon192Valid && icon512Valid) 
  ? `${colors.green}Valid${colors.reset}` 
  : (fs.existsSync(icon192) && fs.existsSync(icon512)) 
    ? `${colors.yellow}Placeholders${colors.reset}` 
    : `${colors.red}Missing${colors.reset}`;

console.log(`App icons: ${iconsStatus}`);

if (!icon192Valid || !icon512Valid) {
  console.log(`\n${colors.yellow}Run this script again after adding the missing resources${colors.reset}`);
} else {
  console.log(`\n${colors.green}All required resources are present and valid!${colors.reset}`);
}