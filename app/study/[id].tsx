import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

type Item = {
    id: string;
    question: string;
    answer: string;
    success_count: number;
    fail_count: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function StudyScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState({ correct: 0, wrong: 0 });
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [id]);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('library_id', id);

            if (error) throw error;

            // Shuffle items for random order
            const shuffled = (data || []).sort(() => Math.random() - 0.5);
            setItems(shuffled);
        } catch (error: any) {
            Alert.alert('Error', error.message);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleResult = async (success: boolean) => {
        const currentItem = items[currentIndex];

        // Update local state results
        setResults(prev => ({
            ...prev,
            correct: success ? prev.correct + 1 : prev.correct,
            wrong: !success ? prev.wrong + 1 : prev.wrong
        }));

        // Optimistic UI update - move to next card immediately
        // Ideally we should batch update or update in background
        updateItemStats(currentItem.id, success);

        if (currentIndex < items.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const updateItemStats = async (itemId: string, success: boolean) => {
        try {
            const { error } = await supabase.rpc(success ? 'increment_success' : 'increment_fail', {
                row_id: itemId
            });
            // If RPC fails or not implemented, fallback to update
            if (error) {
                // Fallback: fetch and update (less concurrent safe but works for MVP)
                const { data: current } = await supabase.from('items').select('success_count, fail_count').eq('id', itemId).single();
                if (current) {
                    await supabase.from('items').update({
                        success_count: success ? current.success_count + 1 : current.success_count,
                        fail_count: !success ? current.fail_count + 1 : current.fail_count,
                        last_reviewed_at: new Date().toISOString()
                    }).eq('id', itemId);
                }
            }
        } catch (e) {
            console.error("Failed to update stats", e);
        }
    };

    // 결과 화면
    if (isFinished) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: '학습 완료' }} />
                <View style={styles.resultCard}>
                    <FontAwesome name="trophy" size={50} color="#FFD700" style={{ marginBottom: 20 }} />
                    <Text style={styles.resultTitle}>학습 완료!</Text>
                    <Text style={styles.resultText}>총 {items.length}개 단어 중</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{results.correct}</Text>
                            <Text style={styles.statLabel}>알아요</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#F44336' }]}>{results.wrong}</Text>
                            <Text style={styles.statLabel}>몰라요</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.finishButtonText}>목록으로 돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text>학습할 단어가 없습니다.</Text>
            </View>
        );
    }

    const currentItem = items[currentIndex];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `학습 중 (${currentIndex + 1}/${items.length})` }} />

            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={handleFlip}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardLabel}>{isFlipped ? '정답 (뜻)' : '문제 (단어)'}</Text>
                        <Text style={styles.cardMainText}>
                            {isFlipped ? currentItem.answer : currentItem.question}
                        </Text>
                        {isFlipped && currentItem.id && (
                            /* Future: Add memo here if needed */
                            <Text style={styles.hintText}>터치하여 문제를 보세요</Text>
                        )}
                        {!isFlipped && (
                            <Text style={styles.hintText}>터치하여 정답을 확인하세요</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.wrongButton]}
                    onPress={() => handleResult(false)}
                >
                    <FontAwesome name="times" size={24} color="#fff" />
                    <Text style={styles.buttonText}>몰라요</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.correctButton]}
                    onPress={() => handleResult(true)}
                >
                    <FontAwesome name="check" size={24} color="#fff" />
                    <Text style={styles.buttonText}>알아요</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        padding: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    card: {
        width: '100%',
        height: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    cardContent: {
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardMainText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    hintText: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 10,
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wrongButton: {
        backgroundColor: '#FF5252',
    },
    correctButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    resultCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 40,
        maxHeight: 500,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
    },
    finishButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
