// This is a dummy function to demonstrate Firebase Functions
import * as functions from 'firebase-functions';

export const dummyFunction = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    return {
      message: "This is a dummy function",
      timestamp: new Date().toISOString()
    };
  });

// Function for testing web snippets
export const testWebSnippets = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    return {
      message: "Web snippets test function",
      timestamp: new Date().toISOString(),
      snippets: ["Sample snippet 1", "Sample snippet 2"]
    };
  });