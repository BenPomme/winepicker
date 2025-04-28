import React, { useState } from 'react';

const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23E5E7EB'/%3E%3C/svg%3E";

// Helper to generate star icons based on score (out of 100)
const renderStars = (score: number) => {
  const stars = [];
  const normalizedScore = Math.max(0, Math.min(100, score)); // Ensure score is 0-100
  const filledStars = Math.round(normalizedScore / 20); // 5 stars, each represents 20 points
  const hasHalfStar = (normalizedScore % 20) >= 10;

  for (let i = 1; i <= 5; i++) {
    if (i <= filledStars) {
      stars.push(<span key={i} className="text-yellow-400">&#9733;</span>); // Filled star
    } else if (i === filledStars + 1 && hasHalfStar) {
        // Basic half-star representation (adjust CSS if needed for better visuals)
        stars.push(
            <span key={i} className="relative inline-block text-yellow-400">
                &#9733; 
                <span className="absolute top-0 left-0 w-1/2 overflow-hidden text-gray-300">&#9733;</span>
            </span>
        );
    } else {
      stars.push(<span key={i} className="text-gray-300">&#9734;</span>); // Empty star
    }
  }
  return stars;
};

// Hardcoded test data
const testWine = {
  name: "Test Wine Name",
  winery: "Test Winery",
  year: "2020",
  region: "Test Region",
  grapeVariety: "Test Grape",
  score: 90,
  summary: "This is a test summary for the wine. It has notes of berry and oak with a smooth finish.",
  webSnippets: `Wine Enthusiast: Rich and complex with notes of blackberry and vanilla. The tannins are silky and the finish is long. 92 points.
Vivino: Dark fruits dominate with a hint of oak and spice. Medium-bodied with good structure.
Decanter: Elegant and well-balanced showing remarkable complexity for its price point. Notes of cherry and tobacco lead to a pleasant finish.`
};

// Parse the web snippets into structured data
const parseWebSnippets = (snippetsText: string): { source: string, snippet: string }[] => {
  const lines = snippetsText.split('\n').filter(line => line.trim().length > 5);
  
  return lines.map(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const source = line.substring(0, colonIndex).trim();
      const snippet = line.substring(colonIndex + 1).trim();
      return { source, snippet };
    }
    return { source: "Unknown Source", snippet: line.trim() };
  });
};

export default function TestPage2() {
  const [showSnippets, setShowSnippets] = useState(true);
  const webSnippets = parseWebSnippets(testWine.webSnippets);
  
  return (
    <div className="container mx-auto p-4 bg-background">
      <h1 className="text-3xl font-bold mb-6 text-center">Test Rendering Page</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:flex-shrink-0 p-4 flex items-center justify-center md:w-1/3">
            <img 
              className="h-48 w-full object-contain md:h-full md:w-48" 
              src="/placeholder-wine.jpg"
              alt="Test Wine"
            />
          </div>

          {/* Details Section */}
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
                  {testWine.winery}
                </div>
                <h2 className="block mt-1 text-lg leading-tight font-medium text-black">
                  {testWine.name}
                </h2>
                <p className="mt-1 text-gray-500 text-sm">
                  {testWine.year} · {testWine.region} · {testWine.grapeVariety}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <span className="text-xl font-bold text-gray-900">
                  {testWine.score}<span className="text-sm font-normal text-gray-500">/100</span>
                </span>
                <div className="mt-1 flex items-center justify-end">
                  {renderStars(testWine.score)} 
                </div>
                <p className="text-xs text-gray-500 mt-1">(AI Analysis)</p> 
              </div>
            </div>
            
            {/* AI Review Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-2">AI Review</h3>
              <p className="text-gray-600 text-sm">
                {testWine.summary} 
              </p>
            </div>

            {/* Web Snippets Section */} 
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Web Snippets</h3>
              <div className="mt-2 space-y-2">
                {webSnippets.map((snippet, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Source: {snippet.source}</p>
                    <p className="text-sm text-gray-700">&ldquo;{snippet.snippet}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-gray-600">
          This is a test page to verify component rendering.
        </p>
      </div>
    </div>
  );
}