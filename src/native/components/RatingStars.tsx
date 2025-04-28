import React from 'react';
import { View, StyleSheet } from 'react-native';

interface RatingStarsProps {
  score: number;
  maxStars?: number;
  size?: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  score, 
  maxStars = 5, 
  size = 16 
}) => {
  // Ensure score is within valid range
  const normalizedScore = Math.max(0, Math.min(score, maxStars));
  
  // Calculate the width of the filled stars container
  const filledWidth = (normalizedScore / maxStars) * 100;
  
  return (
    <View style={styles.container}>
      {/* Background stars (empty/gray) */}
      <View style={[styles.starsContainer, { width: size * maxStars }]}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <View key={`empty-${index}`} style={[styles.star, { width: size, height: size }]} />
        ))}
      </View>
      
      {/* Foreground stars (filled/gold) */}
      <View 
        style={[
          styles.starsContainer, 
          styles.filledStarsContainer, 
          { width: `${filledWidth}%` }
        ]}
      >
        {Array.from({ length: maxStars }).map((_, index) => (
          <View key={`filled-${index}`} style={[styles.star, styles.filledStar, { width: size, height: size }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  filledStarsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  star: {
    backgroundColor: '#e0e0e0',
    width: 16,
    height: 16,
    margin: 2,
    // React Native doesn't support clipPath, using a simpler star representation
    borderRadius: 2,
  },
  filledStar: {
    backgroundColor: '#FFD700',
  },
});

export default RatingStars;