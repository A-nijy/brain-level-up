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

// 기능명 한글 매핑
const FEATURE_NAMES: { [key: string]: string } = {
    'EXPORT_PDF': 'PDF 내보내기',
    'IMPORT_DATA': '데이터 가져오기 (CSV/XLSX)',
    'DOWNLOAD_SHARED': '자료실 다운로드',
    'SHARE_LIBRARY': '자료실 등록',
    'START_STUDY': '학습하기',
    'VIEW_STUDY_STATUS': '상세 학습 상태도',
    'PUSH_NOTIFICATION': '푸시 알림 기능',
    'UNKNOWN': '기타/미분류'
};

const FEATURE_COLORS: { [key: string]: string } = {
    'EXPORT_PDF': '#ef4444',     // 빨강
    'IMPORT_DATA': '#3b82f6',    // 파랑
    'DOWNLOAD_SHARED': '#f97316', // 주황
    'SHARE_LIBRARY': '#10b981',  // 초록
    'START_STUDY': '#8b5cf6',    // 보라
    'VIEW_STUDY_STATUS': '#f59e0b', // 호박
    'PUSH_NOTIFICATION': '#06b6d4', // 청록
    'UNKNOWN': '#94a3b8'         // 슬레이트
};

export default function UserFeatureUsageDetailScreen() {
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

            const featureStats = await AdminStatsService.getUserFeatureUsageStats(id as string);
            setStats(featureStats);
        } catch (error) {
            console.error('Failed to load feature usage data:', error);
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

    const chartData = stats?.chartData || [];
    const maxCount = Math.max(...chartData.map((d: any) => d.count), 5); // 최소 5는 확보

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ 
                title: '기능 사용 상세 분석',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome name="chevron-left" size={20} color={colors.text} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View variant="transparent" style={styles.header}>
                    <Text style={styles.emailText}>{userEmail}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>사용자별 주요 기능 활용 지표 리포트</Text>
                </View>

                {/* 요약 카드 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>사용량 요약</Text>
                    <View variant="transparent" style={styles.summaryRow}>
                        <Card style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>오늘 사용 횟수</Text>
                            <Text style={[styles.summaryValue, { color: colors.tint }]}>{stats?.summary.today}회</Text>
                        </Card>
                        <Card style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>누적 사용 횟수</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{stats?.summary.total}회</Text>
                        </Card>
                    </View>
                </View>

                {/* 7일 추이 그래프 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>최근 7일 사용 추이 (횟수)</Text>
                    <Card style={styles.chartCard}>
                        <View variant="transparent" style={styles.chartContainer}>
                            {chartData.map((day: any, index: number) => (
                                <View key={index} variant="transparent" style={styles.chartBarWrapper}>
                                    <View variant="transparent" style={styles.sideBySideRow}>
                                        {Object.entries(day.features).map(([feature, count]) => (
                                            <View 
                                                key={feature} 
                                                variant="transparent"
                                                {...({ 
                                                    onMouseEnter: (e: any) => {
                                                        const { clientX, clientY } = e.nativeEvent;
                                                        setTooltip({ 
                                                            visible: true, 
                                                            x: clientX, 
                                                            y: clientY, 
                                                            text: `${FEATURE_NAMES[feature] || feature}: ${count}회` 
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
                                                        height: (count as number) > 0 ? Math.max(((count as number) / maxCount) * 140, 4) : 2, 
                                                        backgroundColor: FEATURE_COLORS[feature] || FEATURE_COLORS.UNKNOWN,
                                                    }
                                                ]} 
                                            />
                                        ))}
                                        {day.count === 0 && <View style={[styles.sideBar, { height: 2, backgroundColor: colors.border }]} />}
                                    </View>
                                    <Text style={styles.barLabel}>{day.date.split('-').slice(1).join('/')}</Text>
                                </View>
                            ))}
                        </View>
                        
                        {/* 범례 추가 */}
                        <View variant="transparent" style={styles.legendContainer}>
                            {Object.entries(FEATURE_NAMES).map(([key, name]) => (
                                <View key={key} variant="transparent" style={styles.legendItem}>
                                    <View variant="transparent" style={[styles.legendColor, { backgroundColor: FEATURE_COLORS[key] }]} />
                                    <Text style={styles.legendLabel}>{name}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.legendNotice, { color: colors.textSecondary }]}>* 막대 위에 마우스를 올리면 상세 정보가 표시됩니다.</Text>
                    </Card>
                </View>

                {/* 기능별 비중 리스트 */}
                <View variant="transparent" style={styles.section}>
                    <Text style={styles.sectionTitle}>기능별 사용 비중</Text>
                    <Card style={styles.listCard}>
                        {stats?.topFeatures.map((f: any, i: number) => {
                            const percentage = stats.summary.total > 0 ? ((f.count / stats.summary.total) * 100).toFixed(1) : 0;
                            return (
                                <View key={i} variant="transparent" style={[styles.listItem, i < stats.topFeatures.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '20' }]}>
                                    <View variant="transparent" style={styles.listItemContent}>
                                        <View variant="transparent" style={[styles.listColor, { backgroundColor: FEATURE_COLORS[f.name] || FEATURE_COLORS.UNKNOWN }]} />
                                        <Text style={styles.listName}>{FEATURE_NAMES[f.name] || f.name}</Text>
                                        <View variant="transparent" style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.listCount}>{f.count}회</Text>
                                            <Text style={[styles.listPercent, { color: colors.textSecondary }]}>{percentage}%</Text>
                                        </View>
                                    </View>
                                    {/* 게이지 바 추가 */}
                                    <View variant="transparent" style={styles.gaugeContainer}>
                                        <View 
                                            variant="transparent" 
                                            style={[
                                                styles.gaugeBar, 
                                                { 
                                                    width: `${percentage}%`,
                                                    backgroundColor: FEATURE_COLORS[f.name] || FEATURE_COLORS.UNKNOWN 
                                                }
                                            ]} 
                                        />
                                    </View>
                                </View>
                            );
                        })}
                        {stats?.topFeatures.length === 0 && (
                            <Text style={styles.emptyText}>사용 기록이 없습니다.</Text>
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
        paddingBottom: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    chartBarWrapper: { alignItems: 'center', flex: 1 },
    sideBySideRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 140 },
    sideBar: { width: 4, borderRadius: 2, backgroundColor: '#f0f0f0' },
    barStack: { width: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: '#f0f0f0', justifyContent: 'flex-end' },
    barLabel: { fontSize: 10, marginTop: 8, color: '#999' },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingTop: 16,
        gap: 12,
        paddingHorizontal: 4
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendColor: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    legendLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600'
    },
    legendNotice: { fontSize: 10, textAlign: 'center', marginTop: 16, fontStyle: 'italic', opacity: 0.7 },
    listCard: { padding: 4, borderRadius: 20 },
    listItem: { padding: 16 },
    listItemContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    listColor: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    listName: { fontSize: 14, fontWeight: '600', flex: 2 },
    listCount: { fontSize: 15, fontWeight: '800' },
    listPercent: { fontSize: 11, marginTop: 2 },
    gaugeContainer: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    gaugeBar: { height: '100%', borderRadius: 3 },
    backButton: { 
        marginTop: 20, 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        alignItems: 'center' 
    },
    backButtonText: { fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#999', paddingVertical: 24 },
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
    loadingText: { marginTop: 12, fontSize: 14 }
});
