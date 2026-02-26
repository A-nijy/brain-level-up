import React, { useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, View as RNView, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SharedLibrary } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useAdminUserShared } from '@/hooks/useAdminUserShared';
import { Strings } from '@/constants/Strings';

const SharedRow = ({ item, index, colors, onToggleHide, onDelete }: {
    item: SharedLibrary & { owner_email?: string },
    index: number,
    colors: any,
    onToggleHide: (id: string, current: boolean) => void,
    onDelete: (id: string) => void
}) => {
    return (
        <View
            variant="transparent"
            style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' }
            ]}
        >
            <View variant="transparent" style={[styles.col, { flex: 2 }]}>
                <View variant="transparent">
                    <Text style={styles.cellText} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{item.category || '기타'}</Text>
                </View>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1.5 }]}>
                <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{item.owner_email || 'Unknown'}</Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 0.8, justifyContent: 'center' }]}>
                <View style={[styles.reportBadge, { backgroundColor: (item.report_count || 0) >= 5 ? colors.error + '15' : colors.tint + '10' }]}>
                    <Text style={[styles.reportText, { color: (item.report_count || 0) >= 5 ? colors.error : colors.tint }]}>
                        {item.report_count || 0}
                    </Text>
                </View>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                <View style={[styles.statusTag, { backgroundColor: item.is_hidden ? colors.error + '10' : colors.success + '10' }]}>
                    <Text style={[styles.statusText, { color: item.is_hidden ? colors.error : colors.success }]}>
                        {item.is_hidden ? Strings.adminUserShared.status.hidden : Strings.adminUserShared.status.visible}
                    </Text>
                </View>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1.2, justifyContent: 'flex-end', gap: 8 }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: item.is_hidden ? colors.success + '15' : colors.error + '15' }]}
                    onPress={() => onToggleHide(item.id, !!item.is_hidden)}
                >
                    <FontAwesome
                        name={item.is_hidden ? "eye" : "eye-slash"}
                        size={14}
                        color={item.is_hidden ? colors.success : colors.error}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={() => onDelete(item.id)}
                >
                    <FontAwesome name="trash" size={14} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function AdminUserSharedScreen() {
    const {
        libs,
        loading,
        refreshing,
        refresh,
        handleToggleHide,
        handleDelete
    } = useAdminUserShared();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLibs = libs.filter(lib =>
        lib.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lib as any).owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <Text style={styles.title}>{Strings.adminUserShared.title}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{Strings.adminUserShared.subtitle}</Text>
                    </View>
                    <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <FontAwesome name="search" size={14} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="제목 또는 작성자 검색"
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <Card style={styles.tableCard}>
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 2 }]}>{Strings.adminUserShared.table.title}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5 }]}>{Strings.adminUserShared.table.owner}</Text>
                        <Text style={[styles.headerCol, { flex: 0.8, textAlign: 'center' }]}>{Strings.adminUserShared.table.reports}</Text>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminUserShared.table.status}</Text>
                        <Text style={[styles.headerCol, { flex: 1.2, textAlign: 'right' }]}>{Strings.adminUserShared.table.manage}</Text>
                    </View>
                    <FlatList
                        data={filteredLibs}
                        renderItem={({ item, index }) => (
                            <SharedRow
                                item={item as any}
                                index={index}
                                colors={colors}
                                onToggleHide={handleToggleHide}
                                onDelete={handleDelete}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        onRefresh={refresh}
                        refreshing={refreshing}
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
        justifyContent: 'center',
    },
    cellText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 12,
        marginTop: 2,
    },
    reportBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'center',
    },
    reportText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
