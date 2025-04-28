# Firebase Deployment Guide

## Overview

This application is built using:
- Next.js (with static export)
- Firebase Hosting for static files
- Firebase Functions for API endpoints
- Firebase Storage for image storage
- Firebase Firestore for database

## Important API Configuration

The application uses Firebase Functions to handle API requests that would normally be handled by Next.js API routes. This is necessary because Firebase Hosting serves static files only and doesn't support server-side rendering.

### Key API Routes
- `/api/analyze-wine` - Analyzes wine images
- `/api/analyze-wine-openai` - Alternative endpoint (redirects to analyze-wine)
- `/api/get-analysis-result` - Gets analysis results by job ID

### API Client Configuration
The API client is configured to call Firebase Functions endpoints:
- Base URL: `https://us-central1-winepicker-63daa.cloudfunctions.net/nextApiHandler/api`

### Firebase Configuration
Firebase.json includes rewrites to route API requests to the correct function:
```json
"rewrites": [
  {
    "source": "/api/analyze-wine",
    "function": "nextApiHandler"
  },
  {
    "source": "/api/analyze-wine-openai",
    "function": "nextApiHandler"
  },
  {
    "source": "/api/get-analysis-result",
    "function": "nextApiHandler"
  },
  {
    "source": "/api/**",
    "function": "nextApiHandler"
  },
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

## Deployment Steps

1. Build the Next.js app:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   firebase deploy
   ```

3. Verify deployment:
   - Check Firebase Functions logs for API requests
   - Test image upload functionality
   - Verify data is being stored in Firestore

## Common Issues

1. **403 Errors or "Unexpected token" errors**: 
   - This happens when the app tries to call Next.js API routes directly instead of going through Firebase Functions.
   - Solution: Ensure all API calls use the Firebase Functions URL.

2. **CORS Errors**:
   - If you see errors like "Access to fetch at 'https://us-central1-project-id.cloudfunctions.net/nextApiHandler/api/analyze-wine' has been blocked by CORS policy"
   - Solution: Make sure your Firebase Function's CORS settings include your hosting domain
   - The API handler has been configured to allow requests from:
     - https://winepicker-63daa.web.app
     - https://winepicker-63daa.firebaseapp.com
     - http://localhost:3000

3. **Image Upload Issues**:
   - Check Firebase Storage permissions
   - Verify the correct bucket is being used

4. **Firebase Functions Logs**:
   - Check logs for errors: `firebase functions:log`

## Firebase Environment Setup

Make sure to set the following environment variables in Firebase Functions:
- OPENAI_API_KEY - Your OpenAI API key