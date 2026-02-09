import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { Notification } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const { profile } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    useEffect(() => {
        loadNotifications();
    }, [profile]);

    const loadNotifications = async () => {
        if (!profile) return;
        try {
            const data = await NotificationService.getNotifications(profile.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!profile) return;
        try {
            await NotificationService.markAllAsRead(profile.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => !item.is_read && handleMarkAsRead(item.id)}
        >
            <Card style={[styles.notificationCard, !item.is_read && { borderLeftWidth: 4, borderLeftColor: colors.tint }]}>
                <View variant="transparent" style={styles.contentRow}>
                    <View style={[styles.iconContainer, { backgroundColor: item.is_read ? colors.border + '30' : colors.tint + '15' }]}>
                        <FontAwesome
                            name={item.type === 'STUDY_REMINDER' ? 'clock-o' : 'bell'}
                            size={18}
                            color={item.is_read ? colors.textSecondary : colors.tint}
                        />
                    </View>
                    <View variant="transparent" style={styles.textContainer}>
                        <Text style={[styles.title, item.is_read && { color: colors.textSecondary }]}>{item.title}</Text>
                        <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
                        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                title: '알림',
                headerRight: () => (
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={{ marginRight: 15 }}>
                        <Text style={{ color: colors.tint, fontWeight: 'bold' }}>모두 읽음</Text>
                    </TouchableOpacity>
                )
            }} />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome name="bell-slash-o" size={50} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>새로운 알림이 없습니다.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    notificationCard: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 20,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    date: {
        fontSize: 11,
        color: '#94A3B8',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
