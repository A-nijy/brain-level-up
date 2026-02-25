import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminService } from '@/services/AdminService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Strings } from '@/constants/Strings';

export default function UserDetailScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            if (typeof id !== 'string') return;
            try {
                const data = await AdminService.getUserDetail(id);
                setUserData(data);
            } catch (e) {
                console.error(e);
                Alert.alert(Strings.common.error, Strings.adminUserDetail.fetchError);
                router.back();
            }
            finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [id]);

    if (loading || !userData) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ title: paramTitle || Strings.adminUserDetail.title }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const { profile, libraryCount, recentLogs } = userData;

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
                    <View variant="transparent" style={styles.statBox}>
                        <Text style={styles.statVal}>{libraryCount}</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statLibrary}</Text>
                    </View>
                    <View variant="transparent" style={styles.statBox}>
                        <Text style={styles.statVal}>{recentLogs.length}</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statRecent}</Text>
                    </View>
                    <View variant="transparent" style={styles.statBox}>
                        <Text style={styles.statVal}>{new Date(profile.created_at).toLocaleDateString()}</Text>
                        <Text style={[styles.statLab, { color: colors.textSecondary }]}>{Strings.adminUserDetail.statJoin}</Text>
                    </View>
                </View>
            </Card>

            {/* 최근 학습 타임라인 */}
            <Text style={styles.sectionTitle}>{Strings.adminUserDetail.sectionActivity}</Text>
            {recentLogs.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Text style={{ color: colors.textSecondary }}>{Strings.adminUserDetail.emptyActivity}</Text>
                </Card>
            ) : (
                recentLogs.map((log: any, idx: number) => (
                    <Card key={idx} style={styles.logCard}>
                        <View variant="transparent" style={styles.logHeader}>
                            <Text style={styles.logDate}>{new Date(log.study_date).toLocaleDateString()}</Text>
                            <View variant="transparent" style={styles.logStats}>
                                <Text style={[styles.logStat, { color: colors.success }]}>{Strings.adminUserDetail.correct} {log.correct_count}</Text>
                                <Text style={[styles.logStat, { color: colors.error }]}>{Strings.adminUserDetail.wrong} {log.items_count - log.correct_count}</Text>
                            </View>
                        </View>
                        <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                            {Strings.adminUserDetail.studyTime(Math.floor(log.study_time_seconds / 60), log.study_time_seconds % 60)}
                        </Text>
                    </Card>
                ))
            )}

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
    statBox: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '800' },
    statLab: { fontSize: 12, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    emptyCard: { padding: 40, alignItems: 'center', borderRadius: 20 },
    logCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    logDate: { fontSize: 15, fontWeight: '700' },
    logStats: { flexDirection: 'row', gap: 12 },
    logStat: { fontSize: 13, fontWeight: '600' },
    logTime: { fontSize: 12 },
    backBtn: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    backBtnText: { fontSize: 15, fontWeight: '600' },
});
