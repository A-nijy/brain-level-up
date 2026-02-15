import React, { useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Platform, ActionSheetIOS, useWindowDimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSectionDetail } from '@/hooks/useSectionDetail';
import { Item } from '@/types';
import { ItemService } from '@/services/ItemService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ExportModal, ExportOptions as PDFExportOptions } from '@/components/ExportModal';
import { PdfService } from '@/services/PdfService';

export default function SectionDetailScreen() {
    const { id, sectionId } = useLocalSearchParams();
    const router = useRouter();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const { section, items, loading, refreshing, refresh, reorderItems } = useSectionDetail(sid);
    const [reorderMode, setReorderMode] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedItemForStatus, setSelectedItemForStatus] = useState<Item | null>(null);

    const isWeb = Platform.OS === 'web' && width > 768;

    const toggleMenu = () => setMenuVisible(!menuVisible);

    const handleMenuOption = (action: () => void) => {
        setMenuVisible(false);
        action();
    };

    const handleEditItem = (item: Item) => {
        router.push({
            pathname: "/library/[id]/section/[sectionId]/edit-item",
            params: { id: libraryId, sectionId: sid, itemId: item.id }
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
            exportItems = items.filter(item => item.study_status === 'confused');
        }

        try {
            await PdfService.generateAndShare(exportItems, {
                mode: options.mode,
                order: options.order,
                title: section?.title || '단어장',
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
                    <TouchableOpacity
                        style={styles.statusIconButton}
                        onPress={() => {
                            setSelectedItemForStatus(item);
                            setStatusModalVisible(true);
                        }}
                    >
                        {item.study_status === 'learned' ? (
                            <FontAwesome name="check-circle" size={24} color={colors.success} />
                        ) : item.study_status === 'confused' ? (
                            <FontAwesome name="exclamation-circle" size={24} color={colors.error} />
                        ) : (
                            <FontAwesome name="circle-o" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
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
                    headerTitle: section?.title || '단어 목록',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/library/[id]/section/[sectionId]/create-item",
                                    params: { id: libraryId, sectionId: sid }
                                })}
                                style={styles.headerIconButton}
                            >
                                <FontAwesome name="plus" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleMenu} style={[styles.headerIconButton, { marginRight: 0 }]}>
                                <FontAwesome name="bars" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            {/* Dropdown Menu */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuOverlay}>
                        <View variant="transparent" style={styles.menuContainer}>
                            <Card style={styles.menuContent}>
                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleMenuOption(() => setReorderMode(!reorderMode))}
                                >
                                    <FontAwesome name="sort" size={16} color={colors.tint} style={styles.menuIcon} />
                                    <Text style={styles.menuOptionText}>{reorderMode ? '순서 변경 종료' : '순서 변경'}</Text>
                                </TouchableOpacity>

                                <View variant="transparent" style={styles.menuDivider} />

                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleMenuOption(() => setExportModalVisible(true))}
                                >
                                    <FontAwesome name="print" size={16} color={colors.tint} style={styles.menuIcon} />
                                    <Text style={styles.menuOptionText}>PDF 내보내기</Text>
                                </TouchableOpacity>

                                <View variant="transparent" style={styles.menuDivider} />

                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleMenuOption(() => router.push(`/library/${libraryId}/section/${sid}/import`))}
                                >
                                    <FontAwesome name="upload" size={16} color={colors.tint} style={styles.menuIcon} />
                                    <Text style={styles.menuOptionText}>단어 가져오기</Text>
                                </TouchableOpacity>
                            </Card>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

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
                                pathname: "/library/[id]/section/[sectionId]/create-item",
                                params: { id: libraryId, sectionId: sid }
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
                        onPress={() => router.push(`/study/${libraryId}?sectionId=${sid}`)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[colors.tint, colors.primaryGradient[1]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.playButtonGradient}
                        >
                            <FontAwesome name="play" size={18} color="#fff" style={{ marginRight: 12 }} />
                            <Text style={styles.playButtonText}>이 항목 학습하기</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <ExportModal
                isVisible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                onExport={handleExport}
                hasWrongItems={items.some(item => item.study_status === 'confused')}
            />

            {/* Status Selection Modal */}
            <Modal
                visible={statusModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View variant="transparent" style={styles.statusModalContainer}>
                            <Card style={styles.statusModalContent}>
                                <Text style={styles.statusModalTitle}>상태 변경</Text>
                                <TouchableOpacity
                                    style={styles.statusOption}
                                    onPress={async () => {
                                        if (selectedItemForStatus) {
                                            try {
                                                await ItemService.updateItem(selectedItemForStatus.id, { study_status: 'learned' });
                                                refresh();
                                            } catch (error: any) {
                                                Alert.alert('변경 실패', '오류 발생');
                                            }
                                        }
                                        setStatusModalVisible(false);
                                    }}
                                >
                                    <FontAwesome name="check-circle" size={20} color={colors.success} style={styles.menuIcon} />
                                    <Text style={styles.statusOptionText}>외움</Text>
                                    {selectedItemForStatus?.study_status === 'learned' && (
                                        <FontAwesome name="check" size={14} color={colors.tint} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>

                                <View variant="transparent" style={styles.menuDivider} />

                                <TouchableOpacity
                                    style={styles.statusOption}
                                    onPress={async () => {
                                        if (selectedItemForStatus) {
                                            try {
                                                await ItemService.updateItem(selectedItemForStatus.id, { study_status: 'confused' });
                                                refresh();
                                            } catch (error: any) {
                                                Alert.alert('변경 실패', '오류 발생');
                                            }
                                        }
                                        setStatusModalVisible(false);
                                    }}
                                >
                                    <FontAwesome name="exclamation-circle" size={20} color={colors.error} style={styles.menuIcon} />
                                    <Text style={styles.statusOptionText}>헷갈림</Text>
                                    {selectedItemForStatus?.study_status === 'confused' && (
                                        <FontAwesome name="check" size={14} color={colors.tint} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>

                                <View variant="transparent" style={styles.menuDivider} />

                                <TouchableOpacity
                                    style={styles.statusOption}
                                    onPress={async () => {
                                        if (selectedItemForStatus) {
                                            try {
                                                await ItemService.updateItem(selectedItemForStatus.id, { study_status: 'undecided' });
                                                refresh();
                                            } catch (error: any) {
                                                Alert.alert('변경 실패', '오류 발생');
                                            }
                                        }
                                        setStatusModalVisible(false);
                                    }}
                                >
                                    <FontAwesome name="circle-o" size={20} color={colors.textSecondary} style={styles.menuIcon} />
                                    <Text style={styles.statusOptionText}>미정</Text>
                                    {(selectedItemForStatus?.study_status === 'undecided' || !selectedItemForStatus?.study_status) && (
                                        <FontAwesome name="check" size={14} color={colors.tint} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            </Card>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    statusIconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
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
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusModalContainer: {
        width: '100%',
        alignItems: 'center',
    },
    statusModalContent: {
        width: 240,
        padding: 16,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    statusModalTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
        opacity: 0.8,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    statusOptionText: {
        fontSize: 16,
        fontWeight: '700',
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 60,
        right: 20,
        zIndex: 1000,
    },
    menuContent: {
        width: 180,
        padding: 8,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    menuIcon: {
        width: 24,
        marginRight: 10,
    },
    menuOptionText: {
        fontSize: 15,
        fontWeight: '600',
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 8,
    },
});
