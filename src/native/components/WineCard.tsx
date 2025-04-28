import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Wine } from '../../../utils/types';
import { UserWine } from '../../../utils/userWines';
import RatingStars from './RatingStars';

interface WineCardProps {
  wine: Wine | UserWine;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

const WineCard: React.FC<WineCardProps> = ({ wine, showRemoveButton, onRemove }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {wine.imageUrl ? (
          <Image 
            source={{ uri: wine.imageUrl }} 
            style={styles.wineImage}
            resizeMode="contain"
            alt={`Wine image of ${wine.name}`}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.wineName} numberOfLines={2}>{wine.name}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.wineryText} numberOfLines={1}>{wine.winery}</Text>
          {wine.year && <Text style={styles.yearText}>{wine.year}</Text>}
        </View>
        
        <View style={styles.detailsRow}>
          {wine.region && (
            <Text style={styles.detailText} numberOfLines={1}>
              {wine.region}
            </Text>
          )}
          
          {wine.grapeVariety && (
            <Text style={styles.detailText} numberOfLines={1}>
              {wine.grapeVariety}
            </Text>
          )}
        </View>
        
        <View style={styles.ratingRow}>
          <RatingStars score={wine.rating?.score || 0} />
          <Text style={styles.ratingScore}>{(wine.rating?.score || 0).toFixed(1)}</Text>
        </View>
        
        {showRemoveButton && onRemove && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={onRemove}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineImage: {
    width: 100,
    height: 130,
  },
  placeholderImage: {
    width: 100,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#757575',
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  wineName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wineryText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  yearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  detailsRow: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default WineCard;