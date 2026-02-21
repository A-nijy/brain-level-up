import React from 'react';
import { StyleSheet, TextInput, Image, TouchableOpacity, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSegments, useRouter } from 'expo-router';

export default function WebHeader() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const { profile } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = React.useState(false);

    // segment를 기반으로 breadcrumb 생성
    const getBreadcrumb = () => {
        const seg0 = segments[0] as string;
        const seg1 = segments[segments.length - 1] as string;

        if (seg0 === 'admin') {
            const adminMap: Record<string, string> = {
                'index': '대시보드',
                'users': '사용자 관리',
                'shared-manager': '콘텐츠 관리',
                'notices': '시스템 공지',
                'categories': '카테고리 관리',
                'inquiries': '문의 및 건의사항'
            };
            return '관리 콘솔 / ' + (adminMap[seg1] || seg1);
        }

        const userMap: Record<string, string> = {
            'index': '나의 암기장',
            'shared': '자료실',
            'stats': '학습 통계',
            'settings': '환경 설정'
        };
        return 'FlashMaster / ' + (userMap[seg1] || seg1);
    };

    const getPageTitle = () => {
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
            return `안녕하세요, ${profile?.nickname || profile?.email?.split('@')[0] || '사용자'}님! 👋`;
        }

        const userTitleMap: Record<string, string> = {
            'shared': '열린 자료실',
            'stats': '나의 학습 리포트',
            'settings': '시스템 환경 설정'
        };
        return userTitleMap[seg1] || 'FlashMaster';
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingRight: 48 }]}>
            <View variant="transparent" style={styles.breadcrumbArea}>
                <Text style={[styles.breadcrumb, { color: colors.textSecondary }]}>{getBreadcrumb()}</Text>
                <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.pageTitle}>{getPageTitle()}</Text>
                </View>
            </View>

            <View variant="transparent" style={styles.actionArea}>
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
    breadcrumb: {
        fontSize: 13,
        marginBottom: 4,
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
