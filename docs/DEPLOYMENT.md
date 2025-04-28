# Deployment Process

## Environment Setup

1. Create a `.env` file in the project root with required variables
2. Create a `.env` file in the `functions` directory for Firebase Functions

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Testing

```bash
# Run tests
npm test

# Test API endpoints
node tests/api/test-connection.js
```

## Deployment to Firebase

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created and configured
- OpenAI API key

### Deployment Steps

1. Build the application
```bash
npm run build
```

2. Deploy Firebase Functions with secrets
```bash
cd functions
npm install
npm run build
firebase functions:config:set openai.apikey="YOUR_API_KEY"
firebase deploy --only functions
```

3. Deploy Firebase Hosting
```bash
firebase deploy --only hosting
```

4. Verify deployment
```bash
firebase functions:log
```

## Continuous Integration

We recommend setting up GitHub Actions for:
- Linting code
- Running tests
- Building the application
- Deploying to staging environments

## Production Releases

1. Tag release versions
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. Create release notes in GitHub
3. Deploy to production using the deploy script
```bash
./deploy-firebase.sh
```