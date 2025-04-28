const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const SCREENSHOT_DIR = path.join(process.env.HOME, 'Desktop', 'wine-app-screenshots');
const TIMEOUT = 10000; // 10 seconds timeout for loading pages

/**
 * Takes a screenshot of a webpage at the given URL
 * @param {string} url - The URL to capture
 * @param {string} filename - The filename for the screenshot (without extension)
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {boolean} fullPage - Whether to capture full page or just viewport
 */
async function takeScreenshot(url, filename, width = 1280, height = 800, fullPage = false) {
  console.log(`Taking screenshot of ${url}...`);
  
  // Ensure the screenshots directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width, height });
    
    // Navigate to the URL with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });
    
    // Wait a bit for any animations to complete
    try {
      // For newer puppeteer versions
      await page.waitForTimeout(1000);
    } catch (error) {
      // For older puppeteer versions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Take the screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${filename}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage
    });
    
    console.log(`Screenshot saved to ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error(`Error taking screenshot of ${url}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Verify if a deployment is correct by checking for specific elements
 * @param {string} url - The URL to check
 * @param {Object} selectors - Object with element selectors to verify
 * @returns {Promise<{success: boolean, message: string, elements: Object}>}
 */
async function verifyDeployment(url, selectors) {
  console.log(`Verifying deployment at ${url}...`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the URL with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });
    
    // Check for each selector
    const results = {};
    for (const [name, selector] of Object.entries(selectors)) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        results[name] = true;
      } catch (error) {
        results[name] = false;
      }
    }
    
    // Take a verification screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `verification-${url.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
    const screenshotPath = path.join(SCREENSHOT_DIR, `${filename}.png`);
    await page.screenshot({ path: screenshotPath });
    
    // Check if all elements were found
    const allFound = Object.values(results).every(value => value === true);
    
    return {
      success: allFound,
      message: allFound ? 'All elements found' : 'Some elements were not found',
      elements: results,
      screenshotPath
    };
  } catch (error) {
    console.error(`Error verifying deployment at ${url}:`, error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      elements: {}
    };
  } finally {
    await browser.close();
  }
}

// Module exports
module.exports = {
  takeScreenshot,
  verifyDeployment
};

// Direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node take-screenshot.js <url> <filename> [width] [height] [fullPage]');
    process.exit(1);
  }
  
  const [url, filename] = args;
  const width = parseInt(args[2] || '1280', 10);
  const height = parseInt(args[3] || '800', 10);
  const fullPage = args[4] === 'true';
  
  takeScreenshot(url, filename, width, height, fullPage)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}