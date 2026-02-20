import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSharedSectionDetail } from '@/hooks/useSharedSectionDetail';
import { SharedItem, SharedSection } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SharedSectionDetailScreen() {
    const { id, sectionId } = useLocalSearchParams();
    const sharedSectionId = Array.isArray(sectionId) ? sectionId[0] : sectionId;

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { section, items, loading } = useSharedSectionDetail(sharedSectionId);

    const renderItem = ({ item, index }: { item: SharedItem, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 20).duration(400)}>
            <Card style={styles.itemCard} disabled>
                <View variant="transparent" style={styles.itemContent}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.answer}</Text>
                    {item.memo && (
                        <Text style={[styles.memoText, { color: colors.tint }]}>{item.memo}</Text>
                    )}
                </View>
            </Card>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: section?.title || '상세 보기',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        <Text style={styles.countText}>총 {items.length}개의 단어</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="file-text-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 단어가 없습니다.</Text>
                    </View>
                }
            />
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
        padding: 20,
        paddingBottom: 40,
    },
    listHeader: {
        marginBottom: 20,
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    itemCard: {
        marginBottom: 12,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    itemContent: {
        flex: 1,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    answerText: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 8,
    },
    memoText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
    },
});
