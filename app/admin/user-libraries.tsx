import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AdminService } from '@/services/AdminService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function UserLibrariesScreen() {
    const { userId, email } = useLocalSearchParams<{ userId: string; email?: string }>();
    const [loading, setLoading] = useState(true);
    const [libraries, setLibraries] = useState<any[]>([]);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { showAlert } = useAlert();

    useEffect(() => {
        async function loadLibraries() {
            if (typeof userId !== 'string') return;
            try {
                const data = await AdminService.getUserLibraries(userId);
                setLibraries(data);
            } catch (e: any) {
                console.error(e);
                showAlert({ title: Strings.common.error, message: '사용자의 암기장을 불러오는데 실패했습니다.' });
            } finally {
                setLoading(false);
            }
        }
        loadLibraries();
    }, [userId]);

    const renderItem = ({ item }: { item: any }) => (
        <Card 
            style={styles.card}
            onPress={() => router.push({
                pathname: "/admin/user-library/[id]",
                params: { id: item.id, title: item.title }
            } as any)}
        >
            <View variant="transparent" style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.is_public ? (
                    <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.tint }]}>공개</Text>
                    </View>
                ) : (
                    <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>비공개</Text>
                    </View>
                )}
            </View>
            {item.description && (
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
            <View variant="transparent" style={styles.cardFooter}>
                <View variant="transparent" style={styles.iconText}>
                    <FontAwesome name="book" size={14} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: colors.textSecondary, marginLeft: 6 }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: email ? `${email}의 암기장` : '사용자 암기장',
                }}
            />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={libraries}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View variant="transparent" style={styles.emptyContainer}>
                            <FontAwesome name="folder-open-o" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                생성된 암기장이 없습니다.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 24, gap: 16 },
    card: {
        padding: 20,
        borderRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardDesc: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    iconText: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
