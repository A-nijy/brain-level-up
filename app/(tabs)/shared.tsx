import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, Platform, InteractionManager } from 'react-native';
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
import { useLoading } from '@/contexts/LoadingContext';

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

    const { showLoading, hideLoading } = useLoading();
    const [searchQuery, setSearchQuery] = useState('');

    // [Optimization] 인터랙션 지연 로딩
    const [isInteracting, setIsInteracting] = useState(true);

    React.useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setIsInteracting(false);
        });
        return () => task.cancel();
    }, []);

    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb && width > 768 ? 2 : 1;
    const listKey = `shared-${numColumns}`;

    const filteredLibraries = libraries.filter(lib =>
        lib.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadRequest = async (item: SharedLibrary) => {
        showLoading("암기장을 가져오고 있습니다...");
        try {
            const newLib = await downloadLibrary(user?.id || 'guest', item);
            hideLoading();

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
            hideLoading();
            showAlert({ title: Strings.shared.alerts.downloadFail, message: e.message });
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
                            <FontAwesome name="bookmark" size={18} color={colors.tint} />
                        </View>
                        <View variant="transparent" style={styles.titleContainer}>
                            <Text type="title" style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        </View>
                        <FontAwesome name="angle-right" size={18} color={colors.border} />
                    </View>

                    <View variant="transparent" style={styles.descriptionRow}>
                        <Text 
                            style={[styles.cardDescription, { color: colors.textSecondary }]} 
                            numberOfLines={2}
                        >
                            {item.description}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.compactDownloadButton, { backgroundColor: colors.tint }]}
                            onPress={() => handleDownloadRequest(item)}
                        >
                            <Text style={styles.downloadButtonText}>{Strings.shared.import}</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </Animated.View>
        );
    };

    if ((loading || (isInteracting && libraries.length === 0)) && !refreshing) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

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
                initialNumToRender={8}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
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
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    descriptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardDescription: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.8,
    },
    compactDownloadButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadButtonText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
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
