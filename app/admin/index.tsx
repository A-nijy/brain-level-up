import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { AdminService } from '@/services/AdminService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Modal, TextInput, Alert, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isNotifyModalVisible, setIsNotifyModalVisible] = useState(false);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await AdminService.getGlobalStats();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notifyTitle || !notifyMessage) {
            Alert.alert('오류', '제목과 내용을 모두 입력해주세요.');
            return;
        }

        console.log('[AdminUI] Attempting to send notification:', { notifyTitle, notifyMessage });

        setIsSending(true);
        try {
            await AdminService.broadcastNotification(notifyTitle, notifyMessage);
            console.log('[AdminUI] Broadcast success response received.');
            Alert.alert('성공', '전체 사용자에게 알림이 전송되었습니다.');
            setIsNotifyModalVisible(false);
            setNotifyTitle('');
            setNotifyMessage('');
        } catch (error: any) {
            console.error('[AdminUI] Broadcast error:', error);
            Alert.alert('실패', error.message || '알림 전송 중 오류가 발생했습니다.');
        } finally {
            setIsSending(false);
        }
    };

    const StatCard = ({ title, value, icon, color }: any) => (
        <Card style={styles.statCard}>
            <View variant="transparent" style={styles.statHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <FontAwesome name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
        </Card>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View variant="transparent" style={styles.header}>
                <Text style={styles.welcomeText}>Admin Overview</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>System statistics and management tools</Text>
            </View>

            <View variant="transparent" style={styles.statsGrid}>
                <StatCard title="Total Users" value={stats?.userCount || 0} icon="users" color="#4F46E5" />
                <StatCard title="Total Libraries" value={stats?.libraryCount || 0} icon="book" color="#7C3AED" />
                <StatCard title="Total Items" value={stats?.itemCount || 0} icon="list" color="#EC4899" />
                <StatCard title="Downloads" value={stats?.totalDownloads || 0} icon="download" color="#10B981" />
            </View>

            <View variant="transparent" style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Management Menus</Text>

                <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/admin/users')}>
                    <LinearGradient
                        colors={[colors.tint, colors.primaryGradient[1]]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.menuGradient}
                    >
                        <View variant="transparent" style={styles.menuContent}>
                            <FontAwesome name="user-circle" size={24} color="#fff" />
                            <View variant="transparent" style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>User Management</Text>
                                <Text style={styles.menuSub}>Manage roles and membership levels</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/admin/shared-manager')}>
                    <LinearGradient
                        colors={['#7C3AED', '#5B21B6']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.menuGradient}
                    >
                        <View variant="transparent" style={styles.menuContent}>
                            <FontAwesome name="cloud" size={24} color="#fff" />
                            <View variant="transparent" style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Shared Library Manager</Text>
                                <Text style={styles.menuSub}>Curate and manage marketplace content</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => setIsNotifyModalVisible(true)}>
                    <LinearGradient
                        colors={['#EC4899', '#DB2777']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.menuGradient}
                    >
                        <View variant="transparent" style={styles.menuContent}>
                            <FontAwesome name="send" size={22} color="#fff" />
                            <View variant="transparent" style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>Broadcast Notification</Text>
                                <Text style={styles.menuSub}>Send a message to all users</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Notification Modal */}
            <Modal
                visible={isNotifyModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsNotifyModalVisible(false)}
            >
                <View variant="transparent" style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Broadcast Notification</Text>

                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Notification title..."
                            placeholderTextColor={colors.textSecondary}
                            value={notifyTitle}
                            onChangeText={setNotifyTitle}
                        />

                        <Text style={styles.inputLabel}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter message content..."
                            placeholderTextColor={colors.textSecondary}
                            value={notifyMessage}
                            onChangeText={setNotifyMessage}
                            multiline
                            numberOfLines={4}
                        />

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.border + '30' }]}
                                onPress={() => setIsNotifyModalVisible(false)}
                                disabled={isSending}
                            >
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={handleSendNotification}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send All</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 30,
        paddingTop: 40,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 16,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    statCard: {
        width: (width - 60) / 2,
        marginBottom: 20,
        padding: 20,
        borderRadius: 24,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statTitle: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    menuSection: {
        padding: 30,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuButton: {
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    menuGradient: {
        padding: 24,
    },
    menuContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    menuSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        padding: 24,
        borderRadius: 30,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        gap: 12,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center',
    }
});
