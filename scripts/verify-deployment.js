const { verifyDeployment, takeScreenshot } = require('./take-screenshot');
const puppeteer = require('puppeteer');

// Deployment URLs
const STAGING_URL = 'https://winepicker-63daa.web.app';
const PRODUCTION_URL = 'https://pickmywine-live.web.app';

// Elements to check for various features
const SELECTORS = {
  // Home page selectors
  homePageElements: {
    uploadButton: 'input[type="file"]',
    appTitle: 'h1',
    languageSelector: 'button', // Language selector button (less specific)
  },
  
  // My Wine List page selectors
  myListPageElements: {
    pageTitle: 'h1',
    languageSelector: 'button', // Language selector button (less specific)
  },
  
  // Wine Card selectors (when wines are displayed)
  wineCardElements: {
    wineCard: '.bg-white, .shadow-md',
    wineName: 'h2',
    wineScore: '.font-bold',
  },

  // Language related selectors
  languageElements: {
    languageSelector: 'button', // Language selector button (less specific)
    languageOptions: 'button', // Language dropdown options (less specific)
  }
};

/**
 * Verify language selection functionality
 * @param {string} url - Base URL to test
 * @param {string} screenshotPrefix - Prefix for screenshots
 */
async function verifyLanguageFeature(url, screenshotPrefix) {
  console.log(`Verifying language functionality at ${url}...`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    // Verify language selector exists
    await page.waitForSelector(SELECTORS.languageElements.languageSelector, { timeout: 5000 });
    
    // Click language selector to open dropdown
    await page.click(SELECTORS.languageElements.languageSelector);
    await page.waitForSelector(SELECTORS.languageElements.languageOptions, { timeout: 5000 });
    
    // Take screenshot with language menu open
    await takeScreenshot(url, `${screenshotPrefix}-language-menu`, 1280, 800, false);
    
    // Get language options
    const languageElements = await page.$$(SELECTORS.languageElements.languageOptions);
    const languages = [];
    for (const element of languageElements) {
      const text = await page.evaluate(el => el.textContent.trim(), element);
      languages.push(text);
    }
    
    console.log(`Available languages: ${languages.join(', ')}`);
    
    // Test switching to French (try to find and click the French option)
    try {
      // Try to find and click on the French button based on text content
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const frenchButton = buttons.find(button => 
          button.textContent.includes('French') || 
          button.textContent.includes('Français')
        );
        if (frenchButton) frenchButton.click();
      });
    } catch (error) {
      console.error('Failed to find and click French language option:', error);
    }
    
    // Wait for page to reload with new language
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    // Take screenshot of French version
    await takeScreenshot(page.url(), `${screenshotPrefix}-french`, 1280, 800, false);
    
    // Check for French text indicators
    const pageContent = await page.content();
    const hasFrenchContent = pageContent.includes('Télécharger') || 
                            pageContent.includes('Analysez') || 
                            pageContent.includes('Français');
    
    return {
      success: hasFrenchContent,
      message: hasFrenchContent ? 'Language switch to French successful' : 'Language switch failed',
      languages,
      screenshotUrl: page.url()
    };
    
  } catch (error) {
    console.error(`Error testing language feature at ${url}:`, error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Verify the staging deployment and take screenshots
 */
async function verifyStaging() {
  console.log('Verifying staging deployment...');
  
  // Take screenshots of main pages
  await takeScreenshot(STAGING_URL, 'staging-home', 1280, 800, false);
  await takeScreenshot(`${STAGING_URL}/my-list`, 'staging-my-list', 1280, 800, false);
  
  // Verify home page elements
  const homeResult = await verifyDeployment(STAGING_URL, SELECTORS.homePageElements);
  console.log('Home page verification result:', homeResult);
  
  // Verify my-list page elements
  const myListResult = await verifyDeployment(`${STAGING_URL}/my-list`, SELECTORS.myListPageElements);
  console.log('My List page verification result:', myListResult);
  
  // Verify language functionality
  const languageResult = await verifyLanguageFeature(STAGING_URL, 'staging');
  console.log('Language feature verification result:', languageResult);
  
  // Overall verification result
  const success = homeResult.success && myListResult.success && languageResult.success;
  
  return {
    url: STAGING_URL,
    success,
    details: {
      home: homeResult,
      myList: myListResult,
      language: languageResult
    }
  };
}

/**
 * Verify the production deployment and take screenshots
 */
async function verifyProduction() {
  console.log('Verifying production deployment...');
  
  // Take screenshots of main pages
  await takeScreenshot(PRODUCTION_URL, 'production-home', 1280, 800, false);
  await takeScreenshot(`${PRODUCTION_URL}/my-list`, 'production-my-list', 1280, 800, false);
  
  // Verify home page elements
  const homeResult = await verifyDeployment(PRODUCTION_URL, SELECTORS.homePageElements);
  console.log('Home page verification result:', homeResult);
  
  // Verify my-list page elements
  const myListResult = await verifyDeployment(`${PRODUCTION_URL}/my-list`, SELECTORS.myListPageElements);
  console.log('My List page verification result:', myListResult);
  
  // Verify language functionality
  const languageResult = await verifyLanguageFeature(PRODUCTION_URL, 'production');
  console.log('Language feature verification result:', languageResult);
  
  // Overall verification result
  const success = homeResult.success && myListResult.success && languageResult.success;
  
  return {
    url: PRODUCTION_URL,
    success,
    details: {
      home: homeResult,
      myList: myListResult,
      language: languageResult
    }
  };
}

/**
 * Main verification function that checks both environments
 */
async function verifyDeployments() {
  try {
    // Verify staging first
    const stagingResult = await verifyStaging();
    
    // Verify production
    const productionResult = await verifyProduction();
    
    return {
      staging: stagingResult,
      production: productionResult
    };
  } catch (error) {
    console.error('Error verifying deployments:', error);
    return {
      error: error.message
    };
  }
}

// Execute verification when run directly
if (require.main === module) {
  verifyDeployments()
    .then(results => {
      console.log('Verification Results:', JSON.stringify(results, null, 2));
      
      // Exit with appropriate code
      const success = results.staging?.success && results.production?.success;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyStaging,
  verifyProduction,
  verifyDeployments,
  STAGING_URL,
  PRODUCTION_URL
};