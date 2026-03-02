import React from 'react';
import { StyleSheet, TextInput, Image, TouchableOpacity, Platform, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Strings } from '@/constants/Strings';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import { useSegments, useRouter, useLocalSearchParams } from 'expo-router';

export default function WebHeader() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const { profile } = useAuth();
    const { actions, title: contextTitle } = useHeader();
    const segments = useSegments();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = React.useState(false);


    const { title: paramTitle } = useLocalSearchParams<{ title?: string }>();

    const getPageTitle = () => {
        if (contextTitle) return contextTitle;
        if (paramTitle) return paramTitle;

        const seg0 = segments[0] as string;
        const seg1 = segments[segments.length - 1] as string;

        if (seg0 === 'admin') {
            const adminTitleMap: Record<string, string> = {
                'index': '관리 대시보드',
                'users': '전체 사용자 관리',
                'shared-manager': '공유 콘텐츠 검수',
                'notices': '공지사항 및 알림',
                'categories': '카테고리 설정',
                'inquiries': '사용자 피드백'
            };
            return adminTitleMap[seg1] || '관리 시스템';
        }

        if (seg1 === 'index' || segments.length === 1) {
            return Strings.tabs.home;
        }

        const userTitleMap: Record<string, string> = {
            'shared': Strings.tabs.shared,
            'stats': Strings.tabs.stats,
            'settings': Strings.tabs.settings,
            'profile': Strings.settings.profile.editTitle,
            'notices': Strings.notices.screenTitle,
            'support': Strings.support.screenTitle,
            'new': Strings.support.screenTitle,
            'notifications': Strings.notifications.screenTitle,
            'shared-library': Strings.sharedDetail.screenTitle
        };

        const lastSeg = segments[segments.length - 1] as string;
        const parentSeg = segments[segments.length - 2] as string;

        // 특별 케이스 처리
        if (parentSeg === 'notices') return Strings.notices.detailTitle;
        if (parentSeg === 'shared-library') return Strings.sharedDetail.screenTitle;
        if (seg0 === 'admin') {
            if (lastSeg === 'users') return Strings.adminUsers.title;
            if (lastSeg === 'shared-management') return Strings.adminSharedManager.title;
        }

        return userTitleMap[lastSeg] || userTitleMap[seg1] || Strings.common.appName;
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingRight: 48 }]}>
            <View variant="transparent" style={styles.breadcrumbArea}>
                <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.pageTitle}>{getPageTitle()}</Text>
                </View>
            </View>

            <View variant="transparent" style={styles.actionArea}>
                {actions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={styles.iconButton}
                        onPress={action.onPress}
                        disabled={action.disabled || action.loading}
                    >
                        {action.loading ? (
                            <ActivityIndicator size="small" color={action.color || colors.tint} />
                        ) : (
                            <FontAwesome
                                name={action.icon as any}
                                size={20}
                                color={action.color || (action.disabled ? colors.textSecondary : colors.tint)}
                            />
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push('/notifications')}
                >
                    <FontAwesome name="bell-o" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View variant="transparent" style={styles.profileArea}>
                    <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
                        <FontAwesome name="user" size={18} color={colors.tint} />
                    </View>
                    <View variant="transparent" style={styles.profileText}>
                        <Text style={styles.profileName}>{profile?.nickname || profile?.email?.split('@')[0] || '사용자'}</Text>
                        <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                            {profile?.role === 'admin' ? '관리자 계정' : '일반 등급'}
                        </Text>
                    </View>
                </View>
            </View>

            {showNotifications && (
                <View style={[styles.notificationPanel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>알림</Text>
                    <View style={styles.notificationEmpty}>
                        <Text style={{ color: colors.textSecondary }}>새로운 알림이 없습니다.</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        borderBottomWidth: 0,
        position: 'relative',
        zIndex: 50,
    },
    breadcrumbArea: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    actionArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    profileRole: {
        fontSize: 12,
    },
    notificationPanel: {
        position: 'absolute',
        top: 85,
        right: 48,
        width: 300,
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    notificationEmpty: {
        paddingVertical: 30,
        alignItems: 'center',
    }
});
