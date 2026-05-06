import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, View as DefaultView, SectionList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSharedDetail } from '@/hooks/useSharedDetail';
import { SharedLibrary, SharedItem, SharedSection } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { MembershipService } from '@/services/MembershipService';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Strings } from '@/constants/Strings';
import { LogService } from '@/services/LogService';
import { useWebHeaderTitle } from '@/contexts/HeaderContext';
import { useLoading } from '@/contexts/LoadingContext';

export default function SharedLibraryPreviewScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const router = useRouter();
    const sharedLibraryId = id;
    const { user, profile } = useAuth();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();

    const { library, sections, loading, refreshing, refresh, downloadLibrary } = useSharedDetail(sharedLibraryId);

    // 웹 헤더 제목 설정
    useWebHeaderTitle(library?.title || paramTitle || Strings.sharedDetail.screenTitle, [library?.title, paramTitle]);

    const [modalVisible, setModalVisible] = useState(false);
    const { showLoading, hideLoading } = useLoading();

    const handleDownloadRequest = () => {
        performDownload();
    };

    const performDownload = async () => {
        if (!user || !library) return;

        showLoading("암기장을 다운로드하고 있습니다...");
        try {
            const newLib = await downloadLibrary(user.id);
            hideLoading();

            showAlert({
                title: Strings.common.success,
                message: Strings.sharedDetail.alerts.downloadSuccess,
                buttons: [
                    { text: Strings.sharedDetail.alerts.goToLibrary, onPress: () => router.push(`/library/${newLib.id}`) },
                    { text: Strings.common.confirm }
                ]
            });
        } catch (e: any) {
            hideLoading();
            showAlert({ title: Strings.sharedDetail.alerts.downloadFail, message: e.message });
        } finally {
            setModalVisible(false);
        }
    };



    const renderItem = ({ item, index }: { item: SharedSection, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
            <Card
                style={styles.sectionCard}
                onPress={() => router.push({
                    pathname: "/shared/[id]/section/[sectionId]",
                    params: { id: sharedLibraryId, sectionId: item.id, title: item.title }
                })}
            >
                <View variant="transparent" style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
                <FontAwesome name="angle-right" size={20} color={colors.textSecondary} />
            </Card>
        </Animated.View>
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
                    headerTitle: library?.title || paramTitle || Strings.sharedDetail.screenTitle,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                data={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        {library?.description && (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {library.description}
                            </Text>
                        )}
                        <View variant="transparent" style={styles.headerStats}>
                            <Text style={styles.countText}>{Strings.sharedDetail.count(sections.length)}</Text>
                        </View>
                        <View variant="transparent" style={styles.subHeaderTitle}>
                            <Text style={[styles.subHeaderTitleText, { color: colors.textSecondary }]}>섹션 목록</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="folder-open-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 섹션이 없습니다.</Text>
                    </View>
                }
            />

            <View variant="transparent" style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownloadRequest}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[colors.tint, colors.primaryGradient[1]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.downloadButtonGradient}
                    >
                        <FontAwesome name="plus" size={18} color="#fff" style={{ marginRight: 12 }} />
                        <Text style={styles.downloadButtonText}>{Strings.sharedDetail.downloadBtn}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
    subHeaderTitle: {
        marginBottom: 8,
    },
    subHeaderTitleText: {
        fontSize: 14,
        fontWeight: '800',
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 12,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
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
