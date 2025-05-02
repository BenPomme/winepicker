/**
 * Injects the redirect fix script into all HTML files
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all HTML files
const htmlFiles = glob.sync(path.join(process.cwd(), 'out', '**', '*.html'));

console.log(`Found ${htmlFiles.length} HTML files to process`);

// Process each HTML file
htmlFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the script is already injected
    if (content.includes('fix-redirect.js')) {
      console.log(`Script already injected in ${file}`);
      return;
    }
    
    // Inject the script before the closing </head> tag
    const scriptTag = '<script src="/fix-redirect.js"></script>';
    content = content.replace('</head>', `${scriptTag}</head>`);
    
    // Write the file back
    fs.writeFileSync(file, content);
    console.log(`Injected redirect fix script into ${file}`);
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});

console.log('Script injection completed');