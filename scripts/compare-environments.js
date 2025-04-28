const { verifyStaging, verifyProduction } = require('./verify-deployment');
const { captureUIComponents } = require('./screenshot-ui');
const fs = require('fs');
const path = require('path');

// Configuration
const SCREENSHOT_DIR = path.join(process.env.HOME, 'Desktop', 'wine-app-screenshots');
const REPORT_PATH = path.join(SCREENSHOT_DIR, 'comparison-report.json');

/**
 * Compare staging and production environments
 */
async function compareEnvironments() {
  console.log('Comparing staging and production environments...');
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  // Capture screenshots from both environments
  console.log('Capturing UI components from staging...');
  await captureUIComponents('staging');
  
  console.log('Capturing UI components from production...');
  await captureUIComponents('production');
  
  // Verify both environments
  console.log('Verifying staging deployment...');
  const stagingResult = await verifyStaging();
  
  console.log('Verifying production deployment...');
  const productionResult = await verifyProduction();
  
  // Compare the results
  const differences = compareResults(stagingResult, productionResult);
  
  // Generate a report
  const report = {
    timestamp: new Date().toISOString(),
    staging: stagingResult,
    production: productionResult,
    differences,
    summary: {
      totalDifferences: Object.keys(differences).length,
      stagingMissing: differences.stagingMissingElements?.length || 0,
      productionMissing: differences.productionMissingElements?.length || 0,
      featureParity: Object.keys(differences).length === 0
    }
  };
  
  // Save the report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Comparison report saved to ${REPORT_PATH}`);
  
  return report;
}

/**
 * Compare the verification results between environments
 */
function compareResults(stagingResult, productionResult) {
  const differences = {};
  
  // Compare home page elements
  const stagingHomeElements = stagingResult.details.home.elements;
  const productionHomeElements = productionResult.details.home.elements;
  
  // Find elements in staging but not in production
  const stagingMissingElements = [];
  Object.entries(productionHomeElements).forEach(([name, exists]) => {
    if (exists && (!stagingHomeElements[name] || !stagingHomeElements[name])) {
      stagingMissingElements.push(name);
    }
  });
  
  // Find elements in production but not in staging
  const productionMissingElements = [];
  Object.entries(stagingHomeElements).forEach(([name, exists]) => {
    if (exists && (!productionHomeElements[name] || !productionHomeElements[name])) {
      productionMissingElements.push(name);
    }
  });
  
  if (stagingMissingElements.length > 0) {
    differences.stagingMissingElements = stagingMissingElements;
  }
  
  if (productionMissingElements.length > 0) {
    differences.productionMissingElements = productionMissingElements;
  }
  
  return differences;
}

// Execute comparison when run directly
if (require.main === module) {
  compareEnvironments()
    .then(report => {
      console.log('Environment Comparison Summary:');
      console.log(`- Timestamp: ${report.timestamp}`);
      console.log(`- Total differences: ${report.summary.totalDifferences}`);
      console.log(`- Elements missing in staging: ${report.summary.stagingMissing}`);
      console.log(`- Elements missing in production: ${report.summary.productionMissing}`);
      console.log(`- Feature parity: ${report.summary.featureParity ? 'Yes' : 'No'}`);
      
      if (report.summary.featureParity) {
        console.log('Environments are in sync');
        process.exit(0);
      } else {
        console.log('Environments are out of sync. Check the report for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Comparison failed:', error);
      process.exit(1);
    });
}

module.exports = {
  compareEnvironments
};