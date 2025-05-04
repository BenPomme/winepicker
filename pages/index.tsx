import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import ImageUploader from '../components/ImageUploader';
import ProcessingStatus from '../components/ProcessingStatus';
import WineList from '../components/WineList';
import LanguageSelector from '../components/LanguageSelector';
import AuthButton from '../components/AuthButton';
import UserProfileDropdown from '../components/UserProfileDropdown';
import InstallPWA from '../components/InstallPWA';
import { Wine, UploadState, UserPreferences, ProcessingState, ProcessingStep } from '../utils/types';
import { analyzeWineImage, getAnalysisResult } from '../utils/api-client';
import { addToPersonalList } from '../utils/personalWineList';
import { useAuth } from '../utils/authContext';
import { initProcessingState, updateProcessingState } from '../utils/processing-manager';

// Client-side only component for the demo button
const DemoProcessingButton = dynamic(
  () => import('../components/DemoProcessingButton'),
  { ssr: false }
);

// Add a polling status type
type PollingStatus = 'idle' | 'polling' | 'completed' | 'failed';

function Home() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { currentUser } = useAuth();
  // Old upload state for backward compatibility
  const [uploadState, setUploadState] = useState<UploadState>({
    isLoading: false,
    error: null,
    useSimpleUI: false // Use detailed UI by default
  });
  
  // New processing state for detailed progress tracking
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentStep: ProcessingStep.UPLOADING,
    progress: 0,
    stepProgress: 0,
    statusMessage: '',
    error: null
  });
  
  const [wineDataList, setWineDataList] = useState<Wine[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>('idle');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to hold interval ID
  const [isRestaurantMenu, setIsRestaurantMenu] = useState<boolean>(false);
  
  // Add router event listeners to clear intervals and state during navigation
  useEffect(() => {
    // Function to clear all intervals and reset state
    const handleRouteChange = (url: string) => {
      console.log(`Home: Navigation to ${url} - clearing states and intervals`);
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      // Clear global intervals
      if (typeof window !== 'undefined') {
        // Clear progress animation interval
        // @ts-ignore - custom property for storing interval ID
        if (window.progressInterval) {
          // @ts-ignore
          clearInterval(window.progressInterval);
          // @ts-ignore
          window.progressInterval = null;
        }
        
        // Clear polling interval
        // @ts-ignore - custom property for storing interval ID
        if (window.pollingInterval) {
          // @ts-ignore
          clearInterval(window.pollingInterval);
          // @ts-ignore
          window.pollingInterval = null;
        }
      }
      
      // Reset all states
      setProcessingState(initProcessingState());
      setUploadState({
        isLoading: false,
        error: null,
        useSimpleUI: false
      });
      setPollingStatus('idle');
      setJobId(null);
    };
    
    // Add route change event listeners
    router.events.on('routeChangeStart', handleRouteChange);
    
    // Clean up event listener on component unmount
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  
  // Handlers for personal wine list
  const handleAddToList = async (wine: Wine) => {
    try {
      // If user is logged in, use their ID
      await addToPersonalList(wine, currentUser?.uid);
    } catch (error) {
      console.error('Error adding wine to list:', error);
    }
  };

  // --- Enhanced Polling Logic with Detailed Progress --- 
  // Set up a continuous progress animation for the demo
  useEffect(() => {
    if (processingState.isProcessing && !pollingIntervalRef.current) {
      // Create an interval to update the progress smoothly
      const progressInterval = setInterval(() => {
        setProcessingState(state => {
          // Don't update if processing is done
          if (!state.isProcessing) {
            clearInterval(progressInterval);
            return state;
          }
          
          // Update progress incrementally
          const updatedState = updateProcessingState(
            state,
            undefined, // No backend status for client updates
            null,
            true // Flag as client-side update
          );
          
          // Also update the old upload state for compatibility
          setUploadState(prevState => ({
            ...prevState,
            isLoading: true,
            progress: updatedState.progress,
            stage: updatedState.statusMessage
          }));
          
          return updatedState;
        });
      }, 500); // Update every 500ms for smooth animation
      
      // Store reference for cleanup
      if (typeof window !== 'undefined') {
        // @ts-ignore - custom property for storing interval ID
        window.progressInterval = progressInterval;
      }
      
      // Clean up
      return () => {
        clearInterval(progressInterval);
        if (typeof window !== 'undefined') {
          // @ts-ignore - custom property for storing interval ID
          window.progressInterval = null;
        }
      };
    }
  }, [processingState.isProcessing]);
  
  useEffect(() => {
    // Function to check job status with detailed progress
    const checkJobStatus = async () => {
      if (!jobId) return;
      console.log(`Polling for Job ID: ${jobId}`);
      try {
        const result = await getAnalysisResult(jobId);
        console.log("Polling result:", result);

        // Extract the status from the response
        const status = result && typeof result === 'object' && 'status' in result ? result.status : 'unknown';
        
        // IMPORTANT: Don't completely replace the processing state from a server update
        // This would overwrite our smooth client-side animation progress
        // Instead, just update the step and other properties, but keep the progress calculation
        // from our continuous animation
        
        // If the job is completed, stop animation and show results
        if (status === 'completed') {
          console.log("Job completed!");
          
          // Clear the progress animation interval
          if (typeof window !== 'undefined') {
            // @ts-ignore - custom property for storing interval ID
            if (window.progressInterval) {
              // @ts-ignore
              clearInterval(window.progressInterval);
              // @ts-ignore
              window.progressInterval = null;
            }
          }
          
          // Set completed state
          setProcessingState(state => ({
            ...state,
            isProcessing: false,
            currentStep: ProcessingStep.COMPLETED,
            progress: 100,
            stepProgress: 100,
            statusMessage: 'Processing complete'
          }));
          
          setUploadState({
            isLoading: false,
            error: null,
            progress: 100,
            stage: 'Processing complete',
            useSimpleUI: false
          });
          
          setPollingStatus('completed');
          setJobId(null); // Clear job ID
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Format and set results
          const resultWithData = result as { status: string; data?: { wines?: any[]; imageUrl?: string; }; };
          if (resultWithData.data?.wines && Array.isArray(resultWithData.data.wines)) {
            console.log('Wine API response data:', JSON.stringify(resultWithData.data));
            
            // Find the original uploaded image URL if stored, or use placeholder
            const uploadedImageUrl = resultWithData.data.imageUrl || '/placeholder-wine.jpg';

            const formattedWines = resultWithData.data.wines.map((wineData: any) => {
                // NOTE: Ensure this mapping matches the structure returned by the API
                 return {
                    name: wineData.name || '',
                    winery: wineData.producer || wineData.winery || '',
                    year: wineData.vintage || wineData.year || '',
                    region: wineData.region || '',
                    grapeVariety: wineData.grapeVarieties || wineData.varietal || '',
                    type: wineData.type || '',
                    imageUrl: wineData.imageUrl || uploadedImageUrl, 
                    uploadedImageUrl: uploadedImageUrl,
                    score: wineData.score || 0,
                    summary: wineData.tastingNotes || wineData.summary || '', // Try both fields
                    webSnippets: wineData.webSnippets || 'No web results found.', // Map actual snippets
                    rating: {
                      score: wineData.score || 0, 
                      source: wineData.ratingSource || 'AI Analysis',
                      review: wineData.tastingNotes || wineData.summary || '' 
                    },
                    additionalReviews: [],
                    // Additional fields for the recommendation system
                    pairings: wineData.pairings || [],
                    estimatedPrice: wineData.estimatedPrice || '',
                    valueRatio: wineData.valueRatio || 5,
                    valueAssessment: wineData.valueAssessment || '',
                    flavorProfile: wineData.flavorProfile || {},
                    isFromMenu: wineData.isFromMenu || false,
                  };
            });
            setWineDataList(formattedWines);
            
            // Check if this appears to be a restaurant menu based on multiple wines from the same source
            setIsRestaurantMenu(formattedWines.length > 2 && formattedWines.some((wine: Wine) => wine.isFromMenu));
          } else {
             throw new Error('Completed job missing wine data');
          }
        } else if (status === 'failed' || status === 'trigger_failed' || status === 'not_found') {
          // On failure, clear all intervals and show error
          console.error("Job failed or not found:", status);
          
          // Clear the progress animation interval
          if (typeof window !== 'undefined') {
            // @ts-ignore - custom property for storing interval ID
            if (window.progressInterval) {
              // @ts-ignore
              clearInterval(window.progressInterval);
              // @ts-ignore
              window.progressInterval = null;
            }
          }
          
          // Update error state
          setProcessingState(state => ({
            ...state,
            isProcessing: false,
            currentStep: ProcessingStep.FAILED,
            progress: 100,
            stepProgress: 100,
            statusMessage: 'Processing failed',
            error: status === 'not_found' 
              ? 'Job not found or expired' 
              : (result as any)?.data?.error || 'Analysis failed'
          }));
          
          setUploadState({
            isLoading: false,
            error: status === 'not_found' 
              ? 'Job not found or expired' 
              : (result as any)?.data?.error || 'Analysis failed',
            useSimpleUI: false
          });
          
          setPollingStatus('failed');
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else {
          // Still processing - update the currentStep based on status, but don't replace
          // the entire state, so our animation can continue independently
          
          console.log(`Job status: ${status}, continuing poll...`);
          setPollingStatus('polling'); // Ensure status reflects polling
          
          // Update processing step based on backend status - don't touch progress amount
          setProcessingState(state => {
            // Map backend status to steps
            let newStep = state.currentStep;
            
            if (status === 'uploading') {
              newStep = ProcessingStep.UPLOADING;
            } else if (status === 'processing' || status === 'processing_started') {
              if (state.currentStep === ProcessingStep.UPLOADING) {
                newStep = ProcessingStep.ANALYZING;
              } else if (state.currentStep === ProcessingStep.ANALYZING && 
                state.stepProgress > 70) {
                newStep = ProcessingStep.GENERATING;
              } else if (state.currentStep === ProcessingStep.GENERATING &&
                state.stepProgress > 80) {
                newStep = ProcessingStep.FORMATTING;
              }
            }
            
            // Only update the step, leave the progress animation to run
            return {
              ...state,
              currentStep: newStep,
              jobId
            };
          });
        }

      } catch (error) {
        console.error('Error during polling:', error);
        
        // Clear the progress animation interval
        if (typeof window !== 'undefined') {
            // @ts-ignore - custom property for storing interval ID
            if (window.progressInterval) {
              // @ts-ignore
              clearInterval(window.progressInterval);
              // @ts-ignore
              window.progressInterval = null;
            }
        }
        
        // Update both processing and upload states on error
        setProcessingState(state => ({
          ...state,
          isProcessing: false,
          currentStep: ProcessingStep.FAILED,
          error: error instanceof Error ? error.message : 'Polling error occurred'
        }));
        
        setUploadState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Polling error occurred',
          useSimpleUI: false
        });
        
        setPollingStatus('failed');
        setJobId(null);
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    // Start polling if we have a jobId and status is processing/polling
    if (jobId && (pollingStatus === 'polling' || pollingStatus === 'idle')) {
       // Clear any existing interval before starting a new one
       if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
       }
       
       // Initial check immediately, then set interval for server polls
       checkJobStatus(); 
       pollingIntervalRef.current = setInterval(checkJobStatus, 3000); // Poll every 3 seconds for more responsive UI
       
       // Also store the interval in window for easy cleanup between pages
       if (typeof window !== 'undefined') {
         // @ts-ignore - custom property for storing interval ID
         window.pollingInterval = pollingIntervalRef.current;
       }
       
       setPollingStatus('polling'); // Explicitly set status
    }

    // Cleanup function to clear interval when component unmounts or jobId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        
        // Also clear from window
        if (typeof window !== 'undefined') {
          // @ts-ignore - custom property for storing interval ID
          window.pollingInterval = null;
        }
        
        console.log("Polling interval cleared.");
      }
    };
  }, [jobId, pollingStatus]); // Rerun effect if jobId or pollingStatus changes


  const handleImageUpload = async (base64Image: string) => {
    // IMPORTANT: Start animation and setup immediately, before any async operations
    
    // Reset all states
    setWineDataList([]); // Clear previous results
    setJobId(null); // Clear previous job ID
    setPollingStatus('idle'); // Reset polling status
    
    // Clear any existing intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Clear any existing progress animation interval
    if (typeof window !== 'undefined') {
      // @ts-ignore - custom property for storing interval ID
      if (window.progressInterval) {
        // @ts-ignore
        clearInterval(window.progressInterval);
        // @ts-ignore
        window.progressInterval = null;
      }
    }
    
    // Initialize processing state with default values
    const newProcessingState = initProcessingState();
    setProcessingState(newProcessingState);
    
    // Update upload state for backward compatibility - SET THIS FIRST
    setUploadState({ 
      isLoading: true, 
      error: null,
      progress: newProcessingState.progress,
      stage: newProcessingState.statusMessage,
      useSimpleUI: false
    });
    
    // IMMEDIATELY set up a progress animation interval that runs independently
    // This will update the progress bar every 500ms, whether or not we have a server response
    const progressAnimationInterval = setInterval(() => {
      setProcessingState(state => {
        // Don't update if we're no longer processing
        if (!state.isProcessing) {
          clearInterval(progressAnimationInterval);
          return state;
        }
        
        // Calculate the next progress based on current state
        const updatedState = updateProcessingState(
          state,
          undefined, // No backend status for client updates
          null,
          true // Flag as client-side update
        );
        
        // Also update the upload state for compatibility
        setUploadState(prevState => ({
          ...prevState,
          isLoading: true,
          progress: updatedState.progress,
          stage: updatedState.statusMessage
        }));
        
        return updatedState;
      });
    }, 500); // Update frequently for smoother animation
    
    // Store reference to the interval for cleanup
    if (typeof window !== 'undefined') {
      // @ts-ignore - custom property for storing interval ID
      window.progressInterval = progressAnimationInterval;
    }
    
    // Update initial progress state immediately
    setProcessingState(state => ({
      ...state,
      stepProgress: 10, // Start progress right away
      statusMessage: 'Processing your image...'
    }));
    
    try {
      // Get current locale from router
      const locale = router.locale || 'en';

      // Update progress before API call
      setProcessingState(state => ({
        ...state,
        stepProgress: 30,
        statusMessage: 'Sending image data...'
      }));
      
      // Submit image analysis request using Firebase callable function
      console.log(`Submitting image analysis request in locale: ${locale}...`);
      
      // Pass locale to the API for proper translation of wine descriptions
      const responseData = await analyzeWineImage(base64Image, locale);
      console.log('API response received:', responseData);

      // Update progress after upload completes
      setProcessingState(state => ({
        ...state,
        stepProgress: 90, // 90% through upload step
        statusMessage: 'Upload complete, preparing analysis...'
      }));

      // Type assertion for response data
      const typedResponse = responseData as { 
        jobId?: string; 
        status?: string; 
        data?: { wines?: any[]; imageUrl?: string; }; 
      };

      // Get the job ID from the response
      const jobId = typedResponse.jobId;
      
      console.log('Received Job ID:', jobId);

      if (!jobId) {
        // Clear the progress animation interval if no job ID
        if (typeof window !== 'undefined') {
          // @ts-ignore - custom property for storing interval ID
          if (window.progressInterval) {
            // @ts-ignore
            clearInterval(window.progressInterval);
            // @ts-ignore
            window.progressInterval = null;
          }
        }
        throw new Error('No job ID received from server');
      }
      
      // If the response already includes completed data, process immediately
      if (typedResponse.status === 'completed' && typedResponse.data?.wines) {
        // Progress through the steps quickly
        
        // Analyzing step
        setProcessingState(state => ({
          ...state,
          jobId,
          currentStep: ProcessingStep.ANALYZING,
          progress: 35,
          stepProgress: 70,
          statusMessage: t('processing.analyzing')
        }));
        
        // After a short delay, show generating step
        setTimeout(() => {
          setProcessingState(state => ({
            ...state,
            currentStep: ProcessingStep.GENERATING,
            progress: 60,
            stepProgress: 70,
            statusMessage: t('processing.generating')
          }));
          
          // After another short delay, show formatting step
          setTimeout(() => {
            setProcessingState(state => ({
              ...state,
              currentStep: ProcessingStep.FORMATTING,
              progress: 85,
              stepProgress: 80,
              statusMessage: t('processing.formatting')
            }));
            
            // Finally mark as complete
            setTimeout(() => {
              // Clear the progress animation interval
              if (typeof window !== 'undefined') {
                // @ts-ignore - custom property for storing interval ID
                if (window.progressInterval) {
                  // @ts-ignore
                  clearInterval(window.progressInterval);
                  // @ts-ignore
                  window.progressInterval = null;
                }
              }
              
              setProcessingState(state => ({
                ...state,
                isProcessing: false,
                currentStep: ProcessingStep.COMPLETED,
                progress: 100,
                stepProgress: 100,
                statusMessage: 'Processing complete'
              }));
              
              // Format wine data for display
              const wines = typedResponse.data!.wines!.map((wineData: any) => ({
                name: wineData.name || '',
                winery: wineData.producer || wineData.winery || '',
                year: wineData.vintage || wineData.year || '',
                region: wineData.region || '',
                grapeVariety: wineData.grapeVarieties || wineData.varietal || '',
                type: wineData.type || '',
                imageUrl: wineData.imageUrl || '', 
                uploadedImageUrl: typedResponse.data!.imageUrl || '',
                score: wineData.score || 0,
                summary: wineData.tastingNotes || '', // Concise review
                webSnippets: wineData.webSnippets || 'No web results found.', // Map actual snippets
                rating: {
                  score: wineData.score || 0, 
                  source: wineData.ratingSource || 'AI Analysis',
                  review: wineData.tastingNotes || '' 
                },
                // Enhanced data for the recommendation system
                pairings: wineData.pairings || [],
                estimatedPrice: wineData.estimatedPrice || '',
                valueRatio: wineData.valueRatio || 5,
                valueAssessment: wineData.valueAssessment || '',
                flavorProfile: wineData.flavorProfile || {},
                isFromMenu: wineData.isFromMenu || false,
                additionalReviews: [] 
              }));
              
              setWineDataList(wines);
              setPollingStatus('completed');
              setUploadState({ isLoading: false, error: null, useSimpleUI: false });
            }, 1000);
          }, 1000);
        }, 1000);
        
        return;
      }
      
      // Normal flow - update processing state with jobId and move to analyzing step
      setProcessingState(state => ({
        ...state,
        jobId,
        currentStep: ProcessingStep.ANALYZING, // Move to analyzing step
        progress: 25, // Lower initial progress for analyzing step to show smoother transition
        stepProgress: 10, // Start of the analyzing step
        statusMessage: t('processing.analyzing')
      }));
      
      // Start polling with the job ID - our animation will continue independently
      setJobId(jobId);
      setPollingStatus('polling');
      
      // Now handle the demo mode for staging environment only - not in production
      const isInStagingEnv = typeof window !== 'undefined' && (
        window.location.hostname.includes('winepicker-63daa') || 
        window.location.hostname === 'localhost' ||
        window.location.hostname.includes('127.0.0.1')
      );
      
      if (isInStagingEnv) {
        console.log('Running demo animation for staging environment');
        
        // The regular progress animation interval will continue running
        // We just need to advance through the steps with timeouts
        setTimeout(() => {
          setProcessingState(state => ({
            ...state,
            currentStep: ProcessingStep.GENERATING,
            progress: 50,
            stepProgress: 30,
            statusMessage: t('processing.generating')
          }));
          
          setTimeout(() => {
            setProcessingState(state => ({
              ...state,
              currentStep: ProcessingStep.FORMATTING,
              progress: 80,
              stepProgress: 50,
              statusMessage: t('processing.formatting')
            }));
            
            setTimeout(() => {
              // Clear the animation interval
              if (typeof window !== 'undefined') {
                // @ts-ignore - custom property for storing interval ID
                if (window.progressInterval) {
                  // @ts-ignore
                  clearInterval(window.progressInterval);
                  // @ts-ignore
                  window.progressInterval = null;
                }
              }
              
              setProcessingState(state => ({
                ...state,
                isProcessing: false,
                currentStep: ProcessingStep.COMPLETED,
                progress: 100,
                stepProgress: 100,
                statusMessage: 'Processing complete'
              }));
              
              // Format wine data for display with mock data
              const mockWineData = [
                {
                  name: 'Château Margaux 2015',
                  winery: 'Château Margaux',
                  year: '2015',
                  region: 'Bordeaux, France',
                  grapeVariety: 'Cabernet Sauvignon, Merlot',
                  type: 'Red',
                  score: 96,
                  summary: 'Elegant and complex with dark fruit notes and a long finish.',
                  imageUrl: '',
                  rating: { score: 96, source: 'AI Analysis', review: 'Elegant and complex with dark fruit notes and a long finish.' },
                  pairings: ['Beef', 'Lamb', 'Strong Cheese'],
                  estimatedPrice: '$800-950',
                  valueRatio: 8,
                  valueAssessment: 'Premium investment wine with excellent aging potential',
                  flavorProfile: { body: 5, acidity: 4, tannin: 5, sweetness: 1 },
                  isFromMenu: false,
                  additionalReviews: []
                }
              ];
              
              setWineDataList(mockWineData);
              setPollingStatus('completed');
              setUploadState({ isLoading: false, error: null, useSimpleUI: false });
            }, 2500);
          }, 3000);
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Clear any progress animation interval on error
      if (typeof window !== 'undefined') {
        // @ts-ignore - custom property for storing interval ID
        if (window.progressInterval) {
          // @ts-ignore
          clearInterval(window.progressInterval);
          // @ts-ignore
          window.progressInterval = null;
        }
      }
      
      // Update both processing and upload states on error
      setProcessingState(state => ({
        ...state,
        isProcessing: false,
        currentStep: ProcessingStep.FAILED,
        error: error.message || 'Failed to upload image'
      }));
      
      setUploadState({ 
        isLoading: false, 
        error: error.message || 'Failed to upload image',
        useSimpleUI: false
      });
      
      setPollingStatus('idle');
    }
  };

  // --- UI Rendering --- 
  return (
    <>
      <Head>
        <title>{t('appName')}</title>
        <meta name="description" content="AI-powered wine recommendations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="py-6 border-b border-border">
          <div className="container-padded">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-display font-bold gradient-text">{t('appName')}</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/my-list" 
                  className="btn btn-secondary btn-sm"
                  id="my-wine-list-link"
                  onClick={() => {
                    // Explicitly clear any polling or intervals when navigating away
                    if (pollingIntervalRef.current) {
                      clearInterval(pollingIntervalRef.current);
                      pollingIntervalRef.current = null;
                    }
                    
                    // Clear progress interval
                    if (typeof window !== 'undefined') {
                      // @ts-ignore - custom property for storing interval ID
                      if (window.progressInterval) {
                        // @ts-ignore
                        clearInterval(window.progressInterval);
                        // @ts-ignore
                        window.progressInterval = null;
                      }
                    }
                    
                    // Reset states
                    setProcessingState(initProcessingState());
                    setUploadState({
                      isLoading: false,
                      error: null,
                      useSimpleUI: false
                    });
                    setPollingStatus('idle');
                    setJobId(null);
                    
                    console.log('Navigating to My Wine List, all states reset');
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t('myList.viewList', 'My Wine List')}
                </Link>
                {currentUser ? <UserProfileDropdown /> : <AuthButton className="auth-button" />}
                <LanguageSelector />
              </div>
            </div>
          </div>
        </nav>
        
        {/* Hero Section */}
        <section className="py-16 bg-background-alt">
          <div className="container-padded">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-display-sm md:text-display font-display font-bold mb-6 animate-fade-in">
                <span className="gradient-text">{t('appName')}</span>
              </h1>
              <p className="text-xl text-text-secondary mb-6 max-w-2xl mx-auto animate-fade-in opacity-90">
                {t('upload.title')}
              </p>
              
              {/* Demo button - only shown in staging environment or localhost */}
              {typeof window !== 'undefined' && (
                window.location.hostname.includes('winepicker-63daa') ||
                window.location.hostname === 'localhost' ||
                window.location.hostname.includes('127.0.0.1')
              ) && (
                <DemoProcessingButton 
                  onDemo={handleImageUpload}
                  isProcessing={uploadState.isLoading || processingState.isProcessing}
                  isStaging={true}
                />
              )}
              
              <div className="animate-slide-up delay-100">
                <ImageUploader 
                  onUpload={handleImageUpload}
                  uploadState={{ 
                      isLoading: uploadState.isLoading || pollingStatus === 'polling',
                      error: uploadState.error,
                      // Make sure to hide ImageUploader if we're showing the ProcessingStatus
                      useSimpleUI: false
                  }} 
                />
              </div>
              
              {/* Detailed Processing Status - Only show when uploading */}
              {(uploadState.isLoading || processingState.isProcessing || processingState.currentStep === ProcessingStep.FAILED) && (
                <div className="mt-8 max-w-xl mx-auto">
                  <ProcessingStatus 
                    processingState={{
                      ...processingState,
                      // Force isProcessing to be true when uploadState.isLoading is true
                      // This ensures the component shows during static export
                      isProcessing: processingState.isProcessing || uploadState.isLoading
                    }}
                    onRetry={() => {
                      // Reset and allow to upload a new image
                      setProcessingState(initProcessingState());
                      setUploadState({
                        isLoading: false,
                        error: null,
                        useSimpleUI: false
                      });
                      setPollingStatus('idle');
                      setJobId(null);
                    }}
                    onCancel={() => {
                      // Cancel processing and reset states
                      setProcessingState({
                        ...processingState,
                        isProcessing: false,
                        progress: 0,
                        stepProgress: 0,
                        error: null
                      });
                      setUploadState({
                        isLoading: false,
                        error: null,
                        useSimpleUI: false
                      });
                      setPollingStatus('idle');
                      setJobId(null);
                    }}
                  />
                </div>
              )}
              
              {/* Fallback Error Message (when no detailed processing state) */}
              {!processingState.isProcessing && uploadState.error && processingState.currentStep !== ProcessingStep.FAILED && (
                <div className="mt-8 bg-error/10 border border-error/20 text-error px-6 py-4 rounded-xl animate-fade-in max-w-xl mx-auto">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{uploadState.error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Results Section */}
        {pollingStatus === 'completed' && wineDataList.length > 0 && (
          <section className="py-16">
            <div className="container-padded">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display font-bold text-text-primary">
                    {t('results.title')}
                    {wineDataList.length > 1 && (
                      <span className="ml-2 badge badge-primary">
                        {wineDataList.length} {t('results.winesFound', 'wines found')}
                      </span>
                    )}
                  </h2>
                </div>
                
                <div className="animate-fade-in">
                  <WineList 
                    wines={wineDataList} 
                    isRestaurantMenu={isRestaurantMenu}
                    onAddToList={handleAddToList}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* PWA Install Button */}
        <InstallPWA />
      </main>
    </>
  );
}

export const getStaticProps = async ({ locale = 'en' }: { locale?: string }) => {
  // For static export, we're using the actual locale instead of always English
  try {
    // Use the actual locale instead of hardcoding 'en'
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        // Add a fallback flag so the client knows to replace translations
        _clientSideTranslations: true,
      },
    };
  } catch (e) {
    console.error('Error loading translations in getStaticProps:', e);
    // Return minimal props in case of error
    return {
      props: {
        _clientSideTranslations: true
      }
    };
  }
};

export default Home;