import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import WineCard from '../components/WineCard';
import { Wine } from '../utils/types';

export default function TestNoBS() {
  const [noBSMode, setNoBSMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [wine, setWine] = useState<Wine | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !preview) {
      setError('Please select an image file');
      return;
    }
    
    setLoading(true);
    setError(null);
    setJobId(null);
    setWine(null);
    
    try {
      console.log('Submitting image with No BS Mode:', noBSMode);
      
      const response = await fetch('/api/analyze-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: preview,
          noBSMode
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        // Start polling for results
        startPolling(data.jobId);
      } else {
        throw new Error(data.message || 'Failed to start analysis');
      }
    } catch (error: any) {
      console.error('Error submitting image:', error);
      setError(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  // Start polling for results
  const startPolling = (id: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Set up polling
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/get-simple-result?jobId=${id}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Poll response:', data);
        
        if (data.status === 'completed') {
          // Process completed job
          clearInterval(interval);
          setPollingInterval(null);
          setLoading(false);
          
          if (data.result?.wines?.length > 0) {
            const wineData = data.result.wines[0];
            setWine({
              name: wineData.name,
              producer: wineData.producer,
              vintage: wineData.vintage,
              region: wineData.region,
              varietal: wineData.varietal,
              score: wineData.score,
              summary: wineData.summary,
              imageUrl: data.imageUrl || wineData.imageUrl,
              noBSMode: wineData.noBSMode
            });
          } else {
            setError('No wines detected in the image');
          }
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setLoading(false);
          setError(data.error || 'Analysis failed');
        }
      } catch (error: any) {
        console.error('Error polling for results:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    setPollingInterval(interval);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Head>
        <title>No BS Wine Analyzer</title>
        <meta name="description" content="Analyze wines with honesty" />
      </Head>
      
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">No BS Wine Analyzer</h1>
          <p className="text-xl text-gray-600 mb-4">
            Upload a wine image for analysis
          </p>
          
          <div className="inline-flex items-center justify-center">
            <div className="mr-3 text-red-700 font-medium">No BS Mode</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={noBSMode}
                onChange={() => setNoBSMode(!noBSMode)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto mb-8">
          {noBSMode && (
            <div className="mb-8 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Warning:</strong> No BS Mode provides brutally honest wine ratings (0-100 scale) and crude language. Not for the faint of heart!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Upload Wine Image
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full p-2 border border-gray-300 rounded"
                disabled={loading}
              />
            </div>
            
            {preview && (
              <div className="mb-4">
                <img 
                  src={preview} 
                  alt="Selected wine" 
                  className="max-h-64 mx-auto"
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className={`py-2 px-4 rounded font-medium ${
                loading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Wine'}
            </button>
          </form>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-4">
              <p className="text-gray-600">Analyzing wine image... This may take a moment.</p>
            </div>
          )}
          
          {wine && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Analysis Result</h2>
              <WineCard wine={wine} isFeatured={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}