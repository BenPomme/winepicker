const { verifyDeployment, takeScreenshot } = require('./take-screenshot');

// Deployment URLs
const STAGING_URL = 'https://winepicker-63daa.web.app';
const PRODUCTION_URL = 'https://pickmywine-live.web.app';

// Elements to check for various features
const SELECTORS = {
  // Home page selectors
  homePageElements: {
    uploadButton: 'input[type="file"]',
    myWineListLink: 'a[href="/my-list"]',
    appTitle: 'h1',
    mainContainer: '.container',
  },
  
  // My Wine List page selectors
  myListPageElements: {
    pageTitle: 'h1',
    mainContainer: '.container',
  },
  
  // Wine Card selectors (when wines are displayed)
  wineCardElements: {
    wineCard: '.bg-white, .shadow-md',
    wineName: 'h2',
    wineScore: '.font-bold',
  }
};

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
  
  // Overall verification result
  const success = homeResult.success && myListResult.success;
  
  return {
    url: STAGING_URL,
    success,
    details: {
      home: homeResult,
      myList: myListResult
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
  
  // Overall verification result
  const success = homeResult.success && myListResult.success;
  
  return {
    url: PRODUCTION_URL,
    success,
    details: {
      home: homeResult,
      myList: myListResult
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