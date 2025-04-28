import { useState } from 'react';
import OpenAI from 'openai';

export default function TestWebSearch() {
  const [wine, setWine] = useState({
    name: '',
    producer: '',
    vintage: '',
    region: '',
    varietal: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWine(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Validate that at least name is provided
      if (!wine.name) {
        throw new Error('Wine name is required');
      }
      
      // Create a client-side OpenAI instance
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'YOUR_API_KEY_HERE',
        dangerouslyAllowBrowser: true // Only for testing!
      });
      
      const wineDescription = `${wine.vintage || ''} ${wine.producer || ''} ${wine.name || ''} ${wine.region || ''} ${wine.varietal || ''}`.trim();
      const searchQuery = `${wineDescription} wine review tasting notes rating`;
      
      // Use OpenAI's web search capability with gpt-4o-search-preview model
      const webSearchResponse = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {}, // Enable web search
        messages: [
          {
            role: "system",
            content: `You are a wine review expert. SEARCH THE WEB to find REAL reviews, ratings, and information about this wine: "${wineDescription}".
            
I want you to find text snippets about this wine from ANY reliable source - wine websites, auction sites, blogs, forums, etc. Don't limit yourself to just major publications, but find ANY text that discusses this wine online.

Format each review snippet with the source name followed by a colon, then the review text. Include score/rating if available.

IMPORTANT:
- Include ANY real text about this wine from ANY source on the web
- If you can't find exact reviews for this specific wine, use information about similar vintages or the winery
- The sources can be ANYTHING: wine retailers, blogs, forums, auction sites, winery descriptions - not just professional reviewers
- Include 3-6 different sources if possible
- Format as plain text with each snippet on a new line
- The format should be exactly: "Source: Review text" (example: "Wine Spectator: The 2018 Caymus Cabernet shows rich dark fruit...")
- I need REAL text from the web even if it's just short tasting notes or partial information`
          },
          {
            role: "user",
            content: `Find actual text snippets for this wine: ${searchQuery}. Search the web broadly and return ANY content you can find about this wine from ANY sources. I'm looking for REAL information from the web, not invented reviews. Be thorough in your search - this wine should have information online.`
          }
        ],
        max_tokens: 800
      });
      
      const content = webSearchResponse.choices[0]?.message?.content || '';
      
      setResults({
        success: true,
        snippets: content,
        wine: wine
      });
    } catch (error: any) {
      console.error('Error testing web search:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to format web snippets for display
  const formatSnippets = (snippets: string) => {
    if (!snippets) return [];
    
    return snippets
      .split('\n')
      .filter(line => line.trim() && line.includes(':'))
      .map((line, index) => {
        const [source, ...rest] = line.split(':');
        const content = rest.join(':').trim();
        return { source: source.trim(), content, id: index };
      });
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Client-Side Web Search Test</h1>
      
      <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
        <p className="font-bold">Note:</p>
        <p>This page tests the web search capability directly from the browser. It uses the OpenAI API key directly for testing purposes.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-100 p-4 rounded">
        <div className="mb-4">
          <label className="block mb-1">Wine Name (required)</label>
          <input
            type="text"
            name="name"
            value={wine.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="Enter wine name (e.g. Cheval Blanc)"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Producer/Winery</label>
            <input
              type="text"
              name="producer"
              value={wine.producer}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter producer"
            />
          </div>
          
          <div>
            <label className="block mb-1">Vintage</label>
            <input
              type="text"
              name="vintage"
              value={wine.vintage}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter vintage (e.g., 1979)"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Region</label>
            <input
              type="text"
              name="region"
              value={wine.region}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter region"
            />
          </div>
          
          <div>
            <label className="block mb-1">Varietal</label>
            <input
              type="text"
              name="varietal"
              value={wine.varietal}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter grape variety"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded text-white font-bold ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Searching the web...' : 'Test Web Search (Client-Side)'}
        </button>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Results</h2>
          
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p><strong>Status:</strong> {results.success ? 'Success' : 'Failed'}</p>
            <p><strong>Search Query:</strong> {wine.vintage} {wine.producer} {wine.name} {wine.region} {wine.varietal} wine review tasting notes rating</p>
          </div>
          
          {results.snippets && (
            <div className="mt-4">
              <h3 className="text-lg font-bold mb-2">Web Snippets</h3>
              
              {formatSnippets(results.snippets).length > 0 ? (
                <div className="space-y-4">
                  {formatSnippets(results.snippets).map((snippet: any) => (
                    <div key={snippet.id} className="p-3 bg-white border rounded shadow-sm">
                      <p className="font-bold text-blue-600">{snippet.source}</p>
                      <p className="mt-1">{snippet.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="italic mb-4">No formatted snippets found. Raw output:</p>
                  <pre className="p-3 bg-gray-100 rounded whitespace-pre-wrap text-sm">{results.snippets}</pre>
                </div>
              )}
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer p-2 bg-gray-200 rounded">Raw Response</summary>
            <pre className="mt-2 p-3 bg-gray-800 text-white rounded overflow-x-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}