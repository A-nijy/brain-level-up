import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SupportService } from '@/services/SupportService';
import { Inquiry, InquiryCategory } from '@/types';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

type SortOrder = 'newest' | 'oldest';
type StatusFilter = 'all' | 'resolved' | 'unresolved';

import { useSupport } from '@/hooks/useSupport';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export default function AdminInquiriesScreen() {
    const {
        inquiries,
        loading,
        refreshing,
        fetchAllInquiries,
        toggleInquiryResolved
    } = useSupport();

    // UI State
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<InquiryCategory>>(new Set([
        Strings.adminInquiries.categories.qa as InquiryCategory,
        Strings.adminInquiries.categories.suggestion as InquiryCategory,
        Strings.adminInquiries.categories.bug as InquiryCategory
    ]));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [showFilters, setShowFilters] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchAllInquiries();
    }, [fetchAllInquiries]);

    const onRefresh = () => {
        fetchAllInquiries(true);
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const toggleStatus = async (item: Inquiry) => {
        try {
            const newStatus = !item.is_resolved;
            await toggleInquiryResolved(item.id, newStatus);
        } catch (error) {
            showAlert({ title: Strings.common.error, message: Strings.adminInquiries.alerts.statusFail });
        }
    };

    const toggleCategory = (cat: InquiryCategory) => {
        const newCats = new Set(selectedCategories);
        if (newCats.has(cat)) {
            if (newCats.size > 1) newCats.delete(cat);
        } else {
            newCats.add(cat);
        }
        setSelectedCategories(newCats);
    };

    const filteredAndSortedInquiries = useMemo(() => {
        return inquiries
            .filter(item => {
                const catMatch = selectedCategories.has(item.category);
                const statusMatch = statusFilter === 'all'
                    ? true
                    : statusFilter === 'resolved' ? item.is_resolved : !item.is_resolved;
                return catMatch && statusMatch;
            })
            .sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [inquiries, selectedCategories, statusFilter, sortOrder]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case Strings.adminInquiries.categories.bug: return '#FF4444';
            case Strings.adminInquiries.categories.suggestion: return '#10B981';
            case Strings.adminInquiries.categories.qa: return '#4F46E5';
            default: return colors.textSecondary;
        }
    };

    const InquiryRow = ({ item, index }: { item: Inquiry, index: number }) => {
        const isExpanded = expandedItems.has(item.id);
        const categoryColor = getCategoryColor(item.category);

        return (
            <Animated.View layout={Layout.springify()} entering={FadeInUp.delay(index * 30).springify()}>
                <View variant="transparent" style={[styles.tableRow, isExpanded && styles.expandedRow, { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' }]}>
                    <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
                        </View>
                    </View>

                    <View variant="transparent" style={[styles.col, { flex: 3.5 }]}>
                        <TouchableOpacity style={styles.titleArea} onPress={() => toggleExpand(item.id)}>
                            <Text style={styles.cellText} numberOfLines={1}>{item.title}</Text>
                            <Text style={[styles.cellSubText, { color: colors.textSecondary }]} numberOfLines={1}>{item.content}</Text>
                        </TouchableOpacity>
                    </View>

                    <View variant="transparent" style={[styles.col, { flex: 1.5, justifyContent: 'flex-end', alignItems: 'center', paddingRight: 10 }]}>
                        <View style={[styles.statusBadge, { backgroundColor: (item.is_resolved ? colors.success : '#F59E0B') + '15' }]}>
                            <View style={[styles.statusDot, { backgroundColor: item.is_resolved ? colors.success : '#F59E0B' }]} />
                            <Text style={[styles.statusText, { color: item.is_resolved ? colors.success : '#F59E0B' }]}>
                                {item.is_resolved ? Strings.adminInquiries.status.resolved : Strings.adminInquiries.status.unresolved}
                            </Text>
                        </View>
                    </View>

                    <View variant="transparent" style={[styles.col, { flex: 1.2, justifyContent: 'flex-end', paddingRight: 24 }]}>
                        <Text style={[styles.cellSubText, { color: colors.textSecondary, textAlign: 'right' }]}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>

                    <View variant="transparent" style={[styles.col, { flex: 0.8, justifyContent: 'flex-end', gap: 12 }]}>
                        <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.actionBtn}>
                            <FontAwesome name={(isExpanded ? Strings.settings.icons.down : Strings.settings.icons.down) as any} size={14} color={colors.textSecondary} style={isExpanded ? { transform: [{ rotate: '180deg' }] } : {}} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleStatus(item)} style={styles.actionBtn}>
                            <FontAwesome name={(item.is_resolved ? Strings.admin.icons.success : Strings.settings.icons.circle) as any} size={16} color={item.is_resolved ? colors.tint : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {isExpanded && (
                    <View variant="transparent" style={[styles.detailRow, { backgroundColor: colors.cardBackground + '20' }]}>
                        <View variant="transparent" style={styles.detailContent}>
                            <View variant="transparent" style={styles.detailSection}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.content}</Text>
                                <Text style={styles.detailText}>{item.content}</Text>
                            </View>
                            <View variant="transparent" style={styles.detailDivider} />
                            <View variant="transparent" style={styles.detailSection}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.userInfo}</Text>
                                <View variant="transparent" style={styles.userGrid}>
                                    <View variant="transparent" style={styles.userItem}>
                                        <Text style={[styles.userLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.nickname}</Text>
                                        <Text style={styles.userValue}>{item.user_nickname || Strings.adminInquiries.details.none}</Text>
                                    </View>
                                    <View variant="transparent" style={styles.userItem}>
                                        <Text style={[styles.userLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.email}</Text>
                                        <Text style={styles.userValue}>{item.user_email || Strings.adminInquiries.details.none}</Text>
                                    </View>
                                    <View variant="transparent" style={styles.userItem}>
                                        <Text style={[styles.userLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.userId}</Text>
                                        <Text style={styles.userValue}>#{item.user_id_number || '-----'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View variant="transparent" style={styles.content}>
                <View variant="transparent" style={styles.header}>
                    <View variant="transparent">
                        <Text style={styles.title}>{Strings.adminInquiries.title}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{Strings.adminInquiries.subtitle}</Text>
                    </View>
                    <View variant="transparent" style={styles.headerActions}>
                        <TouchableOpacity style={[styles.filterBtn, showFilters && styles.filterBtnActive]} onPress={() => setShowFilters(!showFilters)}>
                            <FontAwesome name={Strings.admin.icons.filter as any} size={14} color={showFilters ? '#fff' : colors.textSecondary} />
                            <Text style={[styles.filterBtnText, showFilters && { color: '#fff' }]}>{Strings.adminInquiries.filterBtn}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showFilters && (
                    <Animated.View entering={FadeInUp} style={[styles.filterPanel, { backgroundColor: colors.cardBackground }]}>
                        <View variant="transparent" style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.filters.sort}</Text>
                            <View variant="transparent" style={styles.filterOptions}>
                                <TouchableOpacity style={[styles.miniBtn, sortOrder === 'newest' && styles.miniBtnActive]} onPress={() => setSortOrder('newest')}>
                                    <Text style={[styles.miniBtnText, sortOrder === 'newest' && styles.miniBtnTextActive]}>{Strings.adminInquiries.filters.newest}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.miniBtn, sortOrder === 'oldest' && styles.miniBtnActive]} onPress={() => setSortOrder('oldest')}>
                                    <Text style={[styles.miniBtnText, sortOrder === 'oldest' && styles.miniBtnTextActive]}>{Strings.adminInquiries.filters.oldest}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.vDivider} />
                        <View variant="transparent" style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.filters.status}</Text>
                            <View variant="transparent" style={styles.filterOptions}>
                                <TouchableOpacity style={[styles.miniBtn, statusFilter === 'all' && styles.miniBtnActive]} onPress={() => setStatusFilter('all')}>
                                    <Text style={[styles.miniBtnText, statusFilter === 'all' && styles.miniBtnTextActive]}>{Strings.adminInquiries.filters.all}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.miniBtn, statusFilter === 'resolved' && styles.miniBtnActive]} onPress={() => setStatusFilter('resolved')}>
                                    <Text style={[styles.miniBtnText, statusFilter === 'resolved' && styles.miniBtnTextActive]}>{Strings.adminInquiries.filters.resolved}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.miniBtn, statusFilter === 'unresolved' && styles.miniBtnActive]} onPress={() => setStatusFilter('unresolved')}>
                                    <Text style={[styles.miniBtnText, statusFilter === 'unresolved' && styles.miniBtnTextActive]}>{Strings.adminInquiries.filters.unresolved}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.vDivider} />
                        <View variant="transparent" style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.filters.category}</Text>
                            <View variant="transparent" style={styles.filterOptions}>
                                {([
                                    Strings.adminInquiries.categories.qa,
                                    Strings.adminInquiries.categories.suggestion,
                                    Strings.adminInquiries.categories.bug
                                ] as InquiryCategory[]).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.miniBtn, selectedCategories.has(cat) && { backgroundColor: getCategoryColor(cat) }]}
                                        onPress={() => toggleCategory(cat)}
                                    >
                                        <Text style={[styles.miniBtnText, selectedCategories.has(cat) && { color: '#fff' }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}

                <Card style={styles.tableCard}>
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminInquiries.table.category}</Text>
                        <Text style={[styles.headerCol, { flex: 3.5 }]}>{Strings.adminInquiries.table.content}</Text>
                        <Text style={[styles.headerCol, { flex: 1.5, textAlign: 'right', paddingRight: 10 }]}>{Strings.adminInquiries.table.status}</Text>
                        <Text style={[styles.headerCol, { flex: 1.2, textAlign: 'right', paddingRight: 24 }]}>{Strings.adminInquiries.table.date}</Text>
                        <Text style={[styles.headerCol, { flex: 0.8, textAlign: 'right' }]}>{Strings.adminInquiries.table.manage}</Text>
                    </View>

                    {loading && !refreshing ? (
                        <View style={styles.centerTable}>
                            <ActivityIndicator size="large" color={colors.tint} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredAndSortedInquiries}
                            renderItem={({ item, index }) => <InquiryRow item={item} index={index} />}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                            }
                            ListEmptyComponent={
                                <View variant="transparent" style={styles.emptyTable}>
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.adminInquiries.alerts.empty}</Text>
                                </View>
                            }
                        />
                    )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        gap: 8,
    },
    filterBtnActive: {
        backgroundColor: '#4F46E5',
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    filterPanel: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        marginBottom: 32,
        alignItems: 'center',
        gap: 24,
    },
    filterSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    filterOptions: {
        flexDirection: 'row',
        gap: 6,
    },
    miniBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    miniBtnActive: {
        backgroundColor: '#4F46E5',
    },
    miniBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    miniBtnTextActive: {
        color: '#fff',
    },
    vDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.1)',
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
    centerTable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    listContent: {
        paddingBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
    expandedRow: {
        borderBottomWidth: 0,
    },
    col: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
    },
    titleArea: {
        flex: 1,
    },
    cellText: {
        fontSize: 15,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    actionBtn: {
        padding: 6,
    },
    detailRow: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    detailContent: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    detailSection: {
        marginBottom: 16,
    },
    detailDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    userItem: {
        minWidth: 120,
    },
    userLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 2,
    },
    userValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyTable: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});
