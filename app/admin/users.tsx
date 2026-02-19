import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, View as RNView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { AdminService } from '@/services/AdminService';
import { Profile } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function UserManagementScreen() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await AdminService.getAllUsers();
            setUsers(data);
        } catch (error: any) {
            window.alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = (user: Profile) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const roleName = newRole === 'admin' ? '관리자' : '사용자';
        if (window.confirm(`${user.email} 님의 권한을 ${roleName}(으)로 변경하시겠습니까?`)) {
            const updateRole = async () => {
                try {
                    await AdminService.updateUserProfile(user.id, { role: newRole as any });
                    loadUsers();
                } catch (error: any) {
                    window.alert('오류: ' + error.message);
                }
            };
            updateRole();
        }
    };

    const handleUpdateMembership = (user: Profile) => {
        const membership = window.prompt('변경할 멤버십 등급을 입력하세요 (BASIC, PREMIUM, PRO):', user.membership_level);
        if (membership && ['BASIC', 'PREMIUM', 'PRO'].includes(membership.toUpperCase())) {
            updateMembership(user.id, membership.toUpperCase());
        } else if (membership) {
            window.alert('올바른 멤버십 등급을 입력해주세요.');
        }
    };

    const updateMembership = async (userId: string, level: string) => {
        try {
            await AdminService.updateUserProfile(userId, { membership_level: level as any });
            loadUsers();
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const renderUserItem = ({ item }: { item: Profile }) => (
        <Card style={styles.userCard}>
            <View variant="transparent" style={styles.userInfo}>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={[styles.userDate, { color: colors.textSecondary }]}>
                    가입일: {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <RNView style={styles.tagContainer}>
                <TouchableOpacity onPress={() => handleUpdateRole(item)}>
                    <View style={[styles.tag, { backgroundColor: item.role === 'admin' ? colors.error + '20' : colors.tint + '20' }]}>
                        <Text style={[styles.tagText, { color: item.role === 'admin' ? colors.error : colors.tint }]}>
                            {item.role === 'admin' ? '관리자' : '사용자'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleUpdateMembership(item)}>
                    <View style={[styles.tag, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.tagText, { color: colors.success }]}>
                            {item.membership_level}
                        </Text>
                    </View>
                </TouchableOpacity>
            </RNView>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text style={[styles.headerText, { color: colors.textSecondary }]}>
                        총 {users.length}명의 사용자
                    </Text>
                }
            />
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
        padding: 20,
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    userCard: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 20,
    },
    userInfo: {
        marginBottom: 12,
    },
    userEmail: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userDate: {
        fontSize: 12,
        marginTop: 4,
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 11,
        fontWeight: 'bold',
    }
});
