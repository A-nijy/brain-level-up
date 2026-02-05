import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Item = {
    id: string;
    question: string;
    answer: string;
    success_count: number;
    fail_count: number;
};

type LibraryDetail = {
    id: string;
    title: string;
    description: string;
};

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [library, setLibrary] = useState<LibraryDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLibraryData = async () => {
        try {
            setLoading(true);
            // Fetch Library Info
            const { data: libData, error: libError } = await supabase
                .from('libraries')
                .select('*')
                .eq('id', id)
                .single();

            if (libError) throw libError;
            setLibrary(libData);

            // Fetch Items
            const { data: itemData, error: itemError } = await supabase
                .from('items')
                .select('*')
                .eq('library_id', id)
                .order('created_at', { ascending: false });

            if (itemError) throw itemError;
            setItems(itemData || []);

        } catch (error: any) {
            Alert.alert('오류', error.message);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (id) fetchLibraryData();
        }, [id])
    );

    const renderItem = ({ item }: { item: Item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemContent}>
                <Text style={styles.question}>{item.question}</Text>
                <Text style={styles.answer}>{item.answer}</Text>
            </View>
            <View style={styles.stats}>
                <Text style={styles.statText}>O: {item.success_count}</Text>
                <Text style={styles.statText}>X: {item.fail_count}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: library?.title || '암기장 상세',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => router.push(`/library/${id}/import`)} style={{ marginRight: 15 }}>
                                <FontAwesome name="cloud-upload" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push(`/library/${id}/create-item`)}>
                                <FontAwesome name="plus" size={20} color="#007AFF" style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            {library?.description ? (
                <View style={styles.header}>
                    <Text style={styles.description}>{library.description}</Text>
                </View>
            ) : null}

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>등록된 단어가 없습니다.</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => router.push(`/library/${id}/create-item`)}
                        >
                            <Text style={styles.addButtonText}>단어 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => router.push(`/study/${id}`)}
                    >
                        <FontAwesome name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.playButtonText}>암기 시작 ({items.length}개)</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    description: {
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // For footer
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    itemContent: {
        flex: 1,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    answer: {
        fontSize: 14,
        color: '#666',
    },
    stats: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    statText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 16,
    },
    addButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    playButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
