import React, { useState } from 'react';
import WineCard from '../components/WineCard';
import { Wine } from '../utils/types';

export default function TestNoBSMode() {
  const [noBSMode, setNoBSMode] = useState(false);
  
  // Create two sample wines - one with No BS Mode, one without
  const standardWine: Wine = {
    name: "Château Excellence 2018",
    producer: "Domaine des Cépages",
    vintage: "2018",
    region: "Bordeaux, France",
    varietal: "Cabernet Sauvignon, Merlot",
    imageUrl: "/placeholder-wine.jpg",
    score: 92,
    summary: "An exquisite expression of Bordeaux terroir with elegant tannins and perfect balance. Offers complex notes of black currant, cedar, and subtle leather, with excellent aging potential. A refined choice for special occasions.",
    noBSMode: false
  };
  
  const noBSWine: Wine = {
    name: "Château Excellence 2018",
    producer: "Domaine des Cépages",
    vintage: "2018",
    region: "Bordeaux, France",
    varietal: "Cabernet Sauvignon, Merlot",
    imageUrl: "/placeholder-wine.jpg",
    score: 58,
    summary: "Overpriced marketing BS. Tastes like any $15 cab-merlot blend with fancy packaging. Harsh tannins that'll dry your mouth out. They're charging for the label, not the wine. Skip it.",
    noBSMode: true
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">No BS Mode Demo</h1>
          <p className="text-xl text-gray-600">
            See the difference between standard and No BS Mode ratings
          </p>
        </header>
        
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center mb-6">
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
          
          {noBSMode && (
            <div className="mb-8 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Warning:</strong> No BS Mode provides brutally honest wine ratings (0-100 scale) and crude language. Not for the faint of heart!
            </div>
          )}
        </div>
        
        <div className="max-w-4xl mx-auto">
          <WineCard wine={noBSMode ? noBSWine : standardWine} isFeatured={true} />
        </div>
      </div>
    </div>
  );
}