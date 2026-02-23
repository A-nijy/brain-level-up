import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, View as RNView, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { Profile } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, Link } from 'expo-router';

import { useAdminUsers } from '@/hooks/useAdminUsers';

import { Strings } from '@/constants/Strings';

// 사용자 목록의 개별 행 컴포넌트
const UserRow = ({ item, index, colors, handleUpdateRole, handleUpdateMembership }: {
    item: Profile,
    index: number,
    colors: any,
    handleUpdateRole: (user: Profile) => void,
    handleUpdateMembership: (user: Profile) => void
}) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' }
            ]}
            onPress={() => router.push(`/admin/users/${item.id}`)}
        >
            <View variant="transparent" style={[styles.col, { flex: 2 }]}>
                <View style={[styles.avatarSmall, { backgroundColor: colors.tint + '10' }]}>
                    <Text style={[styles.avatarText, { color: colors.tint }]}>{item.email[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.cellText}>{item.email}</Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleUpdateRole(item); }} style={styles.tagWrapper}>
                    <View style={[styles.tag, { backgroundColor: item.role === 'admin' ? colors.error + '15' : colors.tint + '15' }]}>
                        <Text style={[styles.tagText, { color: item.role === 'admin' ? colors.error : colors.tint }]}>
                            {item.role === 'admin' ? Strings.adminUsers.roles.admin : Strings.adminUsers.roles.user}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleUpdateMembership(item); }} style={styles.tagWrapper}>
                    <View style={[styles.tag, { backgroundColor: colors.success + '15' }]}>
                        <Text style={[styles.tagText, { color: colors.success }]}>
                            {item.membership_level}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1.5 }]}>
                <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 0.8, justifyContent: 'flex-end' }]}>
                <FontAwesome name={Strings.admin.icons.arrowRight as any} size={14} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
};

export default function UserManagementScreen() {
    const {
        users,
        loading,
        updateUserProfile
    } = useAdminUsers();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const handleUpdateRole = (user: Profile) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const roleName = newRole === 'admin' ? Strings.adminUsers.roles.admin : Strings.adminUsers.roles.user;
        if (window.confirm(Strings.adminUsers.prompts.roleChange(user.email, roleName))) {
            const performUpdate = async () => {
                try {
                    await updateUserProfile(user.id, { role: newRole as any });
                } catch (error: any) {
                    Alert.alert(Strings.common.error, error.message);
                }
            };
            performUpdate();
        }
    };

    const handleUpdateMembership = (user: Profile) => {
        const membership = window.prompt(Strings.adminUsers.prompts.membershipChange, user.membership_level);
        if (membership && ['BASIC', 'PREMIUM', 'PRO'].includes(membership.toUpperCase())) {
            const performUpdate = async () => {
                try {
                    await updateUserProfile(user.id, { membership_level: membership.toUpperCase() as any });
                } catch (error: any) {
                    Alert.alert(Strings.common.error, error.message);
                }
            };
            performUpdate();
        } else if (membership) {
            Alert.alert(Strings.common.warning, Strings.adminUsers.prompts.invalidMembership);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <View variant="transparent" style={styles.content}>
                <View variant="transparent" style={styles.headerRow}>
                    <View variant="transparent">
                        <Text style={styles.title}>{Strings.adminUsers.title}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{Strings.adminUsers.subtitle(users.length)}</Text>
                    </View>
                    <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <FontAwesome name={Strings.adminUsers.icons.search as any} size={14} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={Strings.adminUsers.searchPlaceholder}
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <Card style={styles.tableCard}>
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 2 }]}>{Strings.adminUsers.table.userInfo}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminUsers.table.role}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminUsers.table.membership}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminUsers.table.joinDate}</Text>
                        <Text style={[styles.headerCol, { flex: 0.8, textAlign: 'right' }]}>{Strings.adminUsers.table.manage}</Text>
                    </View>
                    <FlatList
                        data={filteredUsers}
                        renderItem={({ item, index }) => (
                            <UserRow
                                item={item}
                                index={index}
                                colors={colors}
                                handleUpdateRole={handleUpdateRole}
                                handleUpdateMembership={handleUpdateMembership}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                </Card>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 32,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        width: 320,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
    },
    tableCard: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 0,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    headerCol: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listContent: {
        flexGrow: 1,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    col: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cellText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 13,
    },
    tagWrapper: {
        alignSelf: 'flex-start',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionBtn: {
        padding: 8,
    }
});
