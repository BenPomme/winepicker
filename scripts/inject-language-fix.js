/**
 * Injects the language fix script into all HTML files in the output directory
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../out');
const FIX_SCRIPT = '<script src="/fix-language.js"></script>';

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

// Function to inject script into HTML file
function injectScript(htmlFile) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  
  // Skip if already injected
  if (content.includes('fix-language.js')) {
    console.log(`Script already injected in ${htmlFile}`);
    return;
  }
  
  // Inject before closing body tag
  const modified = content.replace('</body>', `${FIX_SCRIPT}\n</body>`);
  
  // Write back to file
  fs.writeFileSync(htmlFile, modified);
  console.log(`Injected script into ${htmlFile}`);
}

// Main function
function main() {
  console.log('Finding HTML files in output directory...');
  const htmlFiles = findHtmlFiles(OUT_DIR);
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  // Inject script into each file
  htmlFiles.forEach(injectScript);
  
  console.log('Finished injecting language fix script');
}

main();