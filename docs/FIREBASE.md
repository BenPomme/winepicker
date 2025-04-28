# Firebase Configuration Guide

## Project Structure

- **firebase.json**: Configuration file for Firebase services
- **firebaserc**: Associates your project directory with a Firebase project
- **storage.rules**: Rules for Firebase Storage
- **functions/**: Firebase Cloud Functions

## Environment Setup

1. Create a `.env` file in the `functions` directory:

```
OPENAI_API_KEY=your_openai_api_key_here
```

2. Never commit the `.env` file to version control

## Deploying Functions

To deploy Firebase Functions:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

To update environment variables:

```bash
firebase functions:config:set openai.apikey="YOUR_API_KEY"
```

## Deploying Hosting

To deploy to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

## Accessing Environment Variables in Functions

```javascript
// In your Firebase Functions
const apiKey = process.env.OPENAI_API_KEY || 
               firebase.config().openai.apikey;
```

## Testing Firebase Functions Locally

```bash
firebase emulators:start
```

## Common Issues

1. **Missing API Keys**: Ensure API keys are properly set in Firebase config
2. **Build Errors**: Make sure to build before deploying
3. **Permission Issues**: Verify Firebase Storage rules
4. **Deployment Failures**: Check Firebase deployment logs