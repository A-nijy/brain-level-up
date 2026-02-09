import React, { useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Platform, ActionSheetIOS, useWindowDimensions } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLibraryDetail } from '@/hooks/useLibraryDetail';
import { Item } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { ItemService } from '@/services/ItemService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ExportModal, ExportOptions as PDFExportOptions } from '@/components/ExportModal';
import { PdfService } from '@/services/PdfService';

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const { library, items, loading, refreshing, refresh, reorderItems } = useLibraryDetail(libraryId);
    const [reorderMode, setReorderMode] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const isWeb = Platform.OS === 'web' && width > 768;

    const handleEditLibrary = () => {
        router.push({
            pathname: "/library/edit",
            params: { id: libraryId }
        });
    };

    const handleDeleteLibrary = async () => {
        if (!libraryId) return;
        try {
            await LibraryService.deleteLibrary(libraryId);
            if (Platform.OS === 'web') window.alert('암기장이 삭제되었습니다.');
            else Alert.alert('성공', '암기장이 삭제되었습니다.');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            if (Platform.OS === 'web') window.alert(`삭제 실패: ${error.message}`);
            else Alert.alert('오류', error.message);
        }
    };

    const showLibraryOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['취소', '암기장 수정', '암기장 삭제'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handleEditLibrary();
                    if (buttonIndex === 2) {
                        Alert.alert('삭제 확인', '정말 이 암기장을 삭제하시겠습니까? 포함된 모든 단어가 삭제됩니다.', [
                            { text: '취소', style: 'cancel' },
                            { text: '삭제', style: 'destructive', onPress: handleDeleteLibrary }
                        ]);
                    }
                }
            );
        } else if (Platform.OS === 'web') {
            handleEditLibrary();
        } else {
            Alert.alert(
                '암기장 설정',
                '원하는 작업을 선택하세요.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제', style: 'destructive', onPress: () => {
                            Alert.alert('삭제 확인', '정말 삭제하시겠습니까?', [
                                { text: '취소', style: 'cancel' },
                                { text: '삭제', style: 'destructive', onPress: handleDeleteLibrary }
                            ]);
                        }
                    },
                    { text: '수정', onPress: handleEditLibrary },
                ]
            );
        }
    };

    const handleEditItem = (item: Item) => {
        router.push({
            pathname: `/library/${libraryId}/edit-item`,
            params: { itemId: item.id }
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await ItemService.deleteItem(itemId);
            refresh();
        } catch (error: any) {
            console.error(error);
            Alert.alert('오류', '삭제 실패: ' + error.message);
        }
    };

    const showItemOptions = (item: Item) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['취소', '수정', '삭제'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handleEditItem(item);
                    if (buttonIndex === 2) handleDeleteItem(item.id);
                }
            );
        } else if (Platform.OS === 'web') {
            if (window.confirm(`${item.question}\n\n이 단어를 수정하시겠습니까?\n(취소를 누르면 삭제를 선택할 수 있습니다)`)) {
                handleEditItem(item);
            } else {
                if (window.confirm('정말 삭제하시겠습니까?')) {
                    handleDeleteItem(item.id);
                }
            }
        } else {
            Alert.alert(
                item.question,
                '작업 선택',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: () => handleDeleteItem(item.id) },
                    { text: '수정', onPress: () => handleEditItem(item) },
                ]
            );
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        await reorderItems(newItems);
    };

    const handleMoveDown = async (index: number) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
        await reorderItems(newItems);
    };

    const handleExport = async (options: PDFExportOptions) => {
        let exportItems = [...items];
        if (options.range === 'wrong') {
            exportItems = items.filter(item => item.fail_count > 0);
        }

        try {
            await PdfService.generateAndShare(exportItems, {
                mode: options.mode,
                order: options.order,
                title: library?.title || '단어장',
                action: options.action
            });
        } catch (error: any) {
            Alert.alert('오류', 'PDF 생성 중 문제가 발생했습니다: ' + error.message);
        }
    };

    const renderItem = ({ item, index }: { item: Item, index: number }) => (
        <Animated.View
            entering={FadeInUp.delay(index * 40).duration(400)}
            style={isWeb && { width: '48%', marginBottom: 16 }}
        >
            <Card
                style={styles.itemCard}
                onPress={reorderMode ? undefined : () => showItemOptions(item)}
                activeOpacity={reorderMode ? 1 : 0.7}
            >
                <View variant="transparent" style={styles.itemContent}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.answer}</Text>
                    {item.memo && (
                        <Text style={[styles.memoText, { color: colors.tint }]}>{item.memo}</Text>
                    )}
                </View>
                <View variant="transparent" style={styles.rightAction}>
                    <View variant="transparent" style={styles.statsContainer}>
                        <View variant="transparent" style={styles.statLine}>
                            <FontAwesome name="check" size={12} color={colors.success} />
                            <Text style={[styles.statValue, { color: colors.success }]}>{item.success_count}</Text>
                        </View>
                        <View variant="transparent" style={styles.statLine}>
                            <FontAwesome name="times" size={12} color={colors.error} />
                            <Text style={[styles.statValue, { color: colors.error }]}>{item.fail_count}</Text>
                        </View>
                    </View>
                    <FontAwesome name="angle-right" size={20} color={colors.border} />
                </View>

                {reorderMode && (
                    <View variant="transparent" style={styles.reorderControls}>
                        <TouchableOpacity
                            style={[styles.reorderButton, index === 0 && { opacity: 0.3 }]}
                            onPress={() => handleMoveUp(index)}
                            disabled={index === 0}
                        >
                            <FontAwesome name="arrow-up" size={16} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.reorderButton, index === items.length - 1 && { opacity: 0.3 }]}
                            onPress={() => handleMoveDown(index)}
                            disabled={index === items.length - 1}
                        >
                            <FontAwesome name="arrow-down" size={16} color={colors.tint} />
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        </Animated.View>
    );

    if (loading && !refreshing) {
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
                    headerTitle: library?.title || '암기장 상세',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {items.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => setReorderMode(!reorderMode)}
                                    style={[styles.headerIconButton, reorderMode && { backgroundColor: colors.tint + '20', borderRadius: 8, padding: 4 }]}
                                >
                                    <FontAwesome name="sort" size={18} color={colors.tint} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setExportModalVisible(true)} style={styles.headerIconButton}>
                                <FontAwesome name="print" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push(`/library/${id}/import`)} style={styles.headerIconButton}>
                                <FontAwesome name="upload" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: "/library/[id]/create-item",
                                params: { id: libraryId }
                            })} style={styles.headerIconButton}>
                                <FontAwesome name="plus" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            {!isWeb && (
                                <TouchableOpacity onPress={showLibraryOptions}>
                                    <FontAwesome name="ellipsis-v" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }}
            />

            <FlatList
                key={`item-list-${reorderMode}-${isWeb ? 2 : 1}`}
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={isWeb ? 2 : 1}
                columnWrapperStyle={isWeb ? { gap: 16 } : undefined}
                contentContainerStyle={[
                    styles.listContent,
                    isWeb && { maxWidth: 1000, alignSelf: 'center', width: '100%' }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
                }
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        {library?.description && (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {library.description}
                            </Text>
                        )}
                        <View variant="transparent" style={styles.headerStats}>
                            <Text style={styles.countText}>총 {items.length}개의 단어</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="file-text-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 단어가 없습니다.</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => router.push({
                                pathname: "/library/[id]/create-item",
                                params: { id: libraryId }
                            })}
                        >
                            <Text style={styles.addButtonText}>첫 번째 단어 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View variant="transparent" style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.playButton, isWeb && { maxWidth: 400, alignSelf: 'center' }]}
                        onPress={() => router.push(`/study/${id}`)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[colors.tint, colors.primaryGradient[1]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.playButtonGradient}
                        >
                            <FontAwesome name="play" size={18} color="#fff" style={{ marginRight: 12 }} />
                            <Text style={styles.playButtonText}>학습 시작하기</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <ExportModal
                isVisible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                onExport={handleExport}
                hasWrongItems={items.some(item => item.fail_count > 0)}
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
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    listContent: {
        padding: 20,
        paddingBottom: 140,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    itemContent: {
        flex: 1,
        marginRight: 12,
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
    rightAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsContainer: {
        marginRight: 16,
        alignItems: 'flex-end',
        gap: 6,
    },
    statLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    headerIconButton: {
        marginRight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 32,
    },
    addButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    },
    playButton: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    playButtonGradient: {
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    reorderControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginLeft: 16,
        paddingLeft: 16,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.03)',
    },
    reorderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
