import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, View as DefaultView, SectionList } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { SharedLibrary, SharedItem, SharedSection } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { MembershipService } from '@/services/MembershipService';
import { AdService } from '@/services/AdService';
import { FeatureGatingModal } from '@/components/FeatureGatingModal';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function SharedLibraryPreviewScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const sharedLibraryId = Array.isArray(id) ? id[0] : id;
    const { user, profile } = useAuth();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [library, setLibrary] = useState<SharedLibrary | null>(null);
    const [sections, setSections] = useState<SharedSection[]>([]);
    const [items, setItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const fetchData = async () => {
        if (!sharedLibraryId) return;
        setLoading(true);
        try {
            const [libData, sectionsData, itemsData] = await Promise.all([
                SharedLibraryService.getSharedLibraryById(sharedLibraryId),
                SharedLibraryService.getSharedSections(sharedLibraryId),
                SharedLibraryService.getSharedItemsByLibrary(sharedLibraryId)
            ]);
            setLibrary(libData);
            setSections(sectionsData);
            setItems(itemsData);
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '데이터를 가져오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sharedLibraryId]);

    const handleDownloadRequest = () => {
        if (!user) {
            Alert.alert('로그인 필요', '자료를 다운로드하려면 로그인이 필요합니다.');
            return;
        }

        const access = MembershipService.checkAccess('DOWNLOAD_SHARED', profile);

        if (access.status === 'REQUIRE_AD') {
            setModalVisible(true);
        } else {
            performDownload();
        }
    };

    const performDownload = async () => {
        if (!user || !library) return;

        setDownloading(true);
        try {
            const newLib = await SharedLibraryService.downloadLibrary(user.id, library);

            Alert.alert('성공', '내 암기장에 추가되었습니다.', [
                { text: '바로가기', onPress: () => router.push(`/library/${newLib.id}`) },
                { text: '확인' }
            ]);
        } catch (e: any) {
            Alert.alert('다운로드 실패', e.message);
        } finally {
            setDownloading(false);
            setModalVisible(false);
        }
    };

    const handleWatchAd = () => {
        AdService.showRewardedAd(() => {
            performDownload();
        });
    };

    // Group items by section
    const groupedData = sections.map(section => ({
        title: section.title,
        data: items.filter(item => item.shared_section_id === section.id),
        id: section.id
    })).filter(group => group.data.length > 0);

    const renderItem = ({ item, index }: { item: SharedItem, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 20).duration(400)}>
            <Card style={styles.itemCard} disabled>
                <View variant="transparent" style={styles.itemContent}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.answer}</Text>
                    {item.memo && (
                        <Text style={[styles.memoText, { color: colors.tint }]}>{item.memo}</Text>
                    )}
                </View>
            </Card>
        </Animated.View>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View variant="transparent" style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderText, { color: colors.tint }]}>{title}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: library?.title || '상세 보기',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <SectionList
                sections={groupedData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        {library?.description && (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {library.description}
                            </Text>
                        )}
                        <View variant="transparent" style={styles.headerStats}>
                            <Text style={styles.countText}>총 {sections.length}개의 항목, {items.length}개의 단어</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="file-text-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 단어가 없습니다.</Text>
                    </View>
                }
            />

            <View variant="transparent" style={styles.footer}>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownloadRequest}
                    disabled={downloading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[colors.tint, colors.primaryGradient[1]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.downloadButtonGradient}
                    >
                        {downloading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <FontAwesome name="plus" size={18} color="#fff" style={{ marginRight: 12 }} />
                                <Text style={styles.downloadButtonText}>내 단어장으로 가져오기</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeader: {
        paddingHorizontal: 4,
        paddingBottom: 24,
        marginTop: 12,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        marginBottom: 16,
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    divider: {
        height: 1,
        width: '100%',
        opacity: 0.1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 140,
    },
    sectionHeader: {
        paddingVertical: 12,
        marginTop: 12,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemCard: {
        marginBottom: 12,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    itemContent: {
        flex: 1,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    answerText: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 8,
    },
    memoText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 44, // iOS safe area approximate
    },
    downloadButton: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    downloadButtonGradient: {
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
});
