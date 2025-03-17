# Web Implementation Guide

This document provides details about the web implementation of the Pick My Wine app, including key considerations and troubleshooting information.

## Flutter Web Setup

The web version of the app uses the following configuration:

- **Renderer**: Automatically selects between HTML and CanvasKit renderers based on device type
- **Service Worker**: Implemented for offline capabilities and caching
- **Loading Screen**: Custom HTML/CSS loading screen while Flutter initializes

## Key Files

- **web/index.html**: Contains the web initialization code and loading screen
- **web/manifest.json**: Web app manifest for PWA support
- **web/flutter_service_worker.js**: Generated service worker for offline capabilities

## Common Issues and Solutions

### Service Worker Initialization

If you encounter the error `serviceWorkerVersion is not defined`, ensure that:
- The Flutter template token `{{flutter_service_worker_version}}` is used in index.html
- The service worker registration is properly configured

### Flutter Loader Issues

For errors like `FlutterLoader.load requires _flutter.buildConfig to be set`:
- Make sure the Flutter initialization code in index.html follows the current API
- Use the proper loader configuration as shown below:

```javascript
window.addEventListener('load', function(ev) {
  // Initialize Flutter using the recommended approach
  _flutter = {
    loader: {
      serviceWorker: {
        serviceWorkerVersion: '{{flutter_service_worker_version}}',
      }
    }
  };
  
  // Load the Flutter app using the current API
  _flutter.loader.load({
    entrypoint: "main.dart.js",
    renderer: isMobile ? 'html' : 'canvaskit'
  });
});
```

### JSON Parsing from API Responses

When receiving responses from the OpenAI API:
- The app includes code to strip markdown formatting (```json and ```)
- Multiple sanitization steps are applied to ensure valid JSON
- Fallback to demo data is implemented if parsing fails

## Web-Specific Features

- **Responsive Design**: Adapts to different screen sizes
- **Mobile Detection**: Automatically detects mobile browsers for renderer selection
- **Custom Loading Screen**: Provides visual feedback during initialization
- **Error Handling**: Graceful fallbacks for various error conditions

## Testing the Web Version

To test the web version locally:
1. Run `flutter build web`
2. Navigate to the `build/web` directory
3. Start a local server: `python -m http.server 8000`
4. Open a browser and go to `http://localhost:8000`

## Deployment Considerations

- Ensure CORS headers are properly set if your API calls cross domains
- Consider using a CDN for faster loading of static assets
- Enable HTTPS for security and service worker functionality
- Set appropriate cache headers for optimal performance 