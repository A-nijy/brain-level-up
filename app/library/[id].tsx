import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Platform, ActionSheetIOS } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLibraryDetail } from '@/hooks/useLibraryDetail';
import { Item } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { ItemService } from '@/services/ItemService';

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const libraryId = Array.isArray(id) ? id[0] : id;

    // Custom Hook 사용
    const { library, items, loading, refreshing, refresh } = useLibraryDetail(libraryId);

    // --- 암기장 관련 로직 ---
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
            // Web/Native Success Message
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
            // Web: Simple Confirm or Custom Modal (MVP: confirm for delete)
            // Web doesn't support ActionSheet well without custom UI. 
            // We'll mimic selection with window.confirm or just navigate to edit? 
            // Let's use simple window.confirm flow for Delete, but how to access Edit?
            // Web UX: maybe distinct buttons in header?
            // For now, let's use window.prompt or a specific flow. 
            // Actually, let's just make two buttons in header for Web if possible, or use a JS confirm flow.
            // Simplest: Edit is default click of gear? No. 
            // Let's use window.confirm("확인=수정, 취소=삭제")? No, bad UX.
            // Let's just ask user what they want with window.prompt? No.
            // Best for Web MVP: Show two alerts or just navigate to Edit, and Put Delete button inside Edit Screen?
            // Let's go with: Gear Icon -> ActionSheet (if library supported) or simple Alert with buttons (Android supports 3 buttons, Web supports none).

            // Web Solution for MVP: 
            // Navigate to Edit Screen directly, and PUT 'DELETE' BUTTON IN EDIT SCREEN.
            // This is a common pattern.
            // So for now, Gear Icon -> Edit Screen on Web/Android? 
            // Android Alert supports 3 buttons (Neutral).
            handleEditLibrary(); // On web/android, just go to Edit. We will add Delete button in Edit Screen later if needed.
            // But wait, Android supports Alert with Neutral.
        } else {
            // Android
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

    // --- 단어 관련 로직 ---
    const handleEditItem = (item: Item) => {
        router.push({
            pathname: `/library/${libraryId}/edit-item`,
            params: { itemId: item.id }
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await ItemService.deleteItem(itemId);
            refresh(); // 목록 갱신
        } catch (error: any) {
            console.error(error);
            Alert.alert('오류', '삭제 실패: ' + error.message);
        }
    };

    const showItemOptions = (item: Item) => {
        // Similar logic
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
            // Web: confirm for delete? or edit?
            if (window.confirm(`${item.question}\n\n이 단어를 수정하시겠습니까?\n(취소를 누르면 삭제를 선택할 수 있습니다)`)) {
                handleEditItem(item);
            } else {
                if (window.confirm('정말 삭제하시겠습니까?')) {
                    handleDeleteItem(item.id);
                }
            }
        } else {
            // Android
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

    const renderItem = ({ item }: { item: Item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemContent}>
                <Text style={styles.questionText}>{item.question}</Text>
                <Text style={styles.answerText}>{item.answer}</Text>
                {item.memo && <Text style={styles.memoText}>{item.memo}</Text>}
            </View>
            <View style={styles.rightAction}>
                <View style={styles.stats}>
                    <Text style={styles.statText}>O: {item.success_count}</Text>
                    <Text style={styles.statText}>X: {item.fail_count}</Text>
                </View>
                <TouchableOpacity onPress={() => showItemOptions(item)} style={styles.moreButton}>
                    <FontAwesome name="ellipsis-v" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: library?.title || '암기장 상세',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => router.push(`/library/${id}/import`)} style={{ marginRight: 15 }}>
                                <FontAwesome name="cloud-upload" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: "/library/[id]/create-item",
                                params: { id: libraryId }
                            })} style={{ marginRight: 15 }}>
                                <FontAwesome name="plus" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={showLibraryOptions}>
                                <FontAwesome name="cog" size={22} color="#333" />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            {library?.description ? (
                <View style={styles.header}>
                    <Text style={styles.descriptionText}>{library.description}</Text>
                </View>
            ) : null}

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="file-text-o" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>등록된 단어가 없습니다.</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => router.push({
                                pathname: "/library/[id]/create-item",
                                params: { id: libraryId }
                            })}
                        >
                            <Text style={styles.addButtonText}>단어 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => router.push(`/study/${id}`)}
                    >
                        <FontAwesome name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.playButtonText}>암기 시작 ({items.length}개)</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // For footer
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    itemContent: {
        flex: 1,
        marginRight: 10,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    answerText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    memoText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    rightAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stats: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginRight: 15,
    },
    moreButton: {
        padding: 10,
    },
    statText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 16,
        marginTop: 16,
    },
    addButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    playButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
