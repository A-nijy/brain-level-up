import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedLibraries } from '@/hooks/useSharedLibraries';
import { SharedLibrary } from '@/types';
import { TextInput } from 'react-native';
import { useAlert } from '@/contexts/AlertContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Strings } from '@/constants/Strings';

/**
 * [Local-Only] 공유 자료실 화면
 * 공식 자료(assets/data/official_libraries.json)만 표시하도록 리팩토링됨
 */
export default function SharedLibraryScreen() {
    const { user } = useAuth();
    const {
        libraries,
        categories,
        loading,
        refreshing,
        refresh,
        downloadLibrary,
        selectedCategoryId,
        setSelectedCategoryId,
    } = useSharedLibraries();

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const { showAlert } = useAlert();

    const [downloading, setDownloading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb && width > 768 ? 2 : 1;
    const listKey = `shared-${numColumns}`;

    const filteredLibraries = libraries.filter(lib =>
        lib.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadRequest = async (item: SharedLibrary) => {
        setDownloading(item.id);
        try {
            const newLib = await downloadLibrary(user?.id || 'guest', item);

            showAlert({
                title: Strings.common.success,
                message: Strings.shared.alerts.downloadSuccess,
                buttons: [
                    { text: Strings.shared.alerts.goLibrary, onPress: () => router.push(`/library/${newLib.id}`) },
                    { text: Strings.common.confirm }
                ]
            });
            refresh();
        } catch (e: any) {
            showAlert({ title: Strings.shared.alerts.downloadFail, message: e.message });
        } finally {
            setDownloading(null);
        }
    };

    const renderItem = ({ item, index }: { item: SharedLibrary; index: number }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                style={[
                    styles.cardContainer,
                    numColumns > 1 && { width: '48%', marginHorizontal: '1%' }
                ]}
            >
                <Card
                    style={styles.card}
                    onPress={() => router.push({
                        pathname: '/shared/[id]',
                        params: { id: item.id, title: item.title }
                    })}
                >
                    <View variant="transparent" style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                            <FontAwesome name="bookmark" size={20} color={colors.tint} />
                        </View>
                        <View variant="transparent" style={styles.titleContainer}>
                            <Text type="title" style={styles.cardTitle}>{item.title}</Text>
                            {item.category && (
                                <Text style={[styles.categoryText, { color: colors.tint }]}>{item.category}</Text>
                            )}
                        </View>
                        <FontAwesome name="angle-right" size={18} color={colors.border} />
                    </View>

                    {item.description && (
                        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    <View variant="transparent" style={styles.cardFooter}>
                        <View variant="transparent" style={styles.footerLeft}>
                            <View variant="transparent" style={styles.statItem}>
                                <FontAwesome name="download" size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                    {Strings.shared.downloadCount(item.download_count || 0)}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadButton, { backgroundColor: colors.tint, borderColor: colors.tint }]}
                            onPress={() => handleDownloadRequest(item)}
                            disabled={downloading === item.id}
                        >
                            {downloading === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <FontAwesome name="plus" size={12} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={[styles.downloadButtonText, { color: '#fff' }]}>{Strings.shared.import}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]} >
            <FlatList
                key={listKey}
                data={filteredLibraries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={[
                    styles.listContent,
                    isWeb && width > 1200 && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
                }
                ListHeaderComponent={
                    <View variant="transparent" style={styles.header}>
                        <View variant="transparent" style={styles.headerInfoSection}>
                            <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 4, maxWidth: isWeb ? 400 : undefined }]}>
                                <FontAwesome name="search" size={14} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder={Strings.shared.searchPlaceholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryScroll}
                            contentContainerStyle={styles.categoryContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.chip,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    selectedCategoryId === 'all' && { backgroundColor: colors.tint, borderColor: colors.tint }
                                ]}
                                onPress={() => setSelectedCategoryId('all')}
                            >
                                <Text style={[styles.chipText, { color: colors.textSecondary }, selectedCategoryId === 'all' && { color: '#fff' }]}>{Strings.shared.categoryAll}</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        selectedCategoryId === cat.id && { backgroundColor: colors.tint, borderColor: colors.tint }
                                    ]}
                                    onPress={() => setSelectedCategoryId(cat.id)}
                                >
                                    <Text style={[styles.chipText, { color: colors.textSecondary }, selectedCategoryId === cat.id && { color: '#fff' }]}>{cat.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </Animated.ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? <ActivityIndicator size="large" color={colors.tint} /> :
                            <Text style={styles.emptyText}>{Strings.shared.empty}</Text>
                        }
                    </View>
                }
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 24,
        paddingHorizontal: 4,
        marginTop: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 8,
    },
    headerInfoSection: {
        marginBottom: 8,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        borderWidth: 1.5,
        borderRadius: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
        opacity: 0.8,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        paddingTop: 12,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    downloadButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 16,
    },
    categoryScroll: {
        marginTop: 20,
        marginHorizontal: -20,
    },
    categoryContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
