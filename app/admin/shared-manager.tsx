import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useAdminShared } from '@/hooks/useAdminShared';

export default function SharedManagerScreen() {
    const {
        sharedLibs,
        draftLibs,
        categories,
        loading,
        refresh,
        updateSharedLibrary,
        publishDraft,
        deleteDraft,
        deleteShared,
        unpublishShared,
        createDraft
    } = useAdminShared();

    const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
    const [isDirectModalVisible, setIsDirectModalVisible] = useState(false);
    const [directForm, setDirectForm] = useState({
        title: '',
        description: '',
        category_id: null as string | null
    });
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [editingLib, setEditingLib] = useState<SharedLibrary | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category_id: '' as string | null });

    const [editingDraft, setEditingDraft] = useState<SharedLibrary | null>(null);
    const [editDraftForm, setEditDraftForm] = useState({ title: '', description: '', category_id: null as string | null });

    const handleEditOpen = (lib: SharedLibrary) => {
        setEditingLib(lib);
        setEditForm({
            title: lib.title,
            description: lib.description || '',
            category_id: lib.category_id
        });
    };

    const handleUpdateDraft = async () => {
        if (!editingDraft) return;
        try {
            await updateSharedLibrary(editingDraft.id, {
                title: editDraftForm.title,
                description: editDraftForm.description,
                category_id: editDraftForm.category_id
            });
            window.alert('수정되었습니다.');
            setEditingDraft(null);
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const handlePublishDraft = async (lib: SharedLibrary) => {
        try {
            const sections = await SharedLibraryService.getSharedSections(lib.id);
            if (sections.length === 0) {
                window.alert('최소 1개 이상의 섹션이 필요합니다.');
                return;
            }

            if (window.confirm(`"${lib.title}" 자료를 공유 자료실에 정식으로 게시하시겠습니까?`)) {
                await publishDraft(lib.id);
                window.alert('공유 자료실에 게시되었습니다!');
            }
        } catch (error: any) {
            window.alert('게시 실패: ' + error.message);
        }
    };

    const handleDeleteDraft = async (lib: SharedLibrary) => {
        if (!window.confirm(`"${lib.title}" 을(를) 삭제하시겠습니까?`)) return;
        try {
            await deleteDraft(lib.id);
        } catch (error: any) {
            window.alert('삭제 실패: ' + error.message);
        }
    };

    const handleUpdate = async () => {
        if (!editingLib) return;
        try {
            await updateSharedLibrary(editingLib.id, {
                title: editForm.title,
                description: editForm.description,
                category_id: editForm.category_id
            });
            window.alert('단어장 정보가 수정되었습니다!');
            setEditingLib(null);
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const handleDeleteShared = async (item: SharedLibrary) => {
        if (window.confirm(`"${item.title}" 게시물을 완전히 삭제하시겠습니까?`)) {
            try {
                await deleteShared(item.id);
            } catch (error: any) {
                window.alert('삭제 실패: ' + error.message);
            }
        }
    };

    const handleUnpublishShared = async (item: SharedLibrary) => {
        if (window.confirm(`"${item.title}" 게시물을 임시 저장 상태로 되돌리시겠습니까?\n마켓플레이스에서 더 이상 노출되지 않습니다.`)) {
            try {
                await unpublishShared(item.id);
            } catch (error: any) {
                window.alert('처리 실패: ' + error.message);
            }
        }
    };

    const handleCreateDraft = async () => {
        if (!directForm.title.trim()) {
            window.alert('제목을 입력해주세요.');
            return;
        }

        try {
            const { data } = await supabase.auth.getUser();
            if (!data.user) throw new Error('관리자 정보를 찾을 수 없습니다.');

            await createDraft({
                ...directForm,
                adminId: data.user.id
            });

            window.alert('임시 저장되었습니다. 임시 저장 탭에서 내용을 추가해주세요.');
            setIsDirectModalVisible(false);
            setDirectForm({
                title: '',
                description: '',
                category_id: null
            });
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const LibRow = ({ item, isDraft }: { item: SharedLibrary, isDraft: boolean }) => (
        <View variant="transparent" style={styles.tableRow}>
            <View variant="transparent" style={[styles.col, { flex: 2.5 }]}>
                <View style={[styles.libIconContainer, { backgroundColor: colors.tint + '10' }]}>
                    <FontAwesome name="book" size={16} color={colors.tint} />
                </View>
                <View variant="transparent">
                    <Text style={styles.cellText}>{item.title}</Text>
                    <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{item.category || '미지정'}</Text>
                </View>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                <View style={[styles.statusBadge, { backgroundColor: (isDraft ? '#F59E0B' : colors.success) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isDraft ? '#F59E0B' : colors.success }]} />
                    <Text style={[styles.statusText, { color: isDraft ? '#F59E0B' : colors.success }]}>
                        {isDraft ? '임시 저장' : '게시됨'}
                    </Text>
                </View>
            </View>

            {!isDraft && (
                <View variant="transparent" style={[styles.col, { flex: 0.8 }]}>
                    <Text style={styles.cellText}>{item.download_count || 0}</Text>
                </View>
            )}

            <View variant="transparent" style={[styles.col, { flex: 1.2 }]}>
                <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1.5, justifyContent: 'flex-end', gap: 8 }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                    onPress={() => router.push(`/admin/shared-library/${item.id}` as any)}
                >
                    <FontAwesome name="folder-open" size={12} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => isDraft ? (
                        setEditingDraft(item),
                        setEditDraftForm({
                            title: item.title,
                            description: item.description || '',
                            category_id: item.category_id
                        })
                    ) : handleEditOpen(item)}
                >
                    <FontAwesome name="edit" size={12} color="#fff" />
                </TouchableOpacity>
                {isDraft ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.success }]}
                        onPress={() => handlePublishDraft(item)}
                    >
                        <FontAwesome name="check" size={12} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => handleUnpublishShared(item)}
                    >
                        <FontAwesome name="undo" size={12} color="#fff" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => isDraft ? handleDeleteDraft(item) : handleDeleteShared(item)}
                >
                    <FontAwesome name="trash" size={12} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !isDirectModalVisible && !editingLib) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>공유 콘텐츠 관리</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>마켓플레이스 자료 큐레이션 및 품질 관리</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setIsDirectModalVisible(true)}>
                    <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addBtnText}>신규 자료 등록</Text>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={styles.tabWrapper}>
                <View variant="transparent" style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
                        onPress={() => setActiveTab('draft')}
                    >
                        <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
                            임시 저장 ({draftLibs.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'published' && styles.activeTab]}
                        onPress={() => setActiveTab('published')}
                    >
                        <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>
                            게시 완료 ({sharedLibs.length})
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
                    <FontAwesome name="refresh" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <Card style={styles.tableCard}>
                <View variant="transparent" style={styles.tableHeader}>
                    <Text style={[styles.headerCol, { flex: 2.5 }]}>단어장 정보</Text>
                    <Text style={[styles.headerCol, { flex: 1 }]}>상태</Text>
                    {activeTab === 'published' && <Text style={[styles.headerCol, { flex: 0.8 }]}>다운로드</Text>}
                    <Text style={[styles.headerCol, { flex: 1.2 }]}>생성일</Text>
                    <Text style={[styles.headerCol, { flex: 1.5, textAlign: 'right' }]}>관리</Text>
                </View>

                {activeTab === 'draft' ? (
                    draftLibs.length > 0 ? (
                        draftLibs.map((item) => <LibRow key={item.id} item={item} isDraft={true} />)
                    ) : (
                        <View variant="transparent" style={styles.emptyTable}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>임시 저장된 자료가 없습니다.</Text>
                        </View>
                    )
                ) : (
                    sharedLibs.length > 0 ? (
                        sharedLibs.map((item) => <LibRow key={item.id} item={item} isDraft={false} />)
                    ) : (
                        <View variant="transparent" style={styles.emptyTable}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>게시된 자료가 없습니다.</Text>
                        </View>
                    )
                )}
            </Card>

            {/* Edit Modal */}
            <Modal visible={!!editingLib} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>공유 단어장 수정</Text>

                        <Text style={styles.label}>제목</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.title}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                        />

                        <Text style={styles.label}>설명</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editForm.description}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                            multiline
                        />

                        <Text style={styles.label}>카테고리</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    !editForm.category_id && { backgroundColor: colors.tint }
                                ]}
                                onPress={() => setEditForm(prev => ({ ...prev, category_id: null }))}
                            >
                                <Text style={[styles.categoryChipText, !editForm.category_id && { color: '#fff' }]}>미지정</Text>
                            </TouchableOpacity>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        editForm.category_id === cat.id && { backgroundColor: colors.tint }
                                    ]}
                                    onPress={() => setEditForm(prev => ({ ...prev, category_id: cat.id }))}
                                >
                                    <Text style={[styles.categoryChipText, editForm.category_id === cat.id && { color: '#fff' }]}>
                                        {cat.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setEditingLib(null)}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdate}>
                                <Text style={styles.modalButtonText}>저장하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Draft 수정 Modal */}
            <Modal visible={!!editingDraft} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>임시 저장 자료 수정</Text>

                        <Text style={styles.label}>제목</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editDraftForm.title}
                            onChangeText={(text) => setEditDraftForm(prev => ({ ...prev, title: text }))}
                            placeholder="제목"
                            placeholderTextColor={colors.textSecondary}
                        />

                        <Text style={styles.label}>설명</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editDraftForm.description}
                            onChangeText={(text) => setEditDraftForm(prev => ({ ...prev, description: text }))}
                            multiline
                            placeholder="설명 (선택)"
                            placeholderTextColor={colors.textSecondary}
                        />

                        <Text style={styles.label}>카테고리</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                            <TouchableOpacity
                                style={[styles.categoryChip, !editDraftForm.category_id && { backgroundColor: colors.tint }]}
                                onPress={() => setEditDraftForm(prev => ({ ...prev, category_id: null }))}
                            >
                                <Text style={[styles.categoryChipText, !editDraftForm.category_id && { color: '#fff' }]}>미지정</Text>
                            </TouchableOpacity>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryChip, editDraftForm.category_id === cat.id && { backgroundColor: colors.tint }]}
                                    onPress={() => setEditDraftForm(prev => ({ ...prev, category_id: cat.id }))}
                                >
                                    <Text style={[styles.categoryChipText, editDraftForm.category_id === cat.id && { color: '#fff' }]}>
                                        {cat.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setEditingDraft(null)}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdateDraft}>
                                <Text style={styles.modalButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Direct Publish Modal */}
            <Modal visible={isDirectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, maxHeight: '90%' }]}>
                        <Text style={styles.modalTitle}>신규 자료 직접 작성 및 게시</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>제목</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={directForm.title}
                                onChangeText={(text) => setDirectForm(prev => ({ ...prev, title: text }))}
                                placeholder="예: [공식] 수능 필수 영단어 TOP 100"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>설명</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, height: 60 }]}
                                value={directForm.description}
                                onChangeText={(text) => setDirectForm(prev => ({ ...prev, description: text }))}
                                multiline
                                placeholder="자료에 대한 상세 설명을 입력하세요."
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>카테고리</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                                <TouchableOpacity
                                    style={[
                                        styles.categoryChip,
                                        !directForm.category_id && { backgroundColor: colors.tint }
                                    ]}
                                    onPress={() => setDirectForm(prev => ({ ...prev, category_id: null }))}
                                >
                                    <Text style={[styles.categoryChipText, !directForm.category_id && { color: '#fff' }]}>미지정</Text>
                                </TouchableOpacity>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            directForm.category_id === cat.id && { backgroundColor: colors.tint }
                                        ]}
                                        onPress={() => setDirectForm(prev => ({ ...prev, category_id: cat.id }))}
                                    >
                                        <Text style={[styles.categoryChipText, directForm.category_id === cat.id && { color: '#fff' }]}>
                                            {cat.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </ScrollView>

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setIsDirectModalVisible(false)}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleCreateDraft}>
                                <Text style={styles.modalButtonText}>임시 저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 15,
        marginTop: 4,
    },
    addBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    tabWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 4,
        borderRadius: 12,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#4F46E5',
    },
    refreshBtn: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableCard: {
        borderRadius: 24,
        borderWidth: 0,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    headerCol: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
    col: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    libIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cellText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTable: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 500,
        borderRadius: 24,
        padding: 32,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    categoryPicker: {
        flexDirection: 'row',
        marginTop: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
        backgroundColor: '#F8FAFC',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 32,
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalButtonText: {
        fontWeight: '700',
        fontSize: 15,
        color: '#fff',
    }
});
