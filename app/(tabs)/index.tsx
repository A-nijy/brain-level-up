import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Library = {
  id: string;
  title: string;
  description: string | null;
  count?: number; // item count join (optional implementation later)
  created_at: string;
};

export default function LibraryListScreen() {
  const { session } = useAuth();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchLibraries = async () => {
    try {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('libraries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLibraries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLibraries();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLibraries();
  };

  const renderItem = ({ item }: { item: Library }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/library/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <FontAwesome name="book" size={24} color="#4A90E2" style={styles.icon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <FontAwesome name="chevron-right" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {libraries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="folder-open-o" size={64} color="#ccc" />
          <Text style={styles.emptyText}>암기장이 비어있습니다.</Text>
          <Text style={styles.emptySubText}>새로운 암기장을 만들어보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={libraries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff', // Themed View handles background but we want explicit card style
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
  },
});
