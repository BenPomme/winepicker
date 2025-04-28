import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { analyzeWineImage, getAnalysisResult } from '../../../utils/api-client';
import { Wine } from '../../../utils/types';

// Import UI components
import WineCard from '../components/WineCard';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [wineResults, setWineResults] = useState<Wine[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Handle image capture from camera
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });
      
      if (result.didCancel) return;
      
      if (result.assets && result.assets[0]?.base64) {
        await processImage(result.assets[0].base64);
      } else {
        setError('Could not process image. Please try again.');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setError('Camera error. Please try again.');
    }
  };
  
  // Handle image selection from gallery
  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });
      
      if (result.didCancel) return;
      
      if (result.assets && result.assets[0]?.base64) {
        await processImage(result.assets[0].base64);
      } else {
        setError('Could not process image. Please try again.');
      }
    } catch (error) {
      console.error('Image selection error:', error);
      setError('Image selection error. Please try again.');
    }
  };
  
  // Process the image and get wine analysis
  const processImage = async (base64Image: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setWineResults([]);
      
      // Send the image for analysis
      const response = await analyzeWineImage(base64Image, 'en');
      console.log('Analysis response:', response);
      
      const typedResponse = response as { 
        jobId?: string; 
        status?: string; 
        data?: { wines?: any[]; imageUrl?: string; }; 
      };
      
      if (typedResponse.status === 'completed' && typedResponse.data?.wines) {
        // Format wine data for display
        const wines = formatWines(typedResponse.data.wines, typedResponse.data.imageUrl);
        setWineResults(wines);
        setIsLoading(false);
      } else if (typedResponse.jobId) {
        // Start polling for results
        pollForResults(typedResponse.jobId);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Image processing error:', error);
      setIsLoading(false);
      setError(error.message || 'Failed to analyze wine. Please try again.');
    }
  };
  
  // Poll for results when job is processing
  const pollForResults = async (jobId: string) => {
    try {
      console.log(`Polling for job ID: ${jobId}`);
      
      const pollInterval = setInterval(async () => {
        try {
          const data = await getAnalysisResult(jobId);
          console.log('Polling result:', data);
          
          if (data && typeof data === 'object' && 'status' in data) {
            if (data.status === 'completed') {
              clearInterval(pollInterval);
              
              const dataWithWines = data as { status: string; data?: { wines?: any[]; imageUrl?: string; }; };
              if (dataWithWines.data?.wines) {
                const wines = formatWines(dataWithWines.data.wines, dataWithWines.data.imageUrl);
                setWineResults(wines);
                setIsLoading(false);
              } else {
                throw new Error('No wine data found');
              }
            } else if (data.status === 'failed' || data.status === 'trigger_failed') {
              clearInterval(pollInterval);
              throw new Error('Analysis failed');
            }
            // Continue polling for other statuses
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Polling error:', error);
          setIsLoading(false);
          setError('Failed to get analysis results. Please try again.');
        }
      }, 3000); // Poll every 3 seconds
      
      // Set a timeout to stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isLoading) {
          setIsLoading(false);
          setError('Analysis is taking too long. Please try again.');
        }
      }, 120000);
    } catch (error) {
      console.error('Polling setup error:', error);
      setIsLoading(false);
      setError('Failed to set up polling. Please try again.');
    }
  };
  
  // Format wine data for display
  const formatWines = (wineData: any[], imageUrl?: string): Wine[] => {
    return wineData.map(wine => ({
      name: wine.name || '',
      winery: wine.producer || wine.winery || '',
      year: wine.vintage || wine.year || '',
      region: wine.region || '',
      grapeVariety: wine.grapeVarieties || wine.varietal || '',
      type: wine.type || '',
      imageUrl: wine.imageUrl || imageUrl || '',
      uploadedImageUrl: imageUrl || '',
      score: wine.score || 0,
      summary: wine.tastingNotes || wine.summary || '',
      webSnippets: wine.webSnippets || '',
      rating: {
        score: wine.score || 0,
        source: wine.ratingSource || 'AI Analysis',
        review: wine.tastingNotes || ''
      },
      additionalReviews: []
    }));
  };
  
  // Navigate to wine details
  const handleWinePress = (wine: Wine) => {
    // @ts-ignore - Ignoring type error for now, will be fixed in a future update
    navigation.navigate('WineDetail', { wine });
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MyWine</Text>
        <Text style={styles.subtitle}>Analyze wine labels instantly</Text>
      </View>
      
      <View style={styles.uploadSection}>
        <Text style={styles.uploadInstructions}>
          Take or select a photo of a wine label
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleTakePhoto}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleSelectImage}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Analyzing wine label...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {wineResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {wineResults.length > 1 
              ? `${wineResults.length} Wines Found` 
              : 'Wine Analysis Results'}
          </Text>
          
          {wineResults.map((wine, index) => (
            <TouchableOpacity key={index} onPress={() => handleWinePress(wine)}>
              <WineCard wine={wine} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 24,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  uploadSection: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadInstructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});

export default HomeScreen;
