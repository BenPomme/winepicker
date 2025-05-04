/**
 * Check web URLs without using a browser
 */
const https = require('https');
const http = require('http');

// URLs to check
const baseUrl = 'https://winepicker-63daa.web.app';
const urls = [
  { path: '/', name: 'Root' },
  { path: '/en/', name: 'English' },
  { path: '/fr/', name: 'French' },
  { path: '/zh/', name: 'Chinese' },
  { path: '/ar/', name: 'Arabic' }
];

// Function to check a URL and follow redirects
function checkUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    
    function request(url) {
      console.log(`Checking URL: ${url}`);
      
      // Parse URL to determine if http or https
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'HEAD',
        headers: { 'User-Agent': 'URL-Checker/1.0' }
      };
      
      const req = client.request(url, options, (res) => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        
        // Check for redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirectCount++;
          console.log(`Redirect #${redirectCount} to: ${res.headers.location}`);
          
          if (redirectCount >= maxRedirects) {
            reject(new Error(`Too many redirects (${redirectCount})`));
            return;
          }
          
          // Handle relative redirects
          const nextUrl = new URL(res.headers.location, url).href;
          request(nextUrl);
        } else {
          resolve({
            url,
            status: res.statusCode,
            message: res.statusMessage,
            headers: res.headers,
            redirectCount
          });
        }
      });
      
      req.on('error', (error) => {
        console.error(`Error requesting ${url}: ${error.message}`);
        reject(error);
      });
      
      req.end();
    }
    
    request(url);
  });
}

// Check all URLs
async function checkAllUrls() {
  console.log('Starting URL checks...');
  
  for (const item of urls) {
    const url = baseUrl + item.path;
    console.log(`\nChecking ${item.name} URL: ${url}`);
    
    try {
      const result = await checkUrl(url);
      console.log(`Final result for ${item.name}:`);
      console.log(`- Final URL: ${result.url}`);
      console.log(`- Status: ${result.status} ${result.message}`);
      console.log(`- Redirects: ${result.redirectCount}`);
      console.log(`- Content-Type: ${result.headers['content-type'] || 'unknown'}`);
    } catch (error) {
      console.error(`Failed to check ${item.name}: ${error.message}`);
    }
  }
  
  console.log('\nAll URL checks completed.');
}

// Run the checks
checkAllUrls().catch(console.error);