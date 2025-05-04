/**
 * Injects both language scripts into all HTML files in the output directory
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../out');
const SCRIPTS = '<script src="/fix-language.js"></script><script src="/fix-locale.js"></script>';

// Function to recursively find all HTML files
function findHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recurse into subdirectory
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to inject scripts into HTML file
function injectScripts(htmlFile) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  
  // Check if scripts are already injected
  if (content.includes('fix-locale.js')) {
    console.log(`Scripts already injected in ${htmlFile}`);
    return;
  }
  
  // Replace previous fix-language.js script if it exists
  let modified;
  if (content.includes('fix-language.js')) {
    modified = content.replace('<script src="/fix-language.js"></script>', SCRIPTS);
  } else {
    // Inject before closing body tag
    modified = content.replace('</body>', `${SCRIPTS}\n</body>`);
  }
  
  // Write back to file
  fs.writeFileSync(htmlFile, modified);
  console.log(`Injected scripts into ${htmlFile}`);
}

// Main function
function main() {
  console.log('Finding HTML files in output directory...');
  const htmlFiles = findHtmlFiles(OUT_DIR);
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  // Inject scripts into each file
  htmlFiles.forEach(injectScripts);
  
  console.log('Finished injecting language scripts');
}

main();