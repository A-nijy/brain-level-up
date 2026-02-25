import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedLibraries } from '@/hooks/useSharedLibraries';
import { SharedLibrary } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MembershipService } from '@/services/MembershipService';
import { AdService } from '@/services/AdService';
import { FeatureGatingModal } from '@/components/FeatureGatingModal';
import { SharedLibraryCategory } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useAlert } from '@/contexts/AlertContext';

import { Strings } from '@/constants/Strings';

export default function SharedLibraryScreen() {
    const { user, profile } = useAuth();
    const {
        libraries,
        categories,
        loading,
        refreshing,
        refresh,
        downloadLibrary,
        selectedCategoryId,
        setSelectedCategoryId
    } = useSharedLibraries();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const { showAlert } = useAlert();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLib, setSelectedLib] = useState<SharedLibrary | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb && width > 768 ? 2 : 1;
    const listKey = `shared-${numColumns}`;

    const handleDownloadRequest = (item: SharedLibrary) => {
        if (!user) {
            showAlert({ title: Strings.common.loginRequired, message: Strings.sharedDetail.alerts.loginRequired });
            return;
        }

        const access = MembershipService.checkAccess('DOWNLOAD_SHARED', profile);

        if (access.status === 'REQUIRE_AD') {
            setSelectedLib(item);
            setModalVisible(true);
        } else {
            performDownload(item);
        }
    };

    const performDownload = async (item: SharedLibrary) => {
        if (!user || !item) return;

        setDownloading(item.id);
        try {
            const newLib = await downloadLibrary(user.id, item);

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
            setModalVisible(false);
        }
    };

    const handleWatchAd = () => {
        AdService.showRewardedAd(() => {
            if (selectedLib) performDownload(selectedLib);
        }, showAlert);
    };


    const renderItem = ({ item, index }: { item: SharedLibrary; index: number }) => (
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
                    <View style={styles.iconContainer}>
                        <FontAwesome name={Strings.tabs.icons.shared as any} size={20} color={colors.tint} />
                    </View>
                    <View variant="transparent" style={styles.titleContainer}>
                        <Text type="title" style={styles.cardTitle}>{item.title}</Text>
                        {item.category && (
                            <Text style={[styles.categoryText, { color: colors.tint }]}>{item.category}</Text>
                        )}
                    </View>
                    <FontAwesome name={Strings.home.icons.arrowRight as any} size={18} color={colors.border} />
                </View>

                {item.description && (
                    <Text type="subtitle" numberOfLines={2} style={styles.cardDescription}>
                        {item.description}
                    </Text>
                )}

                <View variant="transparent" style={styles.cardFooter}>
                    <View variant="transparent" style={styles.statItem}>
                        <FontAwesome name={Strings.admin.icons.download as any} size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={styles.statText}>{Strings.shared.downloadCount(item.download_count)}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.downloadButton, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '20' }]}
                        onPress={() => handleDownloadRequest(item)}
                        disabled={downloading === item.id}
                    >
                        {downloading === item.id ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <>
                                <FontAwesome name={Strings.common.icons.add as any} size={12} color={colors.tint} style={{ marginRight: 6 }} />
                                <Text style={[styles.downloadButtonText, { color: colors.tint }]}>{Strings.shared.import}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Card>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                key={listKey}
                data={libraries}
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
                        <Text style={styles.headerTitle}>{Strings.shared.title}</Text>
                        <Text style={styles.headerSubtitle}>{Strings.shared.subtitle}</Text>

                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryScroll}
                            contentContainerStyle={styles.categoryContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.chip,
                                    selectedCategoryId === 'all' && { backgroundColor: colors.tint, borderColor: colors.tint }
                                ]}
                                onPress={() => setSelectedCategoryId('all')}
                            >
                                <Text style={[styles.chipText, selectedCategoryId === 'all' && { color: '#fff' }]}>{Strings.shared.categoryAll}</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.chip,
                                        selectedCategoryId === cat.id && { backgroundColor: colors.tint, borderColor: colors.tint }
                                    ]}
                                    onPress={() => setSelectedCategoryId(cat.id)}
                                >
                                    <Text style={[styles.chipText, selectedCategoryId === cat.id && { color: '#fff' }]}>{cat.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </Animated.ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? <ActivityIndicator size="large" color={colors.tint} /> : (
                            <>
                                <FontAwesome name={Strings.adminUsers.icons.search as any} size={40} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                                <Text style={styles.emptyText}>{Strings.shared.empty}</Text>
                            </>
                        )}
                    </View>
                }
            />
            <FeatureGatingModal
                isVisible={modalVisible}
                onClose={() => setModalVisible(false)}
                onWatchAd={handleWatchAd}
                title={Strings.shared.adModal.title}
                description={Strings.shared.adModal.description}
            />
        </View>
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
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
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
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
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
        borderColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
});
