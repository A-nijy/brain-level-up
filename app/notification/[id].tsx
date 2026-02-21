import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { Notification } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function NotificationDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profile } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetail();
    }, [id, profile]);

    const loadDetail = async () => {
        if (!profile || !id) return;
        try {
            const data = await NotificationService.getNotifications(profile.id, 50);
            const found = data.find(n => n.id === id);

            if (found) {
                setNotification(found);
                if (!found.is_read) {
                    await NotificationService.markAsRead(found.id);
                }
            } else {
                if (Platform.OS === 'web') {
                    window.alert('알림을 찾을 수 없습니다.');
                } else {
                    Alert.alert('오류', '알림을 찾을 수 없습니다.');
                }
                router.back();
            }
        } catch (error) {
            console.error('Failed to load notification detail:', error);
            if (Platform.OS === 'web') {
                window.alert('알림을 불러오는 데 실패했습니다.');
            } else {
                Alert.alert('오류', '알림을 불러오는 데 실패했습니다.');
            }
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!notification) return;

        const confirmDelete = async () => {
            try {
                await NotificationService.deleteNotification(notification.id);
                router.back();
            } catch (error) {
                console.error('Failed to delete notification:', error);
                if (Platform.OS === 'web') {
                    window.alert('알림 삭제에 실패했습니다.');
                } else {
                    Alert.alert('오류', '알림 삭제에 실패했습니다.');
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('이 알림을 삭제하시겠습니까?')) {
                confirmDelete();
            }
        } else {
            Alert.alert('알림 삭제', '이 알림을 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: confirmDelete }
            ]);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: '알림 상세' }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (!notification) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: '알림 상세' }} />
                <Text style={{ color: colors.textSecondary }}>데이터가 없습니다.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <Stack.Screen options={{
                title: '알림 상세',
                headerRight: () => (
                    <TouchableOpacity onPress={handleDelete} style={{ marginRight: 15 }}>
                        <FontAwesome name="trash-o" size={20} color={colors.error} />
                    </TouchableOpacity>
                )
            }} />

            <Card style={styles.card}>
                <View variant="transparent" style={styles.headerRow}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.tint + '15' }]}>
                        <FontAwesome
                            name={notification.type === 'STUDY_REMINDER' ? 'clock-o' : 'bell'}
                            size={14}
                            color={colors.tint}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.typeText, { color: colors.tint }]}>
                            {notification.type === 'STUDY_REMINDER' ? '학습 알림' : '시스템 알림'}
                        </Text>
                    </View>
                    <Text style={styles.date}>{new Date(notification.created_at).toLocaleString()}</Text>
                </View>

                <Text style={styles.title}>{notification.title}</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.message, { color: colors.textSecondary }]}>{notification.message}</Text>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    card: {
        padding: 24,
        borderRadius: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    typeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#94A3B8',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 20,
        lineHeight: 30,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        lineHeight: 26,
    }
});
