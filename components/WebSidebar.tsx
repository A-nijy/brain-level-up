import React from 'react';
import { StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useSegments } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function WebSidebar() {
    const router = useRouter();
    const segments = useSegments();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const { profile, signOut } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isInAdminMode = segments[0] === 'admin';

    const menuItems = [
        { label: '나의 암기장', icon: 'book', route: '/(tabs)', id: 'index' },
        { label: '자료실', icon: 'globe', route: '/(tabs)/shared', id: 'shared' },
        { label: '학습 통계', icon: 'bar-chart', route: '/(tabs)/stats', id: 'stats' },
        { label: '환경 설정', icon: 'gear', route: '/(tabs)/settings', id: 'settings' },
    ];

    const adminItems = [
        { label: '관리자 홈', icon: 'dashboard', route: '/admin', id: 'index' },
        { label: '사용자 관리', icon: 'users', route: '/admin/users', id: 'users' },
        { label: '공유 단어장 관리', icon: 'cloud', route: '/admin/shared-manager', id: 'shared-manager' },
        { label: '카테고리 관리', icon: 'tags', route: '/admin/categories', id: 'categories' },
        { label: '시스템 공지', icon: 'bullhorn', route: '/admin/notices', id: 'notices' },
        { label: '문의사항 확인', icon: 'envelope-o', route: '/admin/inquiries', id: 'inquiries' },
        { label: '알림 발송', icon: 'bell-o', route: '/admin/notifications', id: 'notifications' }
    ];

    const isActive = (itemId: string, itemRoute: string) => {
        if (itemRoute.startsWith('/admin')) {
            return segments[0] === 'admin' && (itemId === 'index' ? segments.length === 1 : segments[1] === itemId);
        }
        return segments[0] === '(tabs)' && (itemId === 'index' ? segments.length === 1 : segments[1] === itemId);
    };

    const renderItem = (item: any) => {
        const active = isActive(item.id, item.route);
        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.menuItem,
                    active && { backgroundColor: colors.tint + '15' }
                ]}
                onPress={() => router.push(item.route)}
            >
                <FontAwesome
                    name={item.icon as any}
                    size={20}
                    color={active ? colors.tint : colors.textSecondary}
                    style={styles.menuIcon}
                />
                <Text style={[
                    styles.menuLabel,
                    { color: active ? colors.tint : colors.textSecondary },
                    active && { fontWeight: 'bold' }
                ]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.sidebar, { borderRightColor: colors.border, backgroundColor: colors.cardBackground }]}>
            <View variant="transparent" style={styles.header}>
                <View style={[styles.logoCircle, { backgroundColor: colors.tint }]}>
                    <FontAwesome name="graduation-cap" size={20} color="#fff" />
                </View>
                <Text style={styles.logoText}>FlashMaster</Text>
            </View>

            {isInAdminMode ? (
                <View variant="transparent" style={styles.section}>
                    <View variant="transparent" style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.error }]}>관리자 모드</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                            <Text style={[styles.switchLink, { color: colors.tint }]}>사용자 모드</Text>
                        </TouchableOpacity>
                    </View>
                    {adminItems.map(renderItem)}
                </View>
            ) : (
                <View variant="transparent" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>메인 메뉴</Text>
                    {menuItems.map(renderItem)}
                </View>
            )}

            <View variant="transparent" style={{ flex: 1 }} />

            {!isInAdminMode && isAdmin && (
                <TouchableOpacity
                    style={[styles.adminSwitchButton, { borderColor: colors.border }]}
                    onPress={() => router.push('/admin')}
                >
                    <FontAwesome name="shield" size={16} color={colors.textSecondary} />
                    <Text style={[styles.adminSwitchText, { color: colors.textSecondary }]}>관리자 콘솔 이동</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.background }]}
                onPress={signOut}
            >
                <FontAwesome name="sign-out" size={18} color={colors.textSecondary} />
                <Text style={[styles.logoutText, { color: colors.textSecondary }]}>로그아웃</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        width: 260,
        height: '100%',
        borderRightWidth: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        paddingLeft: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuIcon: {
        width: 24,
        textAlign: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingRight: 8,
    },
    switchLink: {
        fontSize: 11,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    adminSwitchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 10,
    },
    adminSwitchText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
