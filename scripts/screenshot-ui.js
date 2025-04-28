const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const SCREENSHOT_DIR = path.join(process.env.HOME, 'Desktop', 'wine-app-screenshots');
const STAGING_URL = 'https://winepicker-63daa.web.app';
const PRODUCTION_URL = 'https://pickmywine-live.web.app';

/**
 * Captures a screenshot of a specific element on a page
 * @param {string} url - The URL to navigate to
 * @param {string} selector - CSS selector for the element to capture
 * @param {string} name - Name for the screenshot file
 * @param {Object} options - Additional options
 */
async function captureElement(url, selector, name, options = {}) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: options.width || 1280, height: options.height || 800 });
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Wait for the element to be visible
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    
    // Get the element
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    // Get the bounding box of the element
    const box = await element.boundingBox();
    if (!box) {
      throw new Error(`Could not get bounding box for element: ${selector}`);
    }
    
    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const outputPath = path.join(SCREENSHOT_DIR, filename);
    
    // Take a screenshot of just that element
    await page.screenshot({
      path: outputPath,
      clip: {
        x: box.x - (options.padding || 10),
        y: box.y - (options.padding || 10),
        width: box.width + 2 * (options.padding || 10),
        height: box.height + 2 * (options.padding || 10)
      }
    });
    
    console.log(`Screenshot saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error capturing element: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Captures screenshots of all key UI components
 */
async function captureUIComponents(environment = 'staging') {
  // Ensure the screenshots directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const baseUrl = environment === 'production' ? PRODUCTION_URL : STAGING_URL;
  const prefix = environment === 'production' ? 'prod' : 'stage';
  
  console.log(`Capturing UI components from ${baseUrl}...`);
  
  try {
    // Home page components
    await captureElement(baseUrl, 'header, .text-center', `${prefix}-header`);
    try {
      await captureElement(baseUrl, 'a[href="/my-list"]', `${prefix}-my-list-button`);
    } catch (error) {
      console.log(`Could not capture my-list button: ${error.message}`);
    }
    
    try {
      // Try to capture upload form if it exists
      await captureElement(baseUrl, '.container div', `${prefix}-content-area`);
    } catch (error) {
      console.log(`Could not capture upload form: ${error.message}`);
    }
    
    // Capture our modernized components
    try {
      // Try to capture wine card if one exists
      await captureElement(baseUrl, '.wine-card', `${prefix}-wine-card`);
    } catch (error) {
      console.log(`Could not capture wine card: ${error.message}`);
    }
    
    try {
      // Try to capture rating stars
      await captureElement(baseUrl, '.wine-card .flex.items-center.gap-1', `${prefix}-rating-stars`);
    } catch (error) {
      console.log(`Could not capture rating stars: ${error.message}`);
    }
    
    // Try to navigate to my-list page
    try {
      await captureElement(`${baseUrl}/my-list`, 'h1', `${prefix}-my-list-title`);
    } catch (error) {
      console.log(`Could not capture my-list title: ${error.message}`);
    }
    
    try {
      await captureElement(`${baseUrl}/my-list`, '.space-x-4, .flex', `${prefix}-my-list-actions`);
    } catch (error) {
      console.log(`Could not capture my-list actions: ${error.message}`);
    }
    
    console.log('All UI components captured successfully');
    return true;
  } catch (error) {
    console.error('Error capturing UI components:', error);
    return false;
  }
}

// Direct execution
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('Invalid environment. Must be "staging" or "production"');
    process.exit(1);
  }
  
  captureUIComponents(environment)
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = {
  captureElement,
  captureUIComponents
};