import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminStatsService } from '@/services/admin/AdminStatsService';
import { AdminService } from '@/services/AdminService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Strings } from '@/constants/Strings';

const { width } = Dimensions.get('window');

export default function UserUsageDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({
        visible: false,
        x: 0,
        y: 0,
        text: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { profile } = await AdminService.getUserDetail(id as string);
            setUserEmail(profile.email);

            const usageData = await AdminStatsService.getUserUsageStats(id as string);
            const timelineData = await AdminStatsService.getUserUsageTimeline(id as string);

            setStats(usageData);
            setTimeline(timelineData);
        } catch (error) {
            console.error('Failed to load usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const maxMinutes = Math.max(...timeline.map(t => t.minutes), 1);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ 
                title: '사용량 상세 분석',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome name="chevron-left" size={20} color={colors.text} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View variant="transparent" style={styles.header}>
                    <Text style={styles.emailText}>{userEmail}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>사용자 접속 및 활동 분석 리포트</Text>
                </View>

                {/* 오늘 요약 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>오늘의 사용 시간</Text>
                    <View variant="transparent" style={styles.summaryRow}>
                        <Card style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>App</Text>
                            <Text style={[styles.summaryValue, { color: colors.tint }]}>{stats?.today.app}분</Text>
                        </Card>
                        <Card style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Web</Text>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{stats?.today.web}분</Text>
                        </Card>
                    </View>
                </View>

                {/* 최근 7일 그래프 (간이 막대 그래프) */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>최근 7일 사용 추이 (분)</Text>
                    <Card style={styles.chartCard}>
                        <View variant="transparent" style={styles.chartContainer}>
                            {stats?.chartData.map((day: any, index: number) => {
                                const maxVal = Math.max(...stats.chartData.map((d: any) => Math.max(d.app, d.web)), 1);
                                return (
                                    <View key={index} variant="transparent" style={styles.chartBarWrapper}>
                                        <View variant="transparent" style={styles.sideBySideContainer}>
                                            <View 
                                                variant="transparent"
                                                {...({ 
                                                    onMouseEnter: (e: any) => {
                                                        const { clientX, clientY } = e.nativeEvent;
                                                        setTooltip({ 
                                                            visible: true, 
                                                            x: clientX, 
                                                            y: clientY, 
                                                            text: `App: ${day.app}분` 
                                                        });
                                                    },
                                                    onMouseMove: (e: any) => {
                                                        const { clientX, clientY } = e.nativeEvent;
                                                        setTooltip(prev => ({ ...prev, x: clientX, y: clientY }));
                                                    },
                                                    onMouseLeave: () => setTooltip(prev => ({ ...prev, visible: false }))
                                                } as any)}
                                                style={[
                                                    styles.sideBar, 
                                                    { 
                                                        height: day.app > 0 ? Math.max((day.app / maxVal) * 140, 4) : 2, 
                                                        backgroundColor: colors.tint 
                                                    }
                                                ]} 
                                            />
                                            <View 
                                                variant="transparent"
                                                {...({ 
                                                    onMouseEnter: (e: any) => {
                                                        const { clientX, clientY } = e.nativeEvent;
                                                        setTooltip({ 
                                                            visible: true, 
                                                            x: clientX, 
                                                            y: clientY, 
                                                            text: `Web: ${day.web}분` 
                                                        });
                                                    },
                                                    onMouseMove: (e: any) => {
                                                        const { clientX, clientY } = e.nativeEvent;
                                                        setTooltip(prev => ({ ...prev, x: clientX, y: clientY }));
                                                    },
                                                    onMouseLeave: () => setTooltip(prev => ({ ...prev, visible: false }))
                                                } as any)}
                                                style={[
                                                    styles.sideBar, 
                                                    { 
                                                        height: day.web > 0 ? Math.max((day.web / maxVal) * 140, 4) : 2, 
                                                        backgroundColor: '#10b981' 
                                                    }
                                                ]} 
                                            />
                                        </View>
                                        <Text style={styles.barLabel}>{day.date.split('-').slice(1).join('/')}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View variant="transparent" style={styles.legend}>
                            <View variant="transparent" style={styles.legendItem}>
                                <View variant="transparent" style={[styles.dot, { backgroundColor: colors.tint }]} />
                                <Text style={styles.legendText}>App</Text>
                            </View>
                            <View variant="transparent" style={styles.legendItem}>
                                <View variant="transparent" style={[styles.dot, { backgroundColor: '#10b981' }]} />
                                <Text style={styles.legendText}>Web</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* 시간대별 활동 (타임라인) */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>오늘 시간대별 활동 (분)</Text>
                    <Card style={styles.timelineCard}>
                        {timeline.filter(h => h.minutes > 0).map((h, i) => (
                            <View key={i} variant="transparent" style={styles.timelineItem}>
                                <View variant="transparent" style={styles.timeWrapper}>
                                    <Text style={styles.timeText}>{h.hour.toString().padStart(2, '0')}:00</Text>
                                </View>
                                <View variant="transparent" style={styles.progressContainer}>
                                    <View 
                                        variant="transparent" 
                                        style={[
                                            styles.progressBar, 
                                            { 
                                                width: `${(h.minutes / maxMinutes) * 100}%`,
                                                backgroundColor: h.platforms.includes('web') ? '#10b981' : colors.tint
                                            }
                                        ]} 
                                    />
                                </View>
                                <Text style={styles.minuteText}>{h.minutes}분</Text>
                            </View>
                        ))}
                        {timeline.filter(h => h.minutes > 0).length === 0 && (
                            <Text style={styles.emptyText}>오늘의 활동 기록이 없습니다.</Text>
                        )}
                    </Card>
                </View>

                <TouchableOpacity 
                    style={[styles.backButton, { borderColor: colors.border }]}
                    onPress={() => router.back()}
                >
                    <Text style={[styles.backButtonText, { color: colors.text }]}>목록으로 돌아가기</Text>
                </TouchableOpacity>
            </ScrollView>

            {tooltip.visible && Platform.OS === 'web' && (
                <View 
                    style={[
                        styles.tooltipPopup, 
                        { 
                            position: 'fixed' as any,
                            left: tooltip.x + 15, 
                            top: tooltip.y + 15, 
                            backgroundColor: 'rgba(0,0,0,0.85)',
                        }
                    ]}
                >
                    <Text style={styles.tooltipText}>{tooltip.text}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 24 },
    emailText: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    subText: { fontSize: 14 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
    summaryRow: { flexDirection: 'row', gap: 12 },
    summaryCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    summaryValue: { fontSize: 20, fontWeight: '800' },
    chartCard: { padding: 16, borderRadius: 20 },
    chartContainer: { 
        height: 180, 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        justifyContent: 'space-around',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    chartBarWrapper: { alignItems: 'center', width: 44 },
    sideBySideContainer: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 0 },
    sideBar: { width: 10, borderRadius: 5, backgroundColor: '#f0f0f0' },
    barStack: { width: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: '#f0f0f0', justifyContent: 'flex-end' },
    appBar: { width: '100%' },
    webBar: { width: '100%' },
    barLabel: { fontSize: 10, marginTop: 8, color: '#999' },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: '#666' },
    timelineCard: { padding: 16, borderRadius: 20 },
    timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    timeWrapper: { width: 50 },
    timeText: { fontSize: 13, fontWeight: '600', color: '#666' },
    progressContainer: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 4 },
    minuteText: { width: 35, fontSize: 13, fontWeight: '700', textAlign: 'right' },
    emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
    backButton: { 
        marginTop: 20, 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        alignItems: 'center' 
    },
    backButtonText: { fontWeight: '700' },
    tooltipPopup: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        zIndex: 9999,
        pointerEvents: 'none',
    },
    tooltipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
});
