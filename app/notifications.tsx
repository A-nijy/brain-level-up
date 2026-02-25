import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { Notification } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function NotificationsScreen() {
    const { profile } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

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

    const handleDelete = async (id: string) => {
        const confirmDeleteLogic = async () => {
            try {
                await NotificationService.deleteNotification(id);
                setNotifications(prev => prev.filter(n => n.id !== id));
            } catch (error) {
                console.error('Failed to delete notification:', error);
            }
        };

        showAlert({
            title: Strings.notifications.deleteTitle,
            message: Strings.notifications.deleteConfirm,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                { text: Strings.common.delete, style: 'destructive', onPress: confirmDeleteLogic }
            ]
        });
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <Card
            style={[styles.notificationCard, !item.is_read && { borderLeftWidth: 4, borderLeftColor: colors.tint }]}
            onPress={async () => {
                if (!item.is_read) {
                    await handleMarkAsRead(item.id);
                }
                router.push(`/notification/${item.id}` as any);
            }}
            activeOpacity={0.7}
        >
            <View variant="transparent" style={styles.contentRow}>
                <View variant="transparent" style={[styles.iconContainer, { backgroundColor: item.is_read ? colors.border + '30' : colors.tint + '15' }]}>
                    <FontAwesome
                        name={item.type === 'STUDY_REMINDER' ? 'clock-o' : 'bell'}
                        size={18}
                        color={item.is_read ? colors.textSecondary : colors.tint}
                    />
                </View>
                <View variant="transparent" style={styles.textContainer}>
                    <View variant="transparent" style={styles.titleRow}>
                        <Text style={[styles.title, item.is_read && { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <TouchableOpacity onPress={async () => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <FontAwesome name="trash-o" size={16} color={colors.error + '80'} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.message}
                    </Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                title: Strings.notifications.screenTitle,
                headerRight: () => (
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={{ marginRight: 15 }}>
                        <Text style={{ color: colors.tint, fontWeight: 'bold' }}>{Strings.notifications.markAllRead}</Text>
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
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.notifications.empty}</Text>
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
        flex: 1,
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
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    deleteBtn: {
        padding: 4,
        marginLeft: 8,
    }
});
