import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, View as DefaultView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminStatsService } from '@/services/admin/AdminStatsService';
import { AdminService } from '@/services/AdminService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

export default function UserAdUsageDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [stats, setStats] = useState<any>(null);
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

            const adData = await AdminStatsService.getUserAdUsageStats(id as string);
            setStats(adData);
        } catch (error) {
            console.error('Failed to load ad usage data:', error);
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

    const maxAdCount = Math.max(...stats?.chartData.map((d: any) => d.count), 1);

    const PLACEMENT_COLORS: { [key: string]: string } = {
        'CREATE_LIBRARY': '#3b82f6', // 파랑
        'DOWNLOAD_SHARED': '#f97316', // 주황
        'EXPORT_PDF': '#ef4444',     // 빨강
        'UNKNOWN': '#94a3b8'         // 회색 (기타/미분류)
    };

    const getPlacementColor = (name: string) => PLACEMENT_COLORS[name] || '#64748b';

    const friendlyName: { [key: string]: string } = {
        'CREATE_LIBRARY': '암기장 생성',
        'DOWNLOAD_SHARED': '자료실 다운로드',
        'EXPORT_PDF': 'PDF 내보내기',
        'UNKNOWN': '기타/미분류'
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ 
                title: '광고 시청 분석',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome name="chevron-left" size={20} color={colors.text} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View variant="transparent" style={styles.header}>
                    <Text style={styles.emailText}>{userEmail}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>사용자 광고 시청 행태 분석 리포트</Text>
                </View>

                {/* 시청 현황 요약 */}
                <View variant="transparent" style={styles.summaryRow}>
                    <Card style={styles.summaryCard}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>오늘 시청</Text>
                        <Text style={[styles.summaryValue, { color: colors.tint }]}>{stats?.summary.today}회</Text>
                    </Card>
                    <Card style={styles.summaryCard}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>누적 시청</Text>
                        <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{stats?.summary.total}회</Text>
                    </Card>
                </View>

                {/* 최근 30일 추이 그래프 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>최근 30일 시청 추이 (기능별)</Text>
                    <Card style={styles.chartCard}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View variant="transparent" style={[styles.chartContainer, { width: Math.max(width - 72, stats.chartData.length * 40) }]}>
                                {stats?.chartData.map((day: any, index: number) => {
                                    // 정의된 색상 순서대로 막대 표시 (고정 순서)
                                    const activePlacements = Object.entries(day.placements);
                                    return (
                                        <View key={index} variant="transparent" style={styles.chartBarWrapper}>
                                            <View variant="transparent" style={styles.multiBarContainer}>
                                                {Object.keys(PLACEMENT_COLORS).some(name => (day.placements[name] || 0) > 0) ? (
                                                    Object.keys(PLACEMENT_COLORS).map((name, pIdx) => {
                                                        const count = day.placements[name] || 0;
                                                        if (count === 0) return null;
                                                        return (
                                                            <View 
                                                                key={pIdx}
                                                                variant="transparent"
                                                                {...({ 
                                                                    onMouseEnter: (e: any) => {
                                                                        const { clientX, clientY } = e.nativeEvent;
                                                                        setTooltip({ 
                                                                            visible: true, 
                                                                            x: clientX, 
                                                                            y: clientY, 
                                                                            text: `${friendlyName[name] || name}: ${count}회` 
                                                                        });
                                                                    },
                                                                    onMouseMove: (e: any) => {
                                                                        const { clientX, clientY } = e.nativeEvent;
                                                                        setTooltip(prev => ({ ...prev, x: clientX, y: clientY }));
                                                                    },
                                                                    onMouseLeave: () => setTooltip(prev => ({ ...prev, visible: false }))
                                                                } as any)}
                                                                style={[
                                                                    styles.bar, 
                                                                    { 
                                                                        height: Math.max((count / maxAdCount) * 110, 4), 
                                                                        backgroundColor: PLACEMENT_COLORS[name],
                                                                        width: 8,
                                                                        marginHorizontal: 1
                                                                    }
                                                                ]} 
                                                            />
                                                        );
                                                    })
                                                ) : (
                                                    <View variant="transparent" style={[styles.bar, { height: 2, backgroundColor: '#f0f0f0', width: 8 }]} />
                                                )}
                                            </View>
                                            {index % 5 === 0 && (
                                                <Text style={styles.barLabel}>{day.date.split('-').slice(2)}</Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* 범례 추가 (전체 항목 표시 및 가운데 정렬) */}
                        <View variant="transparent" style={styles.legendContainer}>
                            {Object.entries(PLACEMENT_COLORS).map(([name, color], i) => {
                                return (
                                    <View key={i} variant="transparent" style={styles.legendItem}>
                                        <View variant="transparent" style={[styles.legendDot, { backgroundColor: color }]} />
                                        <Text style={styles.legendText}>{friendlyName[name] || name}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                </View>

                {/* 시청 경로 분석 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>시청 경로(기능)별 비중 (최근 30일)</Text>
                    <Card style={styles.placementCard}>
                        {stats?.topPlacements.map((p: any, i: number) => {
                            const percentage = stats.summary.total > 0 ? (p.count / stats.summary.total) * 100 : 0;
                            return (
                                <View key={i} variant="transparent" style={styles.placementItem}>
                                    <View variant="transparent" style={styles.placementInfo}>
                                        <Text style={styles.placementName}>{friendlyName[p.name] || p.name}</Text>
                                        <Text style={[styles.placementCount, { color: colors.textSecondary }]}>{p.count}회 ({percentage.toFixed(1)}%)</Text>
                                    </View>
                                    <View variant="transparent" style={styles.progressContainer}>
                                        <View 
                                            variant="transparent" 
                                            style={[
                                                styles.progressBar, 
                                                { width: `${percentage}%`, backgroundColor: getPlacementColor(p.name) }
                                            ]} 
                                        />
                                    </View>
                                </View>
                            );
                        })}
                        {stats?.topPlacements.length === 0 && (
                            <Text style={styles.emptyText}>광고 시청 기록이 없습니다.</Text>
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

            {tooltip.visible && (
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
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center' },
    summaryLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    summaryValue: { fontSize: 24, fontWeight: '900' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
    chartCard: { padding: 20, borderRadius: 24 },
    chartContainer: { 
        height: 150, 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        paddingBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    chartBarWrapper: { alignItems: 'center', width: 40 },
    multiBarContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%' },
    bar: { borderRadius: 4 },
    barLabel: { fontSize: 10, marginTop: 8, color: '#999', position: 'absolute', bottom: -18 },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingHorizontal: 4, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, fontWeight: '600', color: '#666' },
    placementCard: { padding: 20, borderRadius: 24 },
    placementItem: { marginBottom: 18 },
    placementInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    placementName: { fontSize: 15, fontWeight: '700' },
    placementCount: { fontSize: 13, fontWeight: '600' },
    progressContainer: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 5 },
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
