import React from 'react';
import { StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ActivityIndicator, Platform, TouchableOpacity, Pressable, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useStudyStats } from '@/hooks/useStudyStats';
import ActivityCalendar from '@/components/stats/ActivityCalendar';
import DonutChart from '@/components/stats/DonutChart';

import { Strings } from '@/constants/Strings';

export default function StatsScreen() {
    const {
        loading,
        refreshing,
        streak,
        overallDistribution,
        activities,
        refresh
    } = useStudyStats();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const router = useRouter();

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const isWeb = Platform.OS === 'web' && width > 768;

    const { learned, confused, undecided, total } = overallDistribution;
    const learnedPct = total > 0 ? Math.round((learned / total) * 100) : 0;
    const confusedPct = total > 0 ? Math.round((confused / total) * 100) : 0;
    const undecidedPct = total > 0 ? Math.round((undecided / total) * 100) : 0;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={[
                styles.content,
                isWeb && { maxWidth: 650, alignSelf: 'center', width: '100%', paddingVertical: 40 }
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />}
        >
            {/* Streak Section */}
            <Animated.View entering={FadeInUp.delay(100)} style={styles.streakContainer}>
                <Text style={styles.streakText}>
                    {Strings.statsTab.streakMsg(streak)}
                </Text>
            </Animated.View>

            {/* Calendar Section */}
            <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
                <ActivityCalendar activities={activities} />
            </Animated.View>

            {/* Overall Distribution Section Header */}
            <View variant="transparent" style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{Strings.statsTab.chartTitle}</Text>
            </View>

            <Animated.View entering={FadeInUp.delay(300)} style={{ zIndex: 10 }}>
                <Pressable
                    style={({ pressed }) => [
                        styles.mainStatCard,
                        {
                            borderColor: colors.border,
                            opacity: pressed ? 0.6 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                    ]}
                    onPress={() => {
                        console.log('Navigating to statistics_detail');
                        router.push('/statistics_detail');
                    }}
                >
                    <View variant="transparent" style={styles.statRow} pointerEvents="none">
                        {/* Left: Chart */}
                        <DonutChart data={overallDistribution} size={150} strokeWidth={18} />

                        {/* Right: Info */}
                        <View variant="transparent" style={styles.statInfo}>

                            <View variant="transparent" style={styles.indicatorList}>
                                <View variant="transparent" style={styles.indicatorItem}>
                                    <View style={[styles.dot, { backgroundColor: colors.success || '#10B981' }]} />
                                    <Text style={styles.indicatorText}>{learned}{Strings.statsTab.unitWord} / {learnedPct}%</Text>
                                </View>
                                <View variant="transparent" style={styles.indicatorItem}>
                                    <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={styles.indicatorText}>{confused}{Strings.statsTab.unitWord} / {confusedPct}%</Text>
                                </View>
                                <View variant="transparent" style={styles.indicatorItem}>
                                    <View style={[styles.dot, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]} />
                                    <Text style={styles.indicatorText}>{undecided}{Strings.statsTab.unitWord} / {undecidedPct}%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.detailLink, { borderTopColor: colors.border + '50' }]} pointerEvents="none">
                        <Text style={[styles.detailLinkText, { color: colors.tint }]}>{Strings.statsTab.detailLink}</Text>
                        <FontAwesome name={Strings.admin.icons.arrowRight as any} size={10} color={colors.tint} />
                    </View>
                </Pressable>
            </Animated.View>

            <View variant="transparent" style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingVertical: 12,
    },
    streakText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    streakCount: {
        fontSize: 22,
        fontWeight: '900',
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        marginBottom: 16,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    mainStatCard: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1.5,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
    },
    statInfo: {
        flex: 1,
        marginLeft: 8,
    },
    totalCountLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 16,
    },
    totalCountValue: {
        fontSize: 16,
        fontWeight: '900',
    },
    indicatorList: {
        gap: 8,
        marginBottom: 20,
    },
    indicatorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    indicatorText: {
        fontSize: 15,
        fontWeight: '700',
    },
    trendFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    trendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    miniDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '800',
    },
    detailLink: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    detailLinkText: {
        fontSize: 13,
        fontWeight: 'bold',
    }
});
