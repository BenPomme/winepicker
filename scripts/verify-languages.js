#!/usr/bin/env node

/**
 * Language Verification Script
 * 
 * This script uses Puppeteer to test language functionality:
 * 1. Visits each language version of the site
 * 2. Verifies content is displayed in the correct language
 * 3. Tests language switching functionality
 * 4. Checks RTL layout for Arabic
 * 5. Takes screenshots for verification
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://winepicker-63daa.web.app';
const LOCALES = ['en', 'fr', 'zh', 'ar', 'ru'];
const SCREENSHOTS_DIR = path.join(__dirname, '../language-screenshots');
const VIEWPORT = { width: 1280, height: 800 };

// Sample text to verify in each language
const TEXT_MARKERS = {
  en: {
    title: 'Upload a picture of bottles or a wine menu',
    button: 'Sign In',
    locale: 'English'
  },
  fr: {
    title: 'Téléchargez une photo de bouteilles ou d\'un menu de vin',
    button: 'Connexion',
    locale: 'French'
  },
  zh: {
    title: '上传葡萄酒瓶或酒单的照片',
    button: '登录',
    locale: 'Chinese'
  },
  ar: {
    title: 'تحميل صورة للزجاجات أو قائمة النبيذ',
    button: 'تسجيل الدخول',
    locale: 'Arabic'
  },
  ru: {
    title: 'Загрузите фотографию бутылок или винного меню',
    button: 'Войти',
    locale: 'Russian'
  }
};

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

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Main function
async function verifyLanguages() {
  console.log(`${colors.bright}${colors.blue}=== Language Verification Tool ===${colors.reset}\n`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test each locale
    for (const locale of LOCALES) {
      console.log(`\n${colors.bright}${colors.cyan}Testing ${locale.toUpperCase()} language...${colors.reset}`);
      
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);
      
      const url = `${BASE_URL}/${locale}/`;
      
      try {
        // Visit the language page
        console.log(`${colors.yellow}Visiting ${url}${colors.reset}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Take screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${locale}-homepage.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`${colors.green}✓ Screenshot saved to ${screenshotPath}${colors.reset}`);
        
        // Check for expected text in this language
        const markers = TEXT_MARKERS[locale];
        for (const [key, text] of Object.entries(markers)) {
          const textExists = await page.evaluate((text) => {
            return document.body.innerText.includes(text);
          }, text);
          
          if (textExists) {
            console.log(`${colors.green}✓ Found text marker "${key}" in ${locale}${colors.reset}`);
          } else {
            console.log(`${colors.red}✗ Text marker "${key}" (${text}) not found in ${locale}${colors.reset}`);
          }
        }
        
        // Check if language button displays the correct language
        const languageButtonText = await page.evaluate(() => {
          const button = document.querySelector('button.inline-flex');
          return button ? button.textContent.trim() : null;
        });
        
        if (languageButtonText && languageButtonText.includes(markers.locale)) {
          console.log(`${colors.green}✓ Language selector shows "${languageButtonText}"${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ Language selector shows "${languageButtonText}" (expected to include "${markers.locale}")${colors.reset}`);
        }
        
        // Check RTL for Arabic
        if (locale === 'ar') {
          const isRtl = await page.evaluate(() => {
            return document.dir === 'rtl' || document.documentElement.dir === 'rtl';
          });
          
          if (isRtl) {
            console.log(`${colors.green}✓ RTL direction is properly set for Arabic${colors.reset}`);
          } else {
            console.log(`${colors.red}✗ RTL direction is not set for Arabic${colors.reset}`);
          }
        }
        
        // Test language switching
        if (locale !== 'en') {
          // Click language selector
          await page.click('button.inline-flex');
          await page.waitForTimeout(500);
          
          // Take screenshot of language dropdown
          const dropdownScreenshot = path.join(SCREENSHOTS_DIR, `${locale}-language-dropdown.png`);
          await page.screenshot({ path: dropdownScreenshot });
          console.log(`${colors.green}✓ Language dropdown screenshot saved${colors.reset}`);
          
          // Switch to English
          const englishOptionExists = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button[role="menuitem"]'));
            const englishButton = buttons.find(b => b.textContent.trim().includes('English'));
            return !!englishButton;
          });
          
          if (englishOptionExists) {
            console.log(`${colors.green}✓ English option exists in language dropdown${colors.reset}`);
            
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button[role="menuitem"]'));
              const englishButton = buttons.find(b => b.textContent.trim().includes('English'));
              if (englishButton) englishButton.click();
            });
            
            // Wait for navigation
            await page.waitForTimeout(3000);
            
            // Check URL after language switch
            const newUrl = page.url();
            if (newUrl.includes('/en/')) {
              console.log(`${colors.green}✓ Successfully switched to English${colors.reset}`);
            } else {
              console.log(`${colors.red}✗ Failed to switch to English, URL is ${newUrl}${colors.reset}`);
            }
          } else {
            console.log(`${colors.red}✗ English option not found in language dropdown${colors.reset}`);
          }
        }
        
        await page.close();
      } catch (error) {
        console.error(`${colors.red}Error testing ${locale}: ${error.message}${colors.reset}`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  
  console.log(`\n${colors.bright}${colors.blue}=== Language Verification Complete ===${colors.reset}`);
  console.log(`${colors.yellow}Screenshots saved to: ${SCREENSHOTS_DIR}${colors.reset}`);
}

// Run the script
verifyLanguages().catch(console.error);