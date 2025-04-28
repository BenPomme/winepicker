import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Wine } from '../../../utils/types';
import { addToPersonalList } from '../../../utils/personalWineList';
import { useAuth } from '../../../utils/authContext';

// Import components
import RatingStars from '../components/RatingStars';

type RouteParams = {
  WineDetail: {
    wine: Wine;
  };
};

const WineDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'WineDetail'>>();
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const wine = route.params.wine;
  
  // Handle adding wine to personal list
  const handleAddToList = async () => {
    if (!currentUser) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add wines to your personal list.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth' as never) }
        ]
      );
      return;
    }
    
    try {
      await addToPersonalList(wine, currentUser.uid);
      Alert.alert('Success', 'Wine added to your personal list');
    } catch (error) {
      console.error('Error adding wine to list:', error);
      Alert.alert('Error', 'Failed to add wine to your list. Please try again.');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {wine.imageUrl ? (
          <Image 
            source={{ uri: wine.imageUrl }} 
            style={styles.wineImage}
            resizeMode="contain"
            alt={`${wine.name} by ${wine.winery}`}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.wineName}>{wine.name}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.wineryText}>{wine.winery}</Text>
          {wine.year && <Text style={styles.yearText}>{wine.year}</Text>}
        </View>
        
        <View style={styles.infoSection}>
          {wine.region && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Region</Text>
              <Text style={styles.infoValue}>{wine.region}</Text>
            </View>
          )}
          
          {wine.grapeVariety && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Grape Varieties</Text>
              <Text style={styles.infoValue}>{wine.grapeVariety}</Text>
            </View>
          )}
          
          {wine.type && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{wine.type}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Rating</Text>
          <View style={styles.ratingRow}>
            <RatingStars score={wine.rating?.score || 0} />
            <Text style={styles.ratingScore}>{(wine.rating?.score || 0).toFixed(1)}</Text>
          </View>
          <Text style={styles.ratingSource}>{wine.rating?.source || 'Not rated'}</Text>
        </View>
        
        {wine.summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Tasting Notes</Text>
            <Text style={styles.summaryText}>{wine.summary}</Text>
          </View>
        )}
        
        {wine.webSnippets && (
          <View style={styles.webSnippetsContainer}>
            <Text style={styles.webSnippetsTitle}>Additional Information</Text>
            <Text style={styles.webSnippetsText}>{wine.webSnippets}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddToList}
        >
          <Text style={styles.addButtonText}>Add to My Wine List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
  },
  wineImage: {
    width: 200,
    height: 200,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#757575',
  },
  detailsContainer: {
    padding: 16,
  },
  wineName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wineryText: {
    fontSize: 16,
    color: '#666',
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  ratingContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingScore: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingSource: {
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  webSnippetsContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  webSnippetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  webSnippetsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WineDetailScreen;