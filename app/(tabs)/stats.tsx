import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ActivityIndicator, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { StatsService } from '@/services/StatsService';
import { StudyLog } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function StatsScreen() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<StudyLog[]>([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    useEffect(() => {
        loadData();
    }, [profile]);

    const loadData = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const [statsData, streakData] = await Promise.all([
                StatsService.getRecentStats(profile.id, 7),
                StatsService.getStudyStreak(profile.id)
            ]);
            setStats(statsData);
            setStreak(streakData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Calculate totals
    const totalItems = stats.reduce((acc, curr) => acc + curr.items_count, 0);
    const totalCorrect = stats.reduce((acc, curr) => acc + curr.correct_count, 0);
    const avgAccuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
    const totalMinutes = Math.round(stats.reduce((acc, curr) => acc + curr.study_time_seconds, 0) / 60);

    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const log = stats.find(s => s.study_date === dateStr);
        return {
            label: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
            value: log ? log.items_count : 0,
            fullDate: dateStr
        };
    });

    const maxVal = Math.max(...chartData.map(d => d.value), 1);

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const isWeb = Platform.OS === 'web' && width > 768;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={[
                isWeb && { maxWidth: 1000, alignSelf: 'center', width: '100%', paddingVertical: 40 }
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        >
            <View variant="transparent" style={styles.header}>
                <Text style={styles.headerTitle}>Learning Progress</Text>
                <Text style={styles.headerSubtitle}>최근 7일간의 학습 성과를 확인하세요.</Text>
            </View>

            <View variant="transparent" style={[styles.statsGrid, isWeb && { flexDirection: 'row', flexWrap: 'wrap' }]}>
                <Animated.View entering={FadeInUp.delay(100)} style={styles.statCardWrapper}>
                    <Card style={[styles.statCard, { borderColor: '#F59E0B' }]}>
                        <View variant="transparent" style={styles.statHeader}>
                            <FontAwesome name="fire" size={20} color="#F59E0B" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
                        </View>
                        <Text style={styles.statValue}>{streak} Days</Text>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.statCardWrapper}>
                    <Card style={[styles.statCard, { borderColor: colors.tint }]}>
                        <View variant="transparent" style={styles.statHeader}>
                            <FontAwesome name="line-chart" size={20} color={colors.tint} />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accuracy</Text>
                        </View>
                        <Text style={styles.statValue}>{avgAccuracy}%</Text>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300)} style={styles.statCardWrapper}>
                    <Card style={[styles.statCard, { borderColor: '#10B981' }]}>
                        <View variant="transparent" style={styles.statHeader}>
                            <FontAwesome name="check-square-o" size={20} color="#10B981" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Solved</Text>
                        </View>
                        <Text style={styles.statValue}>{totalItems}</Text>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400)} style={styles.statCardWrapper}>
                    <Card style={[styles.statCard, { borderColor: '#6366F1' }]}>
                        <View variant="transparent" style={styles.statHeader}>
                            <FontAwesome name="clock-o" size={20} color="#6366F1" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Study Time</Text>
                        </View>
                        <Text style={styles.statValue}>{totalMinutes}m</Text>
                    </Card>
                </Animated.View>
            </View>

            <View variant="transparent" style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Activity</Text>
                <Card style={styles.chartCard}>
                    <View variant="transparent" style={styles.chartContent}>
                        {chartData.map((day, index) => (
                            <View key={index} variant="transparent" style={styles.barWrapper}>
                                <View variant="transparent" style={styles.barContainer}>
                                    <Animated.View
                                        entering={FadeInUp.delay(500 + index * 50)}
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${(day.value / maxVal) * 100}%`,
                                                backgroundColor: day.value === 0 ? colors.border : colors.tint
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{day.label}</Text>
                            </View>
                        ))}
                    </View>
                </Card>
            </View>

            <View variant="transparent" style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 12,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    statCardWrapper: {
        width: '50%',
        padding: 8,
    },
    statCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    section: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    chartCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    chartContent: {
        flexDirection: 'row',
        height: 180,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        height: 140,
        width: 14,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 7,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: 10,
    },
    bar: {
        width: '100%',
        borderRadius: 7,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '700',
    }
});
