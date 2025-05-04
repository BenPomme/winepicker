const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.env.HOME, 'Desktop', 'wine-app-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Base URL
const baseUrl = 'https://winepicker-63daa.web.app';

// Pages to test
const pagesToTest = [
  { name: 'home', path: '/en/' },
  { name: 'my-list', path: '/en/my-list/' },
  { name: 'my-list-fr', path: '/fr/my-list/' },
  { name: 'my-list-zh', path: '/zh/my-list/' },
  { name: 'my-list-ar', path: '/ar/my-list/' },
];

async function takeScreenshot(page, url, name) {
  console.log(`Taking screenshot of ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
  
  // Wait for content to load
  await page.waitForSelector('#__next', { timeout: 10000 });
  
  // Take the screenshot
  const screenshotPath = path.join(screenshotsDir, `${name}-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);
  
  return screenshotPath;
}

async function verifyPage(page, url, elementSelectors) {
  try {
    console.log(`Verifying page at ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    
    // Wait for page content
    await page.waitForSelector('#__next', { timeout: 10000 });
    
    // Check for elements
    const results = {};
    for (const [name, selector] of Object.entries(elementSelectors)) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        results[name] = true;
      } catch (error) {
        results[name] = false;
      }
    }
    
    // Take screenshot
    const screenshotPath = await takeScreenshot(page, url, `verification-${url.replace(/https?:\/\//, '').replace(/\//g, '-')}`);
    
    // Determine if verification was successful
    const success = Object.values(results).every(result => result === true);
    
    return {
      success,
      message: success ? 'All elements found' : 'Some elements were not found',
      elements: results,
      screenshotPath
    };
  } catch (error) {
    console.error(`Error verifying page at ${url}:`, error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      elements: {},
    };
  }
}

async function verifyLanguageSwitching(page) {
  try {
    console.log(`Verifying language switching...`);
    await page.goto(`${baseUrl}/en/`, { waitUntil: 'networkidle2', timeout: 20000 });
    
    // Wait for language selector
    await page.waitForSelector('[aria-label="Language Menu"] button', { timeout: 10000 });
    
    // Take screenshot of language menu
    const screenshotPath = await takeScreenshot(page, `${baseUrl}/en/`, 'language-menu');
    
    // Click language menu
    await page.click('[aria-label="Language Menu"] button');
    
    // Wait for menu to open
    await page.waitForTimeout(1000);
    
    // Get available languages
    const languages = await page.evaluate(() => {
      const menuItems = Array.from(document.querySelectorAll('[aria-label="Language Menu"] ul li button'));
      return menuItems.map(item => item.textContent.trim()).join(', ');
    });
    
    console.log(`Available languages: ${languages}`);
    
    // Click on French
    const frenchSelector = '[aria-label="Language Menu"] ul li button[value="fr"]';
    if (await page.$(frenchSelector)) {
      await page.click(frenchSelector);
      await page.waitForNavigation({ timeout: 10000 });
      
      // Verify URL has changed to French
      const url = page.url();
      const isFrench = url.includes('/fr/');
      
      return {
        success: isFrench,
        message: isFrench ? 'Successfully switched to French' : 'Failed to switch to French',
        url
      };
    } else {
      return {
        success: false,
        message: 'French language option not found'
      };
    }
  } catch (error) {
    console.error(`Error verifying language switching:`, error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

// Main function
async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const results = {
    timestamp: new Date().toISOString(),
    baseUrl,
    pages: {}
  };
  
  try {
    // Check home page
    results.pages.home = await verifyPage(page, `${baseUrl}/en/`, {
      appTitle: 'h1',
      uploadButton: 'button[type="button"]',
      languageSelector: '[aria-label="Language Menu"]'
    });
    
    // Check my-list page
    results.pages.myList = await verifyPage(page, `${baseUrl}/en/my-list/`, {
      pageTitle: 'h1',
      languageSelector: '[aria-label="Language Menu"]'
    });
    
    // Check language switching
    results.languageSwitching = await verifyLanguageSwitching(page);
    
    // Final success determination
    results.success = results.pages.home.success && 
                    results.pages.myList.success && 
                    results.languageSwitching.success;
  } catch (error) {
    console.error('Error during verification:', error);
    results.success = false;
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  // Output results
  console.log('\nVerification Results:');
  console.log(JSON.stringify(results, null, 2));
  
  // Write results to file
  const resultPath = path.join(screenshotsDir, `verification-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultPath}`);
  
  return results.success ? 0 : 1;
}

main().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});