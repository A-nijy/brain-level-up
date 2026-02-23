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

import { Strings } from '@/constants/Strings';

export default function AdminDashboardScreen() {
    const {
        stats,
        advancedStats,
        loading,
        broadcastNotification
    } = useAdminStats();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    const StatGridCard = ({ title, value, icon, color, trend, trendLabel, isCurrency, onPress }: any) => (
        <Card style={styles.webStatCard} onPress={onPress}>
            <View variant="transparent" style={styles.statHeaderRow}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                    <FontAwesome name={icon as any} size={20} color={color} />
                </View>
                {trend !== undefined && (
                    <View style={[styles.trendBadge, { backgroundColor: (trend >= 0 ? colors.success : colors.error) + '15' }]}>
                        <FontAwesome name={(trend >= 0 ? "line-chart" : "arrow-down") as any} size={10} color={trend >= 0 ? colors.success : colors.error} />
                        <Text style={[styles.trendText, { color: trend >= 0 ? colors.success : colors.error }]}>
                            {trend >= 0 ? `+${trend}` : `${trend}`}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={styles.statValueText}>
                {isCurrency ? `₩${value.toLocaleString()}` : value.toLocaleString()}
            </Text>
            <View variant="transparent" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>{trendLabel}</Text>
                <FontAwesome name={Strings.admin.icons.arrowRight as any} size={12} color={colors.textSecondary + '60'} />
            </View>
        </Card>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <View variant="transparent" style={styles.header}>
                <View variant="transparent" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View variant="transparent">
                        <Text style={styles.welcomeText}>{Strings.admin.welcome}</Text>
                        <Text style={[styles.subText, { color: colors.textSecondary }]}>{Strings.admin.subWelcome}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.tint }]}
                        onPress={() => router.push('/admin/analysis')}
                    >
                        <FontAwesome name={Strings.admin.icons.analysis as any} size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.addBtnText}>{Strings.admin.viewAnalysis}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.cardTitle, { marginBottom: 16 }]}>{Strings.admin.essentialStats}</Text>
            <View variant="transparent" style={styles.webStatsGrid}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : (
                    <>
                        <StatGridCard
                            title={Strings.admin.stats.dau}
                            value={advancedStats?.dau || 0}
                            icon={Strings.admin.icons.dau}
                            color="#F59E0B"
                            trendLabel={Strings.admin.subLabels.mau(advancedStats?.mau || 0)}
                            onPress={() => router.push('/admin/stats/dau')}
                        />
                        <StatGridCard
                            title={Strings.admin.stats.newUsers}
                            value={advancedStats?.newUsersToday || 0}
                            icon={Strings.admin.icons.newUsers}
                            color="#10B981"
                            trend={advancedStats?.newUsersToday - advancedStats?.newUsersYesterday}
                            trendLabel={Strings.admin.subLabels.trend}
                            onPress={() => router.push('/admin/stats/new_users')}
                        />
                        <StatGridCard
                            title={Strings.admin.stats.revenue}
                            value={advancedStats?.estRevenue || 0}
                            icon={Strings.admin.icons.revenue}
                            color="#4F46E5"
                            isCurrency
                            trendLabel={Strings.admin.subLabels.adViews(advancedStats?.adViews || 0)}
                            onPress={() => router.push('/admin/stats/revenue')}
                        />
                        <StatGridCard
                            title={Strings.admin.stats.error}
                            value={advancedStats?.errorCount || 0}
                            icon={Strings.admin.icons.error}
                            color={advancedStats?.errorCount > 0 ? colors.error : "#6B7280"}
                            trendLabel={Strings.admin.subLabels.error24h}
                            onPress={() => router.push('/admin/stats/errors')}
                        />
                    </>
                )}
            </View>

            <Text style={[styles.cardTitle, { marginBottom: 16, marginTop: 16 }]}>{Strings.admin.cumulativeStats}</Text>
            <View variant="transparent" style={styles.webStatsGrid}>
                {loading ? null : (
                    <>
                        <StatGridCard title={Strings.admin.stats.totalUsers} value={stats?.userCount || 0} icon={Strings.admin.icons.users} color="#6366F1" trendLabel={Strings.admin.subLabels.userTotal} onPress={() => router.push('/admin/users')} />
                        <StatGridCard title={Strings.admin.stats.totalLibraries} value={stats?.libraryCount || 0} icon={Strings.admin.icons.libraries} color="#8B5CF6" trendLabel={Strings.admin.subLabels.libTotal} onPress={() => router.push('/admin/shared-manager')} />
                        <StatGridCard title={Strings.admin.stats.avgStudy} value={advancedStats?.avgStudyTimeMinutes || 0} icon={Strings.admin.icons.study} color="#EC4899" trendLabel={Strings.admin.subLabels.avgMinute} onPress={() => router.push('/admin/analysis')} />
                        <StatGridCard title={Strings.admin.stats.totalDownloads} value={stats?.totalDownloads || 0} icon={Strings.admin.icons.download} color="#06B6D4" trendLabel={Strings.admin.subLabels.downTotal} onPress={() => router.push('/admin/analysis')} />
                    </>
                )}
            </View>

            <View variant="transparent" style={styles.mainGrid}>
                <Card style={[styles.recentActivityCard, { flex: 1 }]}>
                    <Text style={styles.cardTitle}>{Strings.admin.recentActivity}</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary, marginBottom: 20 }]}>{Strings.admin.recentActivitySub}</Text>

                    {(!stats?.activities || stats.activities.length === 0) ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.textSecondary }}>{Strings.admin.noActivity}</Text>
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
    webStatCardWrapper: {
        flex: 1,
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
