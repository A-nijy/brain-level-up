import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AdminService } from '@/services/AdminService';
import { SimpleBarChart } from '@/components/stats/SimpleBarChart';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';

export default function AdminAnalysisScreen() {
    const [loading, setLoading] = useState(true);
    const [distribution, setDistribution] = useState<number[]>([]);
    const [funnel, setFunnel] = useState<any>(null);
    const [popular, setPopular] = useState<any[]>([]);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    useEffect(() => {
        async function loadData() {
            try {
                const [dist, fun, pop] = await Promise.all([
                    AdminService.getLogDistribution(),
                    AdminService.getFunnelStats(),
                    AdminService.getPopularTopics()
                ]);
                setDistribution(dist);
                setFunnel(fun);
                setPopular(pop);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const labels = distribution.map((_, i) => i % 4 === 0 ? `${i}시` : '');

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen options={{ title: '사용자 행태 분석' }} />

            <View variant="transparent" style={styles.grid}>
                {/* 1. 시간대별 접속 분포 */}
                <Card style={styles.fullCard}>
                    <Text style={styles.cardTitle}>접속 시간대 분포 (최근 7일)</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>사용자들이 주로 어떤 시간에 학습을 시작하는지 확인합니다.</Text>
                    <SimpleBarChart data={distribution} labels={labels} height={180} color="#6366F1" />
                </Card>

                {/* 2. 학습 퍼널 (Funnel) */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>학습 전환 퍼널</Text>
                    <View variant="transparent" style={styles.funnelContainer}>
                        <FunnelRow label="단어장 생성" count={funnel?.stage1} percent={100} color="#10B981" />
                        <FunnelRow label="단어 추가" count={funnel?.stage2} percent={funnel?.stage1 ? Math.round((funnel.stage2 / funnel.stage1) * 100) : 0} color="#F59E0B" />
                        <FunnelRow label="학습 실천 (30일내)" count={funnel?.stage3} percent={funnel?.stage2 ? Math.round((funnel.stage3 / funnel.stage2) * 100) : 0} color="#EF4444" />
                    </View>
                </Card>

                {/* 3. 인기 주제 랭킹 */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>인기 단어장/주제 랭킹</Text>
                    <View variant="transparent" style={{ marginTop: 16 }}>
                        {popular.map((item, idx) => (
                            <View key={idx} variant="transparent" style={styles.rankItem}>
                                <Text style={styles.rankNum}>{idx + 1}</Text>
                                <View variant="transparent" style={{ flex: 1 }}>
                                    <Text style={styles.rankTitle}>{item.shared_library_categories?.title || '기타'}</Text>
                                    <Text style={[styles.rankSub, { color: colors.textSecondary }]}>다운로드 {item.download_count}회</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
}

function FunnelRow({ label, count, percent, color }: any) {
    return (
        <View variant="transparent" style={styles.funnelRow}>
            <View variant="transparent" style={{ flex: 1 }}>
                <Text style={styles.funnelLabel}>{label}</Text>
                <Text style={styles.funnelCount}>{count}명</Text>
            </View>
            <View variant="transparent" style={[styles.funnelBarBase, { backgroundColor: color + '20' }]}>
                <View style={[styles.funnelBarFill, { width: `${percent}%`, backgroundColor: color }]} />
                <Text style={styles.funnelPercent}>{percent}%</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    fullCard: { width: '100%', padding: 24, borderRadius: 24 },
    card: { flex: 1, minWidth: 400, padding: 24, borderRadius: 24 },
    cardTitle: { fontSize: 18, fontWeight: '800' },
    cardSub: { fontSize: 13, marginTop: 4, marginBottom: 20 },
    funnelContainer: { marginTop: 10 },
    funnelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    funnelLabel: { fontSize: 14, fontWeight: '600' },
    funnelCount: { fontSize: 12, opacity: 0.6 },
    funnelBarBase: { flex: 2, height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    funnelBarFill: { height: '100%' },
    funnelPercent: { position: 'absolute', right: 8, top: 4, fontSize: 11, fontWeight: 'bold' },
    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    rankNum: { fontSize: 18, fontWeight: '800', width: 32, opacity: 0.5 },
    rankTitle: { fontSize: 15, fontWeight: '700' },
    rankSub: { fontSize: 12 },
});
