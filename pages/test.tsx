import { useState, useEffect } from 'react';
import { testApiConnection } from '../utils/api-client';

export default function TestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run test immediately on page load
  useEffect(() => {
    // Use an IIFE to run test immediately
    (async () => {
      setLoading(true);
      setError(null);
      setTestResult(null);
      
      try {
        console.log('Starting API connection test...');
        const result = await testApiConnection();
        console.log('Test completed successfully:', result);
        setTestResult(result);
      } catch (err: any) {
        console.error('Test failed:', err);
        
        // Format error message for common issues
        let errorMsg = err.message || 'Test failed';
        
        if (errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
          errorMsg = 'Network error: Could not connect to Firebase Functions. This may be a CORS issue or the function may be offline.';
        } else if (errorMsg.includes('not a valid origin')) {
          errorMsg = 'CORS error: Firebase Functions rejected the request origin. Check your Firebase CORS configuration.';
        } else if (errorMsg.includes('Resource not found') || errorMsg.includes('404')) {
          errorMsg = 'Function not found: The specified callable function does not exist or is not deployed correctly.';
        } else if (errorMsg.includes('Permission denied') || errorMsg.includes('403')) {
          errorMsg = 'Permission denied: Your application does not have permission to call this function.';
        }
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log('Starting API connection test...');
      const result = await testApiConnection();
      console.log('Test completed successfully:', result);
      setTestResult(result);
    } catch (err: any) {
      console.error('Test failed:', err);
      
      // Format error message for common issues
      let errorMsg = err.message || 'Test failed';
      
      if (errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Network error: Could not connect to Firebase Functions. This may be a CORS issue or the function may be offline.';
      } else if (errorMsg.includes('not a valid origin')) {
        errorMsg = 'CORS error: Firebase Functions rejected the request origin. Check your Firebase CORS configuration.';
      } else if (errorMsg.includes('Resource not found') || errorMsg.includes('404')) {
        errorMsg = 'Function not found: The specified callable function does not exist or is not deployed correctly.';
      } else if (errorMsg.includes('Permission denied') || errorMsg.includes('403')) {
        errorMsg = 'Permission denied: Your application does not have permission to call this function.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <button 
        onClick={runTest}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Run API Test'}
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {testResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p><strong>Success!</strong> API connection is working</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <h2 className="font-bold">Test Details</h2>
        <p>This test checks connectivity to the Firebase Cloud Functions.</p>
        <p>It uses the callable function approach which should avoid CORS issues.</p>
      </div>
    </div>
  );
}