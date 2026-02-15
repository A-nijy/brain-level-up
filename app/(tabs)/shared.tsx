import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, useWindowDimensions, Platform } from 'react-native';
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

export default function SharedLibraryScreen() {
    const { user, profile } = useAuth();
    const { libraries, loading, refreshing, refresh, downloadLibrary } = useSharedLibraries();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLib, setSelectedLib] = useState<SharedLibrary | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb && width > 768 ? 2 : 1;
    const listKey = `shared-${numColumns}`;

    const handleDownloadRequest = (item: SharedLibrary) => {
        if (!user) {
            Alert.alert('로그인 필요', '자료를 다운로드하려면 로그인이 필요합니다.');
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

            Alert.alert('성공', '내 암기장에 추가되었습니다.', [
                { text: '바로가기', onPress: () => router.push(`/library/${newLib.id}`) },
                { text: '확인' }
            ]);
            refresh();
        } catch (e: any) {
            Alert.alert('다운로드 실패', e.message);
        } finally {
            setDownloading(null);
            setModalVisible(false);
        }
    };

    const handleWatchAd = () => {
        AdService.showRewardedAd(() => {
            if (selectedLib) performDownload(selectedLib);
        });
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
                onPress={() => router.push({ pathname: '/shared/[id]', params: { id: item.id } })}
            >
                <View variant="transparent" style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <FontAwesome name="globe" size={20} color={colors.tint} />
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
                    <Text type="subtitle" numberOfLines={2} style={styles.cardDescription}>
                        {item.description}
                    </Text>
                )}

                <View variant="transparent" style={styles.cardFooter}>
                    <View variant="transparent" style={styles.statItem}>
                        <FontAwesome name="download" size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={styles.statText}>{item.download_count}회</Text>
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
                                <FontAwesome name="plus" size={12} color={colors.tint} style={{ marginRight: 6 }} />
                                <Text style={[styles.downloadButtonText, { color: colors.tint }]}>가져오기</Text>
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
                        <Text style={styles.headerTitle}>공유 자료실</Text>
                        <Text style={styles.headerSubtitle}>다른 사람들이 공유한 유용한 암기장을 확인해 보세요.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? <ActivityIndicator size="large" color={colors.tint} /> : (
                            <>
                                <FontAwesome name="search" size={40} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                                <Text style={styles.emptyText}>공유된 자료가 없습니다.</Text>
                            </>
                        )}
                    </View>
                }
            />
            <FeatureGatingModal
                isVisible={modalVisible}
                onClose={() => setModalVisible(false)}
                onWatchAd={handleWatchAd}
                title="자료 받기"
                description="광고를 시청하시면 이 암기장을 무료로 내 보관함에 추가할 수 있습니다."
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
    }
});
