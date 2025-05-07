import { useState } from 'react';
import Head from 'next/head';
import ImageUploader from '../components/ImageUploader';
import WineCard from '../components/WineCard';
import { Wine, UploadState } from '../utils/types';

export default function Home() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isLoading: false,
    error: null,
  });
  const [wineDataList, setWineDataList] = useState<Wine[]>([]);

  const handleImageUpload = async (base64Image: string) => {
    try {
      setUploadState({ isLoading: true, error: null });
      setWineDataList([]); // Clear previous results
      
      console.log("Sending image to API...");
      
      // Call the API to analyze the wine image
      const response = await fetch('/api/analyze-wine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Wine analysis result:', data);
      
      // Store the uploaded image for display
      const uploadedImageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      // Format each wine and add to the state
      if (data.wines && Array.isArray(data.wines)) {
        const formattedWines = data.wines.map((wineData: any) => {
          return {
            name: wineData.name || '',
            winery: wineData.producer || wineData.winery || '',
            year: wineData.vintage || wineData.year || '',
            region: wineData.region || '',
            grapeVariety: wineData.varietal || wineData.grapeVariety || '',
            type: wineData.type || '',
            imageUrl: wineData.imageUrl || '',
            uploadedImageUrl: uploadedImageUrl,
            score: wineData.score || 0,
            summary: wineData.summary || wineData.aiSummary || '',
            aiSummary: wineData.aiSummary || wineData.summary || '',
            rating: {
              score: wineData.score || 0,
              source: wineData.ratingSource || 'AI Analysis',
              review: wineData.summary || ''
            },
            additionalReviews: Array.isArray(wineData.additionalReviews) 
              ? wineData.additionalReviews.map((review: string | { review: string; rating?: number; source?: string }) => {
                  if (typeof review === 'string') {
                    return { review: review };
                  }
                  return review;
                })
              : []
          };
        });
        
        setWineDataList(formattedWines);
      } else if (data.name) {
        // Handle legacy single wine response
        const formattedWine: Wine = {
          name: data.name || '',
          winery: data.producer || data.winery || '',
          year: data.vintage || data.year || '',
          region: data.region || '',
          grapeVariety: data.varietal || data.grapeVariety || '',
          type: data.type || '',
          imageUrl: data.imageUrl || '',
          uploadedImageUrl: data.uploadedImageUrl || uploadedImageUrl,
          score: data.score || 0,
          summary: data.summary || data.aiSummary || '',
          aiSummary: data.aiSummary || data.summary || '',
          rating: {
            score: data.score || 0,
            source: data.ratingSource || 'AI Analysis',
            review: data.summary || ''
          },
          additionalReviews: Array.isArray(data.additionalReviews) 
            ? data.additionalReviews.map((review: string | { review: string; rating?: number; source?: string }) => {
                if (typeof review === 'string') {
                  return { review: review };
                }
                return review;
              })
            : []
        };
        
        setWineDataList([formattedWine]);
      } else {
        throw new Error('API returned no wine data');
      }
      
      setUploadState({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze wine image' 
      });
    }
  };

  return (
    <>
      <Head>
        <title>Pick My Wine</title>
        <meta name="description" content="AI-powered wine recommendations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Pick My Wine</h1>
            <p className="text-xl text-gray-600">
              Take a photo of a wine bottle or menu to get instant ratings and reviews
            </p>
          </header>
          
          <div className="max-w-4xl mx-auto">
            <ImageUploader 
              onUpload={handleImageUpload}
              uploadState={uploadState}
            />
            
            {uploadState.error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{uploadState.error}</span>
              </div>
            )}
            
            {wineDataList.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Analysis Results {wineDataList.length > 1 ? `(${wineDataList.length} wines found)` : ''}
                </h2>
                <div className="space-y-6">
                  {wineDataList.map((wine, index) => (
                    <WineCard 
                      key={`${wine.name}-${index}`} 
                      wine={wine} 
                      isFeatured={index === 0 && wineDataList.length > 1} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}