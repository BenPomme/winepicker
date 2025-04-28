import React from 'react';
import { isPlatformWeb } from '../utils/platform';

// Web-specific imports
import WebApp from '../pages/_app';

// React Native specific imports (these will only be used in native context)
let NativeApp: React.ComponentType | null = null;

// Dynamically import native components only when in native context
if (!isPlatformWeb()) {
  try {
    // This would be the entry point to your React Native navigation setup
    NativeApp = require('./NativeApp').default;
  } catch (e) {
    console.error('Error loading native components:', e);
  }
}

/**
 * AppContainer serves as the root component that decides whether to render
 * the web or native version of the app based on platform detection.
 */
const AppContainer: React.FC<any> = (props) => {
  if (isPlatformWeb()) {
    // Render the web application
    return <WebApp {...props} />;
  }
  
  // Render the native application if available
  if (NativeApp) {
    return <NativeApp {...props} />;
  }
  
  // Fallback when native components fail to load
  return (
    <div style={{ padding: 20 }}>
      <h1>Error Loading Application</h1>
      <p>The application could not be loaded. Please try again later.</p>
    </div>
  );
};

export default AppContainer;
