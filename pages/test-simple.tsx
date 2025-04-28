import React, { useState } from 'react';
import Head from 'next/head';
import WineCard from '../components/WineCard';
import { Wine } from '../utils/types';

export default function TestSimple() {
  const [noBSMode, setNoBSMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wine, setWine] = useState<Wine | null>(null);
  
  // Predefined wine for easy testing
  const testWine = {
    name: "Château Margaux",
    vintage: "2015",
    producer: "Château Margaux",
    region: "Bordeaux, France",
    varietal: "Cabernet Sauvignon, Merlot"
  };

  // Handle form submission
  const handleAnalyzeClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Making API request with No BS Mode:', noBSMode);
      
      const response = await fetch('/api/analyze-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testWine,
          noBSMode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success && data.wine) {
        setWine({
          name: data.wine.name,
          producer: data.wine.producer,
          vintage: data.wine.vintage,
          region: data.wine.region,
          varietal: data.wine.varietal,
          score: data.wine.score,
          summary: data.wine.summary,
          imageUrl: '/placeholder-wine.jpg', // Use placeholder image
          noBSMode: data.wine.noBSMode
        });
      } else {
        throw new Error(data.message || 'Failed to analyze wine');
      }
    } catch (error: any) {
      console.error('Error analyzing wine:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Head>
        <title>Simple Wine Analysis Test</title>
        <meta name="description" content="Test OpenAI wine analysis with No BS Mode" />
      </Head>
      
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Simple No BS Mode Test</h1>
          <p className="text-xl text-gray-600 mb-4">
            Test OpenAI wine analysis with No BS Mode toggle
          </p>
          
          <div className="inline-flex items-center justify-center">
            <div className="mr-3 text-red-700 font-medium">No BS Mode</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={noBSMode}
                onChange={() => setNoBSMode(!noBSMode)}
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
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Test with Preset Wine</h2>
            <div className="mb-4">
              <p className="text-gray-700"><strong>Name:</strong> {testWine.name}</p>
              <p className="text-gray-700"><strong>Producer:</strong> {testWine.producer}</p>
              <p className="text-gray-700"><strong>Vintage:</strong> {testWine.vintage}</p>
              <p className="text-gray-700"><strong>Region:</strong> {testWine.region}</p>
              <p className="text-gray-700"><strong>Varietal:</strong> {testWine.varietal}</p>
            </div>
            
            <button
              onClick={handleAnalyzeClick}
              disabled={loading}
              className={`py-2 px-4 rounded font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Wine'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
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