import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminService } from '@/services/AdminService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { AdminStatsService } from '@/services/admin/AdminStatsService';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

interface UserDetailData {
    profile: any;
    libraryCount: number;
    recentLogs: any[];
    usageStats?: {
        today: { app: number, web: number, total: number }
    };
    adStats?: {
        summary: { today: number, total: number }
    };
    featureStats?: {
        summary: { today: number, total: number }
    };
    timeline?: {
        left: any[],
        right: any[]
    };
}

export default function UserDetailScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<UserDetailData | null>(null);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { showAlert } = useAlert();

    useEffect(() => {
        async function loadUser() {
            if (typeof id !== 'string') return;
            try {
                const { profile, libraryCount, recentLogs } = await AdminService.getUserDetail(id as string);
                const usage = await AdminStatsService.getUserUsageStats(id as string);
                const ads = await AdminStatsService.getUserAdUsageStats(id as string);
                const features = await AdminStatsService.getUserFeatureUsageStats(id as string);
                const timeline = await AdminStatsService.getUserActivityTimeline(id as string);
            
                setData({ 
                    profile, 
                    libraryCount, 
                    recentLogs, 
                    usageStats: usage, 
                    adStats: ads, 
                    featureStats: features,
                    timeline: timeline
                });
            } catch (e: any) {
                console.error(e);
                showAlert({ title: Strings.common.error, message: Strings.adminUserDetail.fetchError });
                router.back();
            }
            finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [id]);

    const refreshTimeline = async () => {
        if (!id) return;
        try {
            const timeline = await AdminStatsService.getUserActivityTimeline(id as string);
            setData(prev => prev ? { ...prev, timeline } : null);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePruneLogs = async () => {
        showAlert({
            title: '로그 정리',
            message: '30일보다 오래된 모든 사용자의 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            buttons: [
                { text: '취소', style: 'cancel' },
                { 
                    text: '삭제', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const count = await AdminStatsService.pruneOldLogs(30);
                            showAlert({ title: '성공', message: `${count}개의 오래된 로그가 정리되었습니다.` });
                            refreshTimeline();
                        } catch (e) {
                            showAlert({ title: '실패', message: '로그 정리 중 에러가 발생했습니다.' });
                        }
                    }
                }
            ]
        });
    };

    const handleDeleteUserLogs = async () => {
        showAlert({
            title: '사용자 로그 삭제',
            message: '이 사용자의 모든 활동 기록을 삭제하시겠습니까?',
            buttons: [
                { text: '취소', style: 'cancel' },
                { 
                    text: '삭제', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AdminStatsService.deleteUserLogs(id as string);
                            showAlert({ title: '성공', message: '사용자의 모든 로그가 삭제되었습니다.' });
                            refreshTimeline();
                        } catch (e) {
                            showAlert({ title: '실패', message: '로그 삭제 중 에러가 발생했습니다.' });
                        }
                    }
                }
            ]
        });
    };

    if (loading || !data) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ title: paramTitle || Strings.adminUserDetail.title }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const { profile, libraryCount, recentLogs, usageStats, adStats, featureStats } = data;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen
                options={{
                    title: profile.email || paramTitle || Strings.adminUserDetail.title,
                }}
            />

            {/* 프로필 요약 카드 */}
            <Card style={styles.profileCard}>
                <View variant="transparent" style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.tint }]}>
                            {profile.email ? profile.email[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View variant="transparent" style={{ flex: 1 }}>
                        <Text style={styles.emailText}>{profile.email}</Text>
                        <Text style={[styles.userId, { color: colors.textSecondary }]}>UID: {profile.id}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: profile.membership_level === 'PRO' ? '#E0E7FF' : colors.cardBackground }]}>
                        <Text style={[styles.badgeText, { color: profile.membership_level === 'PRO' ? '#4F46E5' : colors.textSecondary }]}>
                            {profile.membership_level}
                        </Text>
                    </View>
                </View>

                <View variant="transparent" style={styles.statsRow}>
                    <TouchableOpacity
                        style={[styles.statBox, styles.statBoxClickable, { backgroundColor: colors.tint + '08', borderColor: colors.tint + '20' }]}
                        onPress={() => router.push({
                            pathname: '/admin/user-libraries' as any,
                            params: { userId: profile.id, email: profile.email }
                        })}
                        activeOpacity={0.6}
                    >
                        <View variant="transparent" style={{ position: 'absolute', top: 8, right: 8 }}>
                            <FontAwesome name="chevron-right" size={10} color={colors.tint} />
                        </View>
                        <Text style={[styles.statVal, { color: colors.tint }]}>{libraryCount}</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statLibrary}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statBox, styles.statBoxClickable, { backgroundColor: colors.tint + '08', borderColor: colors.tint + '20' }]}
                        onPress={() => router.push(`/admin/users/usage/${id}`)}
                        activeOpacity={0.6}
                    >
                        <View variant="transparent" style={{ position: 'absolute', top: 8, right: 8 }}>
                            <FontAwesome name="chevron-right" size={10} color={colors.tint} />
                        </View>
                        <Text style={[styles.statVal, { color: colors.tint }]}>{usageStats?.today.total || 0}분</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statTodayUsage}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statBox, styles.statBoxClickable, { backgroundColor: colors.tint + '08', borderColor: colors.tint + '20' }]}
                        onPress={() => router.push(`/admin/users/ad-usage/${id}`)}
                        activeOpacity={0.6}
                    >
                        <View variant="transparent" style={{ position: 'absolute', top: 8, right: 8 }}>
                            <FontAwesome name="chevron-right" size={10} color={colors.tint} />
                        </View>
                        <Text style={[styles.statVal, { color: colors.tint }]}>{adStats?.summary.today || 0}회</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statTodayAd}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statBox, styles.statBoxClickable, { backgroundColor: colors.tint + '08', borderColor: colors.tint + '20' }]}
                        onPress={() => router.push(`/admin/users/feature-usage/${id}`)}
                        activeOpacity={0.6}
                    >
                        <View variant="transparent" style={{ position: 'absolute', top: 8, right: 8 }}>
                            <FontAwesome name="chevron-right" size={10} color={colors.tint} />
                        </View>
                        <Text style={[styles.statVal, { color: colors.tint }]}>{featureStats?.summary.today || 0}회</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>오늘 기능 사용</Text>
                    </TouchableOpacity>
                    <View variant="transparent" style={styles.statBox}>
                        <Text style={styles.statVal}>{new Date(profile.created_at).toLocaleDateString()}</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statJoin}</Text>
                    </View>
                </View>
            </Card>

            {/* 타임라인 헤더 및 로그 관리 버튼 */}
            <View variant="transparent" style={styles.timelineHeaderRow}>
                <Text style={styles.sectionTitle}>활동 타임라인</Text>
                <View variant="transparent" style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handlePruneLogs}>
                        <FontAwesome name="eraser" size={14} color={colors.textSecondary} />
                        <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>전체 30일 정리</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleDeleteUserLogs}>
                        <FontAwesome name="trash-o" size={14} color="#ef4444" />
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>로그 비우기</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 2컬럼 타임라인 뷰 (고정 높이 스크롤박스) */}
            <View variant="transparent" style={styles.timelineScrollContainer}>
                {/* 왼쪽: 시스템/활동 */}
                <View variant="transparent" style={styles.timelineCol}>
                    <Text style={[styles.colTitle, { color: colors.textSecondary }]}>시스템 및 일반 활동</Text>
                    <ScrollView style={styles.timelineInnerScroll} contentContainerStyle={styles.timelineInnerContent} nestedScrollEnabled={true}>
                        {data.timeline?.left.map((item) => (
                            <View key={item.id} style={[styles.timelineItem, { backgroundColor: colors.cardBackground, borderLeftColor: item.color }]}>
                                <View variant="transparent" style={styles.itemHeader}>
                                    <FontAwesome name={item.icon || 'circle'} size={14} color={item.color} />
                                    <Text style={styles.itemTime}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                                <Text style={[styles.itemText, { color: colors.text }]}>{item.message}</Text>
                            </View>
                        ))}
                        {data.timeline?.left.length === 0 && (
                            <Text style={styles.emptyText}>활동 내역 없음</Text>
                        )}
                    </ScrollView>
                </View>

                {/* 중앙 구분선 */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* 오른쪽: 콘텐츠/뮤테이션 */}
                <View variant="transparent" style={styles.timelineCol}>
                    <Text style={[styles.colTitle, { color: colors.textSecondary }]}>이용 동태 (암기장/문항)</Text>
                    <ScrollView style={styles.timelineInnerScroll} contentContainerStyle={styles.timelineInnerContent} nestedScrollEnabled={true}>
                        {data.timeline?.right.map((item) => (
                            <View key={item.id} style={[styles.timelineItem, { backgroundColor: colors.cardBackground, borderLeftColor: item.color }]}>
                                <View variant="transparent" style={styles.itemHeader}>
                                    <FontAwesome name={item.icon || 'circle'} size={14} color={item.color} />
                                    <Text style={styles.itemTime}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                                <Text style={[styles.itemText, { color: colors.text }]}>{item.message}</Text>
                            </View>
                        ))}
                        {data.timeline?.right.length === 0 && (
                            <Text style={styles.emptyText}>동태 내역 없음</Text>
                        )}
                    </ScrollView>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.backBtn, { borderColor: colors.border }]}
                onPress={() => router.back()}
            >
                <Text style={[styles.backBtnText, { color: colors.text }]}>{Strings.adminUserDetail.backBtn}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    profileCard: { padding: 24, borderRadius: 24, marginBottom: 24 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 24, fontWeight: '800' },
    emailText: { fontSize: 20, fontWeight: '700' },
    userId: { fontSize: 12, marginTop: 4 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statBoxClickable: { borderRadius: 16, borderWidth: 1, marginHorizontal: 4 },
    statVal: { fontSize: 18, fontWeight: '800' },
    statLab: { fontSize: 12, marginTop: 4 },
    timelineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    headerActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    timelineScrollContainer: { flexDirection: 'row', gap: 16, marginBottom: 24, height: 480 },
    timelineCol: { flex: 1, height: '100%' },
    colTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    timelineInnerScroll: { flex: 1 },
    timelineInnerContent: { paddingRight: 4 },
    timelineItem: { padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    itemTime: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    itemText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    divider: { width: 1, alignSelf: 'stretch', opacity: 0.5 },
    emptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
    backBtn: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    backBtnText: { fontSize: 15, fontWeight: '600' },
});
