import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import OfficialManagement from '@/components/admin/shared/OfficialManagement';
import UserManagement from '@/components/admin/shared/UserManagement';
import CategoryManagement from '@/components/admin/shared/CategoryManagement';

type MainTab = 'official' | 'user' | 'category';

export default function SharedManagerScreen() {
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('official');
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const renderTabButton = (id: MainTab, label: string, icon: string) => {
        const isActive = activeMainTab === id;
        return (
            <TouchableOpacity
                style={[
                    styles.mainTab,
                    isActive && { borderBottomColor: colors.tint, borderBottomWidth: 3 }
                ]}
                onPress={() => setActiveMainTab(id)}
            >
                <FontAwesome
                    name={icon as any}
                    size={16}
                    color={isActive ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 8 }}
                />
                <Text style={[
                    styles.mainTabText,
                    { color: isActive ? colors.tint : colors.textSecondary },
                    isActive && { fontWeight: '800' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <View variant="transparent" style={styles.tabHeader}>
                {renderTabButton('official', '공식 자료 관리', 'book')}
                {renderTabButton('user', '유저 자료 관리', 'users')}
                {renderTabButton('category', '카테고리 설정', 'tags')}
            </View>

            <View variant="transparent" style={styles.activeTabContent}>
                {activeMainTab === 'official' && <OfficialManagement />}
                {activeMainTab === 'user' && <UserManagement />}
                {activeMainTab === 'category' && <CategoryManagement />}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 32,
    },
    tabHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 32,
        gap: 20,
    },
    mainTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    mainTabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabContent: {
        flex: 1,
    }
});
