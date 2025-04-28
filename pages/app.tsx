import React from 'react';
import Link from 'next/link';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { platformSelect, isPlatformWeb } from '../utils/platform';
import ImageUploader from '../components/ImageUploader';
import PlatformComponent from '../components/PlatformComponent';

/**
 * Native iOS App Entry Point
 * This page serves as the main entry point for the iOS app version
 */
function AppMain() {
  // In a real implementation, we'd use React Navigation here
  
  if (isPlatformWeb()) {
    // Web fallback to show this is an app-specific page
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">iOS App Version</h1>
        <p className="mb-4">
          This page is designed for the native iOS app. You&apos;re currently viewing it in a web browser.
        </p>
        <Link href="/" className="text-blue-500 underline">
          Go to Web Version
        </Link>
        
        <div className="mt-8 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Platform Detection Demo</h2>
          <PlatformComponent />
        </div>
      </div>
    );
  }
  
  // Native iOS components
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MyWine</Text>
        <Text style={styles.subtitle}>
          Analyze wine labels instantly
        </Text>
      </View>
      
      <View style={styles.uploadSection}>
        {/* In a real implementation, we'd use react-native-image-picker here */}
        <Text style={styles.uploadInstructions}>
          Tap to take a photo of a wine label
        </Text>
        
        <Image 
          source={require('../public/placeholder-wine.jpg')} 
          style={styles.placeholderImage}
          resizeMode="contain"
          alt="Wine bottle placeholder image"
        />
        
        <View style={styles.button}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </View>
      </View>
      
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Identify Wines</Text>
          <Text style={styles.featureDescription}>
            Take a photo of any wine label to get detailed information
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Personal Collection</Text>
          <Text style={styles.featureDescription}>
            Save your favorite wines to your personal collection
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Expert Ratings</Text>
          <Text style={styles.featureDescription}>
            See professional ratings and reviews for each wine
          </Text>
        </View>
      </View>
      
      <PlatformComponent />
    </ScrollView>
  );
}

// React Native Styles
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
    margin: 24,
    padding: 24,
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
  placeholderImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresSection: {
    margin: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featureItem: {
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default AppMain;