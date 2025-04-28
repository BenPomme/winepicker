const fetch = require('node-fetch');
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to enable authentication providers
async function enableAuthProviders() {
  try {
    console.log('Enabling auth providers...');
    const projectId = serviceAccount.project_id;
    
    // Get an ID token for auth
    const token = await admin.auth().createCustomToken('auth-setup-user');
    
    // Enable Google Sign-in
    console.log('Enabling Google Sign-in...');
    const googleAuthUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
    
    // Configure Google auth
    const googleConfig = {
      signIn: {
        allowDuplicateEmails: false,
        enabled: true
      }
    };
    
    // Make API call to enable Google auth
    await fetch(googleAuthUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(googleConfig)
    });
    
    console.log('Authentication providers enabled successfully!');
  } catch (error) {
    console.error('Error enabling auth providers:', error);
  }
}

// Run the function
enableAuthProviders();