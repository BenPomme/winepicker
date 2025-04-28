import React, { useState } from 'react';
import Head from 'next/head';
import OpenAI from 'openai';

// Define Wine interface
interface Wine {
  name: string;
  vintage: string;
  producer: string;
  region: string;
  varietal: string;
  score: number;
  summary: string;
  noBSMode: boolean;
}

export default function NoBSModeDemo() {
  const [noBSMode, setNoBSMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Wine | null>(null);
  
  // Form fields state
  const [name, setName] = useState('Château Margaux');
  const [vintage, setVintage] = useState('2015');
  const [producer, setProducer] = useState('Château Margaux');
  const [region, setRegion] = useState('Bordeaux, France');
  const [varietal, setVarietal] = useState('Cabernet Sauvignon, Merlot');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const wineDescription = `${vintage} ${producer} ${name} ${region} ${varietal}`.trim();
      
      // Make API call to OpenAI directly from browser
      // IMPORTANT: This is for demo only - in production, NEVER expose your API key in the browser
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
      
      let prompt;
      if (noBSMode) {
        prompt = `You are a brutally honest, no-bullshit sommelier who doesn't care about wine industry politics. Based only on what you know about: ${wineDescription}, provide:
1. A blunt, crude, and honest single-paragraph summary of this wine's characteristics. Be ruthless and direct, use casual and occasionally crude language. Do NOT use wine critic jargon or pretentious language.
2. An HONEST rating on a scale of 0-100, where bad wines can score as low as 0 and only truly exceptional wines score 90+.

Return your response in JSON format: {"summary": "your summary here", "score": numerical_score}

If there's insufficient information, be honest about that too - don't make up flowery descriptions.`;
      } else {
        prompt = `You are a wine expert. Based only on what you know about the following wine: ${wineDescription}, please provide:
1. A sophisticated yet concise single-paragraph summary of the likely characteristics, flavors, and quality of this wine.
2. An estimated rating on a scale of 0-100.

Return your response in JSON format: {"summary": "your summary here", "score": numerical_score}

If there's insufficient information to make a judgment, provide a general description based on the varietal, region, or producer reputation if known.`;
      }
      
      // Get response from OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: noBSMode ? 0.9 : 0.7, // Higher temperature for No BS Mode
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0]?.message?.content || '{}';
      console.log('OpenAI response:', content);
      
      const jsonResult = JSON.parse(content);
      
      // Create wine object
      setResult({
        name,
        vintage,
        producer,
        region,
        varietal,
        score: jsonResult.score || (noBSMode ? 50 : 85),
        summary: jsonResult.summary || 'No summary available',
        noBSMode
      });
      
    } catch (error: any) {
      console.error('Error analyzing wine:', error);
      setError(error.message || 'Failed to analyze wine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Head>
        <title>No BS Wine Mode Demo</title>
        <meta name="description" content="Simple demo of the No BS Mode feature" />
      </Head>
      
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">No BS Wine Mode</h1>
          <p className="text-xl text-gray-600 mb-4">
            Compare standard and brutally honest wine ratings
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
          
          {noBSMode && (
            <div className="max-w-lg mx-auto mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Warning:</strong> No BS Mode provides brutally honest wine ratings (0-100 scale) and crude language. Not for the faint of heart!
            </div>
          )}
        </header>
        
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Wine Information</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Wine Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Vintage
                </label>
                <input
                  type="text"
                  value={vintage}
                  onChange={(e) => setVintage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Producer/Winery
                </label>
                <input
                  type="text"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Grape Varietal(s)
                </label>
                <input
                  type="text"
                  value={varietal}
                  onChange={(e) => setVarietal(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-4 rounded font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Wine'}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {result && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Analysis Result</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">
                {result.producer} {result.name} {result.vintage}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {result.region} • {result.varietal}
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${result.noBSMode ? 'text-red-600' : 'text-blue-600'}`}>
                  {result.score}
                </span>
                <span className="text-gray-500 ml-1">/ 100</span>
              </div>
              
              {result.noBSMode && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  No BS Rating
                </span>
              )}
            </div>
            
            <div className="mb-2">
              <h4 className={`font-semibold mb-1 ${result.noBSMode ? 'text-red-700' : 'text-gray-700'}`}>
                {result.noBSMode ? 'Honest Assessment' : 'Expert Summary'}
              </h4>
              <p className={`${result.noBSMode ? 'text-red-700' : 'text-gray-600'}`}>
                {result.summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}