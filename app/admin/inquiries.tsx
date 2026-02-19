import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
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

export default function AdminInquiriesScreen() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // UI State
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<InquiryCategory>>(new Set(['Q&A', '건의사항', '버그']));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [showFilters, setShowFilters] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const data = await SupportService.getAllInquiries();
            setInquiries(data);
        } catch (error) {
            console.error(error);
            window.alert('문의사항 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInquiries();
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
            await SupportService.toggleInquiryResolved(item.id, newStatus);
            setInquiries(inquiries.map(i => i.id === item.id ? { ...i, is_resolved: newStatus } : i));
        } catch (error) {
            window.alert('상태 변경에 실패했습니다.');
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
            case '버그': return '#FF4444';
            case '건의사항': return '#10B981';
            case 'Q&A': return '#4F46E5';
            default: return colors.textSecondary;
        }
    };

    const renderItem = ({ item, index }: { item: Inquiry; index: number }) => {
        const isExpanded = expandedItems.has(item.id);
        return (
            <Animated.View layout={Layout.springify()} entering={FadeInUp.delay(index * 50).springify()}>
                <Card style={[styles.card, item.is_resolved && { opacity: 0.8, borderColor: colors.border }]}>
                    <View variant="transparent" style={styles.cardHeader}>
                        <View variant="transparent" style={styles.headerLeft}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                                <Text style={styles.categoryText}>{item.category}</Text>
                            </View>
                            {item.is_resolved && (
                                <View style={[styles.resolvedBadge, { backgroundColor: colors.border + '50' }]}>
                                    <Text style={[styles.resolvedText, { color: colors.textSecondary }]}>해결됨</Text>
                                </View>
                            )}
                        </View>

                        <View variant="transparent" style={styles.headerRightRow}>
                            <Text style={[styles.date, { color: colors.textSecondary }]}>
                                {new Date(item.created_at).toLocaleDateString()}
                            </Text>
                            <TouchableOpacity
                                style={styles.statusToggleCompact}
                                onPress={() => toggleStatus(item)}
                            >
                                <FontAwesome
                                    name={item.is_resolved ? "check-square" : "square-o"}
                                    size={20}
                                    color={item.is_resolved ? colors.tint : colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View variant="transparent" style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={isExpanded ? undefined : 1}>{item.title}</Text>
                        <TouchableOpacity
                            style={styles.expandButtonCompact}
                            onPress={() => toggleExpand(item.id)}
                        >
                            <Text style={[styles.expandButtonText, { color: colors.tint }]}>
                                {isExpanded ? '접기' : '펼치기'}
                            </Text>
                            <FontAwesome name={isExpanded ? "angle-up" : "angle-down"} size={14} color={colors.tint} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.content, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 1}>
                        {item.content}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View variant="transparent" style={styles.userInfo}>
                        <View variant="transparent" style={styles.userRow}>
                            <FontAwesome name="user-circle" size={12} color={colors.tint} />
                            <Text style={[styles.userInfoText, { fontWeight: 'bold' }]}>{item.user_nickname || '알 수 없음'}</Text>
                            <Text style={[styles.userInfoText, { opacity: 0.6 }]}>ID: #{item.user_id_number || '-----'}</Text>
                        </View>
                        <View variant="transparent" style={[styles.userRow, { marginTop: 2 }]}>
                            <FontAwesome name="envelope-o" size={10} color={colors.textSecondary} />
                            <Text style={[styles.userInfoText, { fontSize: 13, color: colors.textSecondary }]}>{item.user_email || '이메일 없음'}</Text>
                        </View>
                    </View>
                </Card>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: '문의 및 건의사항',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.headerIcon}>
                            <FontAwesome name="filter" size={20} color={showFilters ? colors.tint : colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {showFilters && (
                <View style={[styles.filterPanel, { borderBottomColor: colors.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {/* 정렬 */}
                        <View variant="transparent" style={styles.filterGroup}>
                            <TouchableOpacity
                                style={[styles.miniBtn, sortOrder === 'newest' && { backgroundColor: colors.tint }]}
                                onPress={() => setSortOrder('newest')}
                            >
                                <Text style={[styles.miniBtnText, sortOrder === 'newest' && { color: '#fff' }]}>최신순</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniBtn, sortOrder === 'oldest' && { backgroundColor: colors.tint }]}
                                onPress={() => setSortOrder('oldest')}
                            >
                                <Text style={[styles.miniBtnText, sortOrder === 'oldest' && { color: '#fff' }]}>오래된순</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.vDivider, { backgroundColor: colors.border }]} />

                        {/* 상태 */}
                        <View variant="transparent" style={styles.filterGroup}>
                            <TouchableOpacity
                                style={[styles.miniBtn, statusFilter === 'all' && { backgroundColor: colors.tint }]}
                                onPress={() => setStatusFilter('all')}
                            >
                                <Text style={[styles.miniBtnText, statusFilter === 'all' && { color: '#fff' }]}>전체</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniBtn, statusFilter === 'resolved' && { backgroundColor: colors.tint }]}
                                onPress={() => setStatusFilter('resolved')}
                            >
                                <Text style={[styles.miniBtnText, statusFilter === 'resolved' && { color: '#fff' }]}>해결</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniBtn, statusFilter === 'unresolved' && { backgroundColor: colors.tint }]}
                                onPress={() => setStatusFilter('unresolved')}
                            >
                                <Text style={[styles.miniBtnText, statusFilter === 'unresolved' && { color: '#fff' }]}>미해결</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.vDivider, { backgroundColor: colors.border }]} />

                        {/* 카테고리 */}
                        <View variant="transparent" style={styles.filterGroup}>
                            {(['Q&A', '건의사항', '버그'] as InquiryCategory[]).map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.miniBtn, selectedCategories.has(cat) && { backgroundColor: getCategoryColor(cat) }]}
                                    onPress={() => toggleCategory(cat)}
                                >
                                    <Text style={[styles.miniBtnText, selectedCategories.has(cat) && { color: '#fff' }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={filteredAndSortedInquiries}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <FontAwesome name="envelope-open-o" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                조건에 맞는 문의사항이 없습니다.
                            </Text>
                        </View>
                    }
                />
            )}
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
    headerIcon: {
        padding: 10,
    },
    filterPanel: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    filterScroll: {
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 12,
    },
    filterGroup: {
        flexDirection: 'row',
        gap: 6,
    },
    miniBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    miniBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    vDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 4,
    },
    listContent: {
        padding: 20,
    },
    card: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    resolvedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    resolvedText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    headerRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusToggleCompact: {
        padding: 4,
    },
    date: {
        fontSize: 11,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    expandButtonCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },
    expandButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
        opacity: 0.1,
    },
    userInfo: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 10,
        borderRadius: 8,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userInfoText: {
        fontSize: 13,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
});
