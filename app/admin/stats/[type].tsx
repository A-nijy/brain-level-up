import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminService } from '@/services/AdminService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Strings } from '@/constants/Strings';

export default function AdminStatsDetailScreen() {
    const { type, title: paramTitle } = useLocalSearchParams<{ type: string; title?: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [title, setTitle] = useState(paramTitle || '');

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                let result: any[] = [];
                switch (type) {
                    case 'dau':
                        setTitle(Strings.adminStatsDetail.titleDau);
                        result = await AdminService.getDauDetails();
                        break;
                    case 'new_users':
                        setTitle(Strings.adminStatsDetail.titleNewUsers);
                        result = await AdminService.getSignupDetails();
                        break;
                    case 'errors':
                        setTitle(Strings.adminStatsDetail.titleErrors);
                        result = await AdminService.getErrorDetails();
                        break;
                    case 'revenue':
                        setTitle(Strings.adminStatsDetail.titleRevenue);
                        result = await AdminService.getAdViewDetails();
                        break;
                    default:
                        setTitle(Strings.adminStatsDetail.titleDefault);
                }
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [type]);

    const renderHeader = () => {
        switch (type) {
            case 'dau':
                return (
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 2 }]}>{Strings.adminStatsDetail.headers.userEmail}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminStatsDetail.headers.membership}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminStatsDetail.headers.lastAccess}</Text>
                    </View>
                );
            case 'new_users':
                return (
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 2 }]}>{Strings.adminStatsDetail.headers.userEmail}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminStatsDetail.headers.membership}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminStatsDetail.headers.joinDate}</Text>
                    </View>
                );
            case 'errors':
                return (
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminStatsDetail.headers.occurTime}</Text>
                        <Text style={[styles.headerCol, { flex: 2.5 }]}>{Strings.adminStatsDetail.headers.errorMessage}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminStatsDetail.headers.user}</Text>
                    </View>
                );
            case 'revenue':
                return (
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminStatsDetail.headers.watchTime}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminStatsDetail.headers.type}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminStatsDetail.headers.location}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminStatsDetail.headers.user}</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    const renderItem = ({ item, index }: any) => {
        const bg = { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' };

        switch (type) {
            case 'dau':
                return (
                    <TouchableOpacity
                        style={[styles.tableRow, bg]}
                        onPress={() => router.push(`/admin/users/${item.id}`)}
                    >
                        <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{item.email}</Text>
                        <View variant="transparent" style={{ flex: 1 }}>
                            <View style={[styles.badge, { backgroundColor: item.membership === 'PRO' ? '#E0E7FF' : colors.cardBackground }]}>
                                <Text style={[styles.badgeText, { color: item.membership === 'PRO' ? '#4F46E5' : colors.textSecondary }]}>{item.membership}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cell, { flex: 1.5, color: colors.textSecondary }]}>{new Date(item.last_access).toLocaleTimeString()}</Text>
                    </TouchableOpacity>
                );
            case 'new_users':
                return (
                    <TouchableOpacity
                        style={[styles.tableRow, bg]}
                        onPress={() => router.push(`/admin/users/${item.id}`)}
                    >
                        <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{item.email}</Text>
                        <View variant="transparent" style={{ flex: 1 }}>
                            <View style={[styles.badge, { backgroundColor: item.membership_level === 'PRO' ? '#E0E7FF' : colors.cardBackground }]}>
                                <Text style={[styles.badgeText, { color: item.membership_level === 'PRO' ? '#4F46E5' : colors.textSecondary }]}>{item.membership_level}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cell, { flex: 1.5, color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                );
            case 'errors':
                return (
                    <View style={[styles.tableRow, bg]}>
                        <Text style={[styles.cell, { flex: 1.5, fontSize: 12 }]}>{new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                        <View variant="transparent" style={{ flex: 2.5 }}>
                            <Text style={[styles.cell, { fontWeight: '700', color: colors.error }]} numberOfLines={2}>{item.message}</Text>
                            {item.path && <Text style={{ fontSize: 10, color: colors.textSecondary }}>at {item.path}</Text>}
                        </View>
                        <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{item.user}</Text>
                    </View>
                );
            case 'revenue':
                return (
                    <View style={[styles.tableRow, bg]}>
                        <Text style={[styles.cell, { flex: 1.5 }]}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>{item.reward_type}</Text>
                        <Text style={[styles.cell, { flex: 1.5 }]} numberOfLines={1}>{item.placement}</Text>
                        <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{item.user}</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: title || paramTitle }} />

            <View variant="transparent" style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <FontAwesome name="chevron-left" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{title || paramTitle}</Text>
            </View>

            <Card style={styles.tableCard}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : (
                    <FlatList
                        data={data}
                        ListHeaderComponent={renderHeader}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: colors.textSecondary }}>{Strings.adminStatsDetail.empty}</Text>
                            </View>
                        }
                    />
                )}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
    backBtn: { padding: 10 },
    title: { fontSize: 24, fontWeight: '800' },
    tableCard: { flex: 1, borderRadius: 24, overflow: 'hidden', padding: 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    tableHeader: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerCol: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    cell: { fontSize: 14 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    emptyContainer: { padding: 40, alignItems: 'center' }
});
