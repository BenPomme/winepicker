/**
 * Optimize Firebase configuration for i18n
 */
const fs = require('fs');
const path = require('path');

// Firebase config path
const firebaseConfigPath = path.join(__dirname, '../firebase.json');

function optimizeFirebaseConfig() {
  console.log('Optimizing Firebase hosting configuration...');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    console.error('❌ firebase.json not found!');
    return;
  }
  
  try {
    // Read current config
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Process hosting configs
    if (config.hosting) {
      if (Array.isArray(config.hosting)) {
        config.hosting.forEach(site => {
          optimizeSiteConfig(site);
        });
      } else {
        optimizeSiteConfig(config.hosting);
      }
      
      // Write updated config
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Firebase config optimized successfully');
    } else {
      console.error('❌ No hosting configuration found in firebase.json');
    }
  } catch (error) {
    console.error('❌ Error updating Firebase config:', error);
  }
}

function optimizeSiteConfig(siteConfig) {
  // We need to fix the order of rewrites - most specific first
  if (siteConfig.rewrites && Array.isArray(siteConfig.rewrites)) {
    // Remove the catch-all rewrite temporarily
    const catchAllRewrites = siteConfig.rewrites.filter(rewrite => 
      rewrite.source === '**' || rewrite.source === '**/*'
    );
    
    // API rewrites should come first
    const apiRewrites = siteConfig.rewrites.filter(rewrite => 
      rewrite.source && rewrite.source.startsWith('/api/')
    );
    
    // Locale-specific rewrites
    const localeRewrites = siteConfig.rewrites.filter(rewrite => 
      rewrite.source && (
        rewrite.source.startsWith('/en/') || 
        rewrite.source.startsWith('/fr/') || 
        rewrite.source.startsWith('/zh/') || 
        rewrite.source.startsWith('/ar/') ||
        rewrite.source === '/en' ||
        rewrite.source === '/fr' ||
        rewrite.source === '/zh' ||
        rewrite.source === '/ar'
      )
    );
    
    // Other specific rewrites that aren't api, locale or catch-all
    const otherRewrites = siteConfig.rewrites.filter(rewrite => 
      !apiRewrites.includes(rewrite) && 
      !localeRewrites.includes(rewrite) && 
      !catchAllRewrites.includes(rewrite)
    );
    
    // Reorder rewrites: API first, then locale-specific, then others, catch-all last
    siteConfig.rewrites = [
      ...apiRewrites,
      ...localeRewrites,
      ...otherRewrites,
      ...catchAllRewrites
    ];
    
    console.log(`Reordered ${siteConfig.rewrites.length} rewrites`);
  }
  
  // Fix trailing slash setting - should be true for Next.js static exports with i18n
  siteConfig.trailingSlash = true;
  
  // Ensure cleanUrls is false to prevent auto-redirects
  siteConfig.cleanUrls = false;
  
  console.log('✅ Site config optimized');
}

// Execute the optimization
optimizeFirebaseConfig();