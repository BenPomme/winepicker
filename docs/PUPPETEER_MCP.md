# Puppeteer MCP for Automated Testing

This document outlines the setup and usage of Puppeteer MCP for automated testing in the MyWine application.

## Overview

Puppeteer MCP (Multi-Channel Protocol) is used for automated browser testing, allowing us to verify deployments and capture screenshots of the application in different states and environments.

## Setup

1. The Puppeteer MCP setup is located in the `scripts/mcp/` directory:
   - `setup-puppeteer-mcp.js`: Sets up the MCP environment
   - `start-puppeteer-mcp.sh`: Script to start the MCP service
   - `puppeteer-demo.js`: Example demonstrations

2. Logs are stored in:
   - `logs/mcp-puppeteer-*.log`: Current logs
   - `logs_backup/`: Backup of older logs

## Usage for Deployment Verification

Puppeteer MCP is particularly useful for verifying deployments, especially language selection functionality:

1. **Automated Language Testing**:
   ```javascript
   // Example code for testing language selection
   async function testLanguageSelection() {
     // Navigate to the app
     await page.goto('https://pickmywine-live.web.app/en/');
     
     // Find and click the language selector
     await page.click('.language-selector-button');
     
     // Select French
     await page.click('[data-lang="fr"]');
     
     // Verify URL changed to French version
     expect(page.url()).toContain('/fr/');
     
     // Verify content is in French
     const heading = await page.$eval('h1', el => el.textContent);
     expect(heading).toContain('Mon Vin');
   }
   ```

2. **Verifying PWA Manifest**:
   ```javascript
   async function testPWAManifest() {
     // Navigate to the app
     await page.goto('https://pickmywine-live.web.app/');
     
     // Check if manifest is loaded correctly
     const manifest = await page.evaluate(() => {
       const link = document.querySelector('link[rel="manifest"]');
       return link ? link.href : null;
     });
     
     console.log('Manifest URL:', manifest);
     
     // Test icon loading
     const iconRequests = await page.evaluate(() => {
       return performance.getEntriesByType('resource')
         .filter(r => r.name.includes('icon'))
         .map(r => ({ url: r.name, duration: r.duration }));
     });
     
     console.log('Icon requests:', iconRequests);
   }
   ```

## Comparing Environments

The `compare-environments.js` script uses Puppeteer MCP to compare staging and production environments:

1. It captures screenshots of both environments
2. Tests language selection functionality
3. Verifies PWA manifests and icons
4. Reports discrepancies between environments

## Troubleshooting Language Selection Issues

When troubleshooting language selection issues, use Puppeteer to:

1. Log browser console messages to detect JavaScript errors
2. Capture network requests to see if correct paths are being requested
3. Check redirects and navigation events
4. Verify DOM element presence and content after language changes

## Running Tests

To run tests using Puppeteer MCP:

```bash
# Start the MCP service
./scripts/mcp/start-puppeteer-mcp.sh

# Run verification tests
node scripts/verify-deployment.js

# Run targeted language tests
node scripts/test-language-selection.js
```

## Integration with Deployment Workflow

The deployment scripts (`deploy-staging.sh` and `deploy-production.sh`) integrate with Puppeteer MCP to automatically verify deployments:

1. Deploy the application
2. Run automated tests
3. Capture screenshots for visual verification
4. Log results for review

This integration ensures that language selection and other critical features are working correctly after each deployment.