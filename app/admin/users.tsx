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
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = (user: Profile) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        Alert.alert(
            'Update Role',
            `Change ${user.email}'s role to ${newRole.toUpperCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            await AdminService.updateUserProfile(user.id, { role: newRole as any });
                            loadUsers();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateMembership = (user: Profile) => {
        Alert.alert(
            'Update Membership',
            'Select membership level:',
            [
                { text: 'BASIC', onPress: () => updateMembership(user.id, 'BASIC') },
                { text: 'PREMIUM', onPress: () => updateMembership(user.id, 'PREMIUM') },
                { text: 'PRO', onPress: () => updateMembership(user.id, 'PRO') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const updateMembership = async (userId: string, level: string) => {
        try {
            await AdminService.updateUserProfile(userId, { membership_level: level as any });
            loadUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const renderUserItem = ({ item }: { item: Profile }) => (
        <Card style={styles.userCard}>
            <View variant="transparent" style={styles.userInfo}>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={[styles.userDate, { color: colors.textSecondary }]}>
                    Joined: {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <RNView style={styles.tagContainer}>
                <TouchableOpacity onPress={() => handleUpdateRole(item)}>
                    <View style={[styles.tag, { backgroundColor: item.role === 'admin' ? colors.error + '20' : colors.tint + '20' }]}>
                        <Text style={[styles.tagText, { color: item.role === 'admin' ? colors.error : colors.tint }]}>
                            {item.role?.toUpperCase()}
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
                        Total {users.length} users
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
