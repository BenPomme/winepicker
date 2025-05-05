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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze wine image');
      }
      
      console.log("API response:", data);
      setWineDataList(data.wines || []);
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
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Pick My Wine</h1>
            <p className="text-xl text-gray-600 mb-4">
              Take a photo of a wine bottle or menu to get instant ratings and reviews
            </p>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mx-auto max-w-2xl">
              <p className="text-sm">
                <strong>Note:</strong> This app uses your camera to analyze wine images in real-time. Please allow camera access when prompted.
                The analysis is powered by OpenAI's GPT-4 Vision API.
              </p>
            </div>
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