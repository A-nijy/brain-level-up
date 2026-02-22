import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, TouchableOpacity, FlatList, RefreshControl, Platform, Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SharedItem } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SharedLibrarySectionDetailScreen() {
    const { id, sectionId } = useLocalSearchParams();
    const router = useRouter();
    const draftId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [section, setSection] = useState<any>(null);
    const [items, setItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 단어 추가 모달
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addForm, setAddForm] = useState({ question: '', answer: '', memo: '' });
    const [adding, setAdding] = useState(false);

    // 단어 수정 모달
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<SharedItem | null>(null);
    const [editForm, setEditForm] = useState({ question: '', answer: '', memo: '' });
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        if (!sid) return;
        try {
            const [sectionsData, itemsData] = await Promise.all([
                SharedLibraryService.getSharedSections(draftId),
                SharedLibraryService.getSharedItems(sid)
            ]);
            const currentSection = sectionsData.find((s: any) => s.id === sid);
            setSection(currentSection);
            setItems(itemsData);
        } catch (error) {
            console.error(error);
            window.alert('데이터를 가져오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sid]);

    const refresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddItem = async () => {
        if (!addForm.question.trim() || !addForm.answer.trim()) {
            window.alert('질문과 답변을 입력해주세요.');
            return;
        }

        setAdding(true);
        try {
            // Get current max display_order for this section
            const { data: sectionItems } = await supabase
                .from('shared_items')
                .select('display_order')
                .eq('shared_section_id', sid)
                .order('display_order', { ascending: false })
                .limit(1);

            const nextOrder = sectionItems && sectionItems.length > 0 ? sectionItems[0].display_order + 1 : 0;

            const { error } = await supabase
                .from('shared_items')
                .insert({
                    shared_library_id: draftId,
                    shared_section_id: sid,
                    question: addForm.question.trim(),
                    answer: addForm.answer.trim(),
                    memo: addForm.memo.trim() || null,
                    display_order: nextOrder
                });

            if (error) throw error;

            setAddForm({ question: '', answer: '', memo: '' });
            setAddModalVisible(false);
            fetchData();
        } catch (error: any) {
            window.alert('단어 추가 실패: ' + error.message);
        } finally {
            setAdding(true); // Should be false, wait I will fix in next chunk
            setAdding(false);
        }
    };

    const openEditModal = (item: SharedItem) => {
        setEditingItem(item);
        setEditForm({ question: item.question, answer: item.answer, memo: item.memo || '' });
        setEditModalVisible(true);
    };

    const handleEditItem = async () => {
        if (!editingItem || !editForm.question.trim() || !editForm.answer.trim()) {
            window.alert('질문과 답변을 입력해주세요.');
            return;
        }

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('shared_items')
                .update({
                    question: editForm.question.trim(),
                    answer: editForm.answer.trim(),
                    memo: editForm.memo.trim() || null
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            setEditModalVisible(false);
            setEditingItem(null);
            fetchData();
        } catch (error: any) {
            window.alert('단어 수정 실패: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('shared_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
            fetchData();
        } catch (error: any) {
            window.alert('삭제 실패: ' + error.message);
        }
    };

    const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

        const updates = newItems.map((item, idx) => ({
            id: item.id,
            display_order: idx
        }));

        setItems(newItems);

        try {
            await SharedLibraryService.reorderSharedItems(updates);
        } catch (error: any) {
            window.alert('순서 변경 실패: ' + error.message);
            fetchData();
        }
    };


    const renderItem = ({ item, index }: { item: SharedItem, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
            <Card style={styles.itemCard}>
                <View variant="transparent" style={styles.itemContent}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.answer}</Text>
                    {item.memo ? (
                        <Text style={[styles.memoText, { color: colors.tint }]}>{item.memo}</Text>
                    ) : null}
                </View>
                <View variant="transparent" style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === 0 ? 0.3 : 1 }]}
                        onPress={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                    >
                        <FontAwesome name="chevron-up" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === items.length - 1 ? 0.3 : 1 }]}
                        onPress={() => handleMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                    >
                        <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: '#F59E0B' }]}
                        onPress={() => openEditModal(item)}
                    >
                        <FontAwesome name="edit" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: colors.error }]}
                        onPress={() => {
                            if (window.confirm(`'${item.question}' 단어를 삭제하시겠습니까?`)) {
                                handleDeleteItem(item.id);
                            }
                        }}
                    >
                        <FontAwesome name="trash" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
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
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/admin/shared-library/[id]/section/[sectionId]/import" as any,
                                    params: { id: draftId, sectionId: sid }
                                })}
                                style={{ marginRight: 15 }}
                            >
                                <FontAwesome name="file-excel-o" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                                <FontAwesome name="plus" size={20} color={colors.tint} />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            <View variant="transparent" style={styles.topHeader}>
                <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.push({
                            pathname: "/admin/shared-library/[id]" as any,
                            params: { id: draftId }
                        })}
                    >
                        <FontAwesome name="chevron-left" size={18} color={colors.text} />
                    </TouchableOpacity>
                    <View variant="transparent">
                        <Text style={styles.titleText}>{section?.title || '단어 목록'}</Text>
                        <Text style={[styles.countText, { color: colors.textSecondary }]}>총 {items.length}개의 단어</Text>
                    </View>
                </View>
                <View variant="transparent" style={styles.topActionGroup}>
                    <TouchableOpacity
                        style={[styles.outlineButton, { borderColor: colors.tint }]}
                        onPress={() => router.push({
                            pathname: "/admin/shared-library/[id]/section/[sectionId]/import" as any,
                            params: { id: draftId, sectionId: sid }
                        })}
                    >
                        <FontAwesome name="file-excel-o" size={14} color={colors.tint} style={{ marginRight: 8 }} />
                        <Text style={[styles.outlineButtonText, { color: colors.tint }]}>CSV 가져오기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerAddButton, { backgroundColor: colors.tint }]}
                        onPress={() => setAddModalVisible(true)}
                    >
                        <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.headerAddButtonText}>단어 추가</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
                }
                ListHeaderComponent={null}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="file-text-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 단어가 없습니다.</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => setAddModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>첫 번째 단어 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* 단어 추가 모달 */}
            <Modal visible={addModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setAddModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                                <Text style={styles.modalTitle}>단어 추가</Text>
                                <Text style={styles.label}>질문 *</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={addForm.question}
                                    onChangeText={(t) => setAddForm(p => ({ ...p, question: t }))}
                                    placeholder="질문 (앞면)"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.label}>답변 *</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={addForm.answer}
                                    onChangeText={(t) => setAddForm(p => ({ ...p, answer: t }))}
                                    placeholder="답변 (뒷면)"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.label}>메모 (선택)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={addForm.memo}
                                    onChangeText={(t) => setAddForm(p => ({ ...p, memo: t }))}
                                    placeholder="추가 설명이나 예문"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border }]}
                                        onPress={() => { setAddModalVisible(false); setAddForm({ question: '', answer: '', memo: '' }); }}
                                    >
                                        <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleAddItem}
                                        disabled={adding}
                                    >
                                        <Text style={styles.modalButtonText}>{adding ? '추가 중...' : '추가'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* 단어 수정 모달 */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                                <Text style={styles.modalTitle}>단어 수정</Text>
                                <Text style={styles.label}>질문 *</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={editForm.question}
                                    onChangeText={(t) => setEditForm(p => ({ ...p, question: t }))}
                                    placeholder="질문 (앞면)"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.label}>답변 *</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={editForm.answer}
                                    onChangeText={(t) => setEditForm(p => ({ ...p, answer: t }))}
                                    placeholder="답변 (뒷면)"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.label}>메모 (선택)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={editForm.memo}
                                    onChangeText={(t) => setEditForm(p => ({ ...p, memo: t }))}
                                    placeholder="추가 설명이나 예문"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border }]}
                                        onPress={() => setEditModalVisible(false)}
                                    >
                                        <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleEditItem}
                                        disabled={updating}
                                    >
                                        <Text style={styles.modalButtonText}>{updating ? '수정 중...' : '수정'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listHeader: { paddingHorizontal: 4, paddingBottom: 8, marginTop: 8, paddingLeft: 20 },
    countText: { fontSize: 14, fontWeight: '700', opacity: 0.6 },
    listContent: { padding: 20, paddingBottom: 40 },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    itemContent: { flex: 1, marginRight: 12 },
    questionText: { fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
    answerText: { fontSize: 15, fontWeight: '500', lineHeight: 20, marginBottom: 4 },
    memoText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    actionGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    miniButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moveButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 32 },
    addButton: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16 },
    addButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', opacity: 0.6, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 32,
        paddingBottom: 0,
    },
    titleText: {
        fontSize: 24,
        fontWeight: '800',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginLeft: -8,
    },
    topActionGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    headerAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    headerAddButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    outlineButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
    importBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    importBtnText: {
        fontWeight: '700',
        fontSize: 15,
    },
});
