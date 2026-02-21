import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Alert, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

import { useAdminStats } from '@/hooks/useAdminStats';

export default function AdminDashboardScreen() {
    const {
        stats,
        loading,
        broadcastNotification
    } = useAdminStats();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();


    const StatGridCard = ({ title, value, icon, color, trend, trendLabel }: any) => (
        <Card style={styles.webStatCard}>
            <View variant="transparent" style={styles.statHeaderRow}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                    <FontAwesome name={icon} size={20} color={color} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: (trend > 0 ? colors.success : colors.error) + '15' }]}>
                        <FontAwesome name={trend > 0 ? "line-chart" : "arrow-down"} size={10} color={trend > 0 ? colors.success : colors.error} />
                        <Text style={[styles.trendText, { color: trend > 0 ? colors.success : colors.error }]}>
                            {trend > 0 ? `+${trend}%` : `${trend}%`}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={styles.statValueText}>{value.toLocaleString()}</Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>{trendLabel}</Text>
        </Card>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <View variant="transparent" style={styles.header}>
                <Text style={styles.welcomeText}>관리자 개요</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>시스템 통계 및 관리 도구</Text>
            </View>

            <View variant="transparent" style={styles.webStatsGrid}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : (
                    <>
                        <StatGridCard title="총 사용자" value={stats?.userCount || 0} icon="users" color="#4F46E5" trendLabel="누적 회원 수" />
                        <StatGridCard title="생성된 암기장" value={stats?.libraryCount || 0} icon="book" color="#7C3AED" trendLabel="전체 암기장 개수" />
                        <StatGridCard title="저장된 단어 카드" value={stats?.itemCount || 0} icon="list-ol" color="#F59E0B" trendLabel="시스템에 등록된 총 단어" />
                        <StatGridCard title="공유 다운로드" value={stats?.totalDownloads || 0} icon="download" color="#10B981" trendLabel="자료실 누적 이용 수" />
                    </>
                )}
            </View>

            <View variant="transparent" style={styles.mainGrid}>
                <Card style={[styles.recentActivityCard, { flex: 1 }]}>
                    <Text style={styles.cardTitle}>최근 활동 로그</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary, marginBottom: 20 }]}>플랫폼 내 주요 발생 이벤트입니다.</Text>

                    {(!stats?.activities || stats.activities.length === 0) ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.textSecondary }}>최근 활동 내역이 없습니다.</Text>
                        </View>
                    ) : (
                        stats.activities.map((activity: any, idx: number) => (
                            <View key={idx} variant="transparent" style={styles.activityItem}>
                                <View style={[styles.activityDot, { backgroundColor: activity.type === 'admin_joined' ? colors.error : colors.tint }]} />
                                <View variant="transparent" style={{ flex: 1 }}>
                                    <Text style={styles.activityText}>{activity.message}</Text>
                                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                                        {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </Card>
            </View>


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 32,
    },
    header: {
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 15,
        marginTop: 4,
    },
    webStatsGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 32,
    },
    webStatCard: {
        flex: 1,
        padding: 24,
        borderRadius: 24,
        borderWidth: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    statHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValueText: {
        fontSize: 32,
        fontWeight: '800',
    },
    statSubtext: {
        fontSize: 12,
        marginTop: 8,
    },
    mainGrid: {
        flexDirection: 'row',
        gap: 24,
    },
    managementCard: {
        flex: 2,
        padding: 24,
        borderRadius: 24,
        borderWidth: 0,
    },
    recentActivityCard: {
        flex: 1,
        padding: 24,
        borderRadius: 24,
        borderWidth: 0,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    cardSub: {
        fontSize: 14,
        marginTop: 2,
    },
    addBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    menuGrid: {
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    menuIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuInfo: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    menuItemSub: {
        fontSize: 13,
    },
    activityItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    activityText: {
        fontSize: 14,
        lineHeight: 20,
    },
    activityTime: {
        fontSize: 12,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 400,
        padding: 24,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    modalButtonText: {
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    }
});
