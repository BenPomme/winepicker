# Deployment Process

## Environments

- **Staging**: https://winepicker-63daa.web.app
- **Production**: https://pickmywine-live.web.app

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

### Standard Deployment Steps

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

### Using Deployment Scripts

We have several scripts to simplify deployments:

```bash
# Deploy to staging
./deploy-staging.sh

# Deploy to production
./deploy-production.sh
```

### Direct Clone from Staging to Production (Recommended)

This is the most reliable method to ensure staging and production are identical:

```bash
# Make sure staging is working correctly first
# Then clone staging to production
firebase use winepicker-63daa
firebase hosting:clone winepicker-63daa:live pickmywine-live:live
```

This method directly copies the entire site configuration and content from staging to production without rebuilding, ensuring complete parity between environments.

## Verification After Deployment

After deployment, always verify:

1. Visit both staging and production sites
2. Test all supported languages (EN, FR, ZH, AR)
3. Verify functionality on the My Wine List page
4. Test image upload if applicable

## Troubleshooting Common Issues

### Too Many Redirects

If you encounter redirect loops:

1. Check the `trailingSlash` setting in firebase.json
2. Ensure redirects are properly configured
3. The fastest solution is to use the direct clone method

### Deployment Fails

If deployment fails:

1. Check console output for specific errors
2. Ensure you have the correct permissions
3. Verify the Firebase project is correctly configured

## Reference Builds

Current reference build: 2c23f0 (April 2025)

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
3. Deploy to production using either the script or direct clone method
```bash
./deploy-production.sh
# OR (preferred)
firebase hosting:clone winepicker-63daa:live pickmywine-live:live
```