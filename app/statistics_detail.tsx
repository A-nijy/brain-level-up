import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Strings } from '@/constants/Strings';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';

import { useStudyStats } from '@/hooks/useStudyStats';
import DonutChart from '@/components/stats/DonutChart';

export default function StatsDetailScreen() {
    const {
        loading,
        libraryDistributions,
    } = useStudyStats();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const router = useRouter();

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const isWeb = Platform.OS === 'web' && width > 768;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: Strings.stats.detailTitle,
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    isWeb && { maxWidth: 650, alignSelf: 'center', width: '100%', paddingVertical: 40 }
                ]}
            >
                <View variant="transparent" style={styles.headerSpacer} />

                {libraryDistributions.length === 0 ? (
                    <View variant="transparent" style={styles.emptyContainer}>
                        <FontAwesome name="folder-open-o" size={40} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>표시할 암기장이 없습니다.</Text>
                    </View>
                ) : (
                    libraryDistributions.map((lib, index) => {
                        const learnedPct = lib.total > 0 ? Math.round((lib.learned / lib.total) * 100) : 0;
                        const confusedPct = lib.total > 0 ? Math.round((lib.confused / lib.total) * 100) : 0;
                        const undecidedPct = lib.total > 0 ? Math.round((lib.undecided / lib.total) * 100) : 0;

                        return (
                            <Animated.View key={lib.libraryId} entering={FadeInUp.delay(index * 100)}>
                                <View variant="transparent" style={styles.libCardWrapper}>
                                    <Text style={styles.libTitle}>{lib.title}</Text>
                                    <Card style={[styles.libCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                        <View variant="transparent" style={styles.statRow}>
                                            <DonutChart
                                                data={{
                                                    learned: lib.learned,
                                                    confused: lib.confused,
                                                    undecided: lib.undecided,
                                                    total: lib.total
                                                }}
                                                size={120}
                                                strokeWidth={14}
                                            />

                                            <View variant="transparent" style={styles.statInfo}>

                                                <View variant="transparent" style={styles.indicatorList}>
                                                    <View variant="transparent" style={styles.indicatorItem}>
                                                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                                        <Text style={styles.indicatorText}>{Strings.librarySection.statusModal.learned}: {lib.learned}개 ({learnedPct}%)</Text>
                                                    </View>
                                                    <View variant="transparent" style={styles.indicatorItem}>
                                                        <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                                                        <Text style={styles.indicatorText}>{Strings.librarySection.statusModal.confused}: {lib.confused}개 ({confusedPct}%)</Text>
                                                    </View>
                                                    <View variant="transparent" style={styles.indicatorItem}>
                                                        <View style={[styles.dot, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]} />
                                                        <Text style={styles.indicatorText}>{lib.undecided}개 ({undecidedPct}%)</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </Card>
                                </View>
                            </Animated.View>
                        );
                    })
                )}

                <View variant="transparent" style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginLeft: 16,
        padding: 8,
    },
    headerSpacer: {
        height: 16,
    },
    libCardWrapper: {
        marginBottom: 32,
    },
    libTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    libCard: {
        borderRadius: 28,
        padding: 20,
        borderWidth: 1.5,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    statInfo: {
        flex: 1,
        marginLeft: 8,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    indicatorList: {
        gap: 6,
    },
    indicatorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    indicatorText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusTag: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 6,
    },
});
