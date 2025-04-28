import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Wine } from '../../../utils/types';
import { getUserWines, removeUserWine, UserWine } from '../../../utils/userWines';
import { useAuth } from '../../../utils/authContext';

// Import components
import WineCard from '../components/WineCard';

const MyListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [wineList, setWineList] = useState<UserWine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's wine list
  useEffect(() => {
    fetchWineList();
  }, [currentUser]); // Add currentUser dependency since fetchWineList depends on it

  const fetchWineList = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const wines = await getUserWines(currentUser.uid);
      setWineList(wines);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching wine list:', error);
      setError('Failed to load your wine list. Please try again.');
      setIsLoading(false);
    }
  };

  // Navigate to wine details
  const handleWinePress = (wine: UserWine) => {
    // @ts-ignore - Ignoring type error for now, will be fixed in a future update
    navigation.navigate('WineDetail', { wine });
  };

  // Remove wine from list
  const handleRemoveWine = async (wineId: string) => {
    if (!currentUser) return;

    Alert.alert(
      'Remove Wine',
      'Are you sure you want to remove this wine from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeUserWine(currentUser.uid, wineId);
              // Update the list after removal
              setWineList(wineList.filter(wine => wine.id !== wineId));
            } catch (error) {
              console.error('Error removing wine:', error);
              Alert.alert('Error', 'Failed to remove wine from your list. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Render empty state
  if (!isLoading && (!wineList || wineList.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Wine List is Empty</Text>
        <Text style={styles.emptyText}>
          Add wines to your list by analyzing wine labels and tapping &quot;Add to My Wine List&quot;
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={styles.buttonText}>Scan a Wine Label</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Loading your wine list...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchWineList}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wineList}
          keyExtractor={(item, index) => item.id || `wine-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleWinePress(item)}>
              <WineCard 
                wine={item} 
                showRemoveButton 
                onRemove={() => handleRemoveWine(item.id || '')}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.headerTitle}>
              My Wine List ({wineList.length} {wineList.length === 1 ? 'wine' : 'wines'})
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
});

export default MyListScreen;