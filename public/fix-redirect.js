/**
 * Fix for Firebase hosting redirect loops
 * This script helps resolve issues with i18n static exports
 */
(function() {
  // Track if we've already handled a redirect to prevent loops
  const redirectAttempted = sessionStorage.getItem('redirectAttempted');
  
  // Get current URL and path
  const currentPath = window.location.pathname;
  
  // List of paths to never redirect
  const staticPaths = ['/_next/', '/static/', '/icons/', '/locales/', '/sw.js', '/manifest.json', 
                      '.js', '.json', '.css', '.ico', '.png', '.jpg', '.svg', '.webp'];
  
  // Check if path contains any static paths
  const isStaticResource = staticPaths.some(path => currentPath.includes(path));
  
  // Only redirect if not a static resource and we haven't attempted a redirect yet
  if (!isStaticResource && !redirectAttempted) {
    // Set flag to prevent redirect loops
    sessionStorage.setItem('redirectAttempted', 'true');
    
    // Root path redirect
    if (currentPath === '/' || currentPath === '') {
      console.log('Redirecting root to /en/');
      window.location.href = '/en/';
      return;
    }
    
    // Check for locale in URL
    const localeMatch = currentPath.match(/^\/(en|fr|zh|ar)(\/|$)/);
    
    if (!localeMatch) {
      // Detect browser language
      const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
      let targetLocale = 'en';
      
      // Map browser language to app locales
      if (browserLang.startsWith('fr')) {
        targetLocale = 'fr';
      } else if (browserLang.startsWith('zh')) {
        targetLocale = 'zh';
      } else if (browserLang.startsWith('ar')) {
        targetLocale = 'ar';
      }
      
      // Add the locale prefix to the path
      let newPath = `/${targetLocale}${currentPath}`;
      if (!newPath.endsWith('/') && !newPath.includes('.')) {
        newPath += '/';
      }
      
      console.log('Redirecting to localized path:', newPath);
      window.location.href = newPath;
    } else {
      // Valid locale path, make sure it ends with trailing slash for consistency
      if (!currentPath.endsWith('/') && !currentPath.includes('.')) {
        const newPath = `${currentPath}/`;
        console.log('Adding trailing slash for consistency:', newPath);
        window.location.href = newPath;
      } else {
        // Valid locale path with trailing slash, clear redirect flag
        console.log('Valid locale path detected:', localeMatch[1]);
        sessionStorage.removeItem('redirectAttempted');
      }
    }
  } else if (redirectAttempted) {
    // Reset the redirect flag to allow future redirects
    console.log('Redirect already attempted, clearing flag');
    sessionStorage.removeItem('redirectAttempted');
  }
})();