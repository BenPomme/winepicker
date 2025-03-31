import { useState } from 'react';
import Head from 'next/head';
import { Wine, UploadState } from '../utils/types';
import ImageUploader from '../components/ImageUploader';
import WineCard from '../components/WineCard';

export default function Home() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    isLoading: false,
    progress: 0,
    stage: ''
  });

  // Handle image upload and processing
  const handleImageUpload = async (base64Image: string) => {
    try {
      // Set loading state
      setUploadState({
        isLoading: true,
        progress: 0.1,
        stage: 'Preparing image for analysis...'
      });

      // Call the API route to analyze the wine image
      const response = await fetch('/api/analyze-wine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      // Update progress
      setUploadState({
        isLoading: true,
        progress: 0.3,
        stage: 'Analyzing image with AI...'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze wine image');
      }

      // Update progress
      setUploadState({
        isLoading: true,
        progress: 0.7,
        stage: 'Processing wine information...'
      });

      if (data.success && data.data?.wines) {
        // Sort wines by rating (highest first)
        const sortedWines = [...data.data.wines].sort(
          (a, b) => b.rating.score - a.rating.score
        );
        
        // Update wines state
        setWines(sortedWines);
        
        // Complete the loading state
        setUploadState({
          isLoading: false,
          progress: 1,
          stage: 'Complete!'
        });
      } else {
        throw new Error('No wine data received');
      }
    } catch (error) {
      console.error('Error analyzing wine image:', error);
      // Set error state
      setUploadState({
        isLoading: false,
        progress: 0,
        stage: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  return (
    <>
      <Head>
        <title>Wine Picker - AI Wine Analysis</title>
        <meta name="description" content="Get instant wine information using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background to-white">
        {/* Header */}
        <header className="glass-effect fixed top-0 left-0 right-0 z-50 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Wine Picker
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 pt-20 pb-8 max-w-5xl">
          {wines.length === 0 && !uploadState.isLoading && (
            <div className="text-center mb-8 mt-12">
              <h2 className="text-4xl font-bold text-background-dark mb-4">
                Discover Your Perfect Wine
              </h2>
              <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">
                Upload a photo of any wine label to get instant information, expert ratings, and detailed reviews.
              </p>
              <div className="glass-effect rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
                <ImageUploader
                  onUpload={handleImageUpload}
                  uploadState={uploadState}
                />
              </div>
            </div>
          )}

          {uploadState.isLoading && (
            <div className="text-center mt-12">
              <div className="glass-effect rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
                <ImageUploader
                  onUpload={handleImageUpload}
                  uploadState={uploadState}
                />
              </div>
            </div>
          )}

          {wines.length > 0 && !uploadState.isLoading && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-background-dark">
                  Your Wine Selection
                </h2>
                <button
                  onClick={() => {
                    setWines([])
                    setUploadState({ isLoading: false, progress: 0, stage: '' })
                  }}
                  className="btn-primary text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  Analyze New Wine
                </button>
              </div>

              <div className="grid gap-6">
                {wines.map((wine, index) => (
                  <WineCard
                    key={index}
                    wine={wine}
                    isFeatured={index === 0}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="glass-effect py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-secondary">
            <p>
              Wine Picker uses AI to analyze wine images and provide ratings and reviews.
              © {new Date().getFullYear()} Wine Picker
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}