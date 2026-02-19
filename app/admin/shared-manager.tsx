import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { AdminService } from '@/services/AdminService';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

export default function SharedManagerScreen() {
    const [sharedLibs, setSharedLibs] = useState<SharedLibrary[]>([]);
    const [draftLibs, setDraftLibs] = useState<SharedLibrary[]>([]);
    const [categories, setCategories] = useState<SharedLibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
    const [isDirectModalVisible, setIsDirectModalVisible] = useState(false);
    const [directForm, setDirectForm] = useState({ // Simplified
        title: '',
        description: '',
        category_id: null as string | null
    });
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const adminId = userData.user?.id;

            const [sLibs, cats, dLibs] = await Promise.all([
                SharedLibraryService.getSharedLibraries(),
                AdminService.getSharedCategories(),
                AdminService.getDraftSharedLibraries()
            ]);
            setSharedLibs(sLibs);
            setCategories(cats);
            setDraftLibs(dLibs); // NEW
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [editingLib, setEditingLib] = useState<SharedLibrary | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category_id: '' as string | null });

    // Draft 수정용 state
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
            await AdminService.updateSharedLibrary(editingDraft.id, {
                title: editDraftForm.title,
                description: editDraftForm.description,
                category_id: editDraftForm.category_id
            });
            window.alert('수정되었습니다.');
            setEditingDraft(null);
            loadData();
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const handlePublishDraft = async (lib: SharedLibrary) => {
        try {
            // 섹션 유무 확인
            const sections = await SharedLibraryService.getSharedSections(lib.id);
            if (sections.length === 0) {
                window.alert('최소 1개 이상의 섹션이 필요합니다.');
                return;
            }

            if (window.confirm(`"${lib.title}" 자료를 공유 자료실에 정식으로 게시하시겠습니까?`)) {
                await AdminService.publishDraftSharedLibrary(lib.id);
                window.alert('공유 자료실에 게시되었습니다!');
                loadData();
            }
        } catch (error: any) {
            window.alert('게시 실패: ' + error.message);
        }
    };

    const handleDeleteDraft = async (lib: SharedLibrary) => {
        if (!window.confirm(`"${lib.title}" 을(를) 삭제하시겠습니까?`)) return;
        try {
            await AdminService.deleteDraftSharedLibrary(lib.id);
            loadData();
        } catch (error: any) {
            window.alert('삭제 실패: ' + error.message);
        }
    };

    const handleUpdate = async () => {
        if (!editingLib) return;
        try {
            await AdminService.updateSharedLibrary(editingLib.id, {
                title: editForm.title,
                description: editForm.description,
                category_id: editForm.category_id
            });
            window.alert('단어장 정보가 수정되었습니다!');
            setEditingLib(null);
            loadData();
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const handleDeleteShared = async (item: SharedLibrary) => {
        if (window.confirm(`"${item.title}" 게시물을 완전히 삭제하시겠습니까?`)) {
            try {
                await AdminService.deleteSharedLibrary(item.id);
                loadData();
            } catch (error: any) {
                window.alert('삭제 실패: ' + error.message);
            }
        }
    };

    const handleUnpublishShared = async (item: SharedLibrary) => {
        if (window.confirm(`"${item.title}" 게시물을 임시 저장 상태로 되돌리시겠습니까?\n마켓플레이스에서 더 이상 노출되지 않습니다.`)) {
            try {
                await AdminService.unpublishSharedLibrary(item.id);
                loadData();
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
            setLoading(true);
            const { data } = await supabase.auth.getUser();
            if (!data.user) throw new Error('관리자 정보를 찾을 수 없습니다.');

            await AdminService.createDraftSharedLibrary({
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
            loadData();
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isDirectModalVisible && !editingLib) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>공유 마켓 관리자</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>콘텐츠 큐레이션 및 품질 관리</Text>
                </View>
                <View variant="transparent" style={styles.headerActions}>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.tint }]} onPress={() => setIsDirectModalVisible(true)}>
                        <FontAwesome name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View variant="transparent" style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'draft' && { borderBottomColor: colors.tint }]}
                    onPress={() => setActiveTab('draft')}
                >
                    <Text style={[styles.tabText, activeTab === 'draft' && { color: colors.tint, fontWeight: 'bold' }]}>임시 저장</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'published' && { borderBottomColor: colors.tint }]}
                    onPress={() => setActiveTab('published')}
                >
                    <Text style={[styles.tabText, activeTab === 'published' && { color: colors.tint, fontWeight: 'bold' }]}>게시 완료</Text>
                </TouchableOpacity>
            </View>


            {activeTab === 'draft' && (
                <View variant="transparent" style={styles.section}>
                    <View variant="transparent" style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>임시 저장 목록</Text>
                        <TouchableOpacity onPress={loadData}>
                            <FontAwesome name="refresh" size={16} color={colors.tint} />
                        </TouchableOpacity>
                    </View>
                    {draftLibs.map((item) => (
                        <Card key={item.id} style={styles.libCard}>
                            <View variant="transparent" style={styles.libInfo}>
                                <Text style={styles.libTitle}>{item.title}</Text>
                                <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                    {item.category || '미지정'} | 임시 저장
                                </Text>
                            </View>
                            <View variant="transparent" style={styles.actionGroup}>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: colors.tint }]}
                                    onPress={() => router.push(`/admin/shared-library/${item.id}` as any)}
                                >
                                    <FontAwesome name="folder-open" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: '#F59E0B' }]}
                                    onPress={() => {
                                        setEditingDraft(item);
                                        setEditDraftForm({
                                            title: item.title,
                                            description: item.description || '',
                                            category_id: item.category_id
                                        });
                                    }}
                                >
                                    <FontAwesome name="edit" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: colors.success }]}
                                    onPress={() => handlePublishDraft(item)}
                                >
                                    <FontAwesome name="check" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: colors.error }]}
                                    onPress={() => handleDeleteDraft(item)}
                                >
                                    <FontAwesome name="trash" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}
                    {draftLibs.length === 0 && <Text style={styles.emptyText}>임시 저장된 자료가 없습니다.</Text>}
                </View>
            )}

            {activeTab === 'published' && (
                <View variant="transparent" style={styles.section}>
                    <View variant="transparent" style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>마켓플레이스 게시물</Text>
                        <TouchableOpacity onPress={loadData}>
                            <FontAwesome name="refresh" size={16} color={colors.tint} />
                        </TouchableOpacity>
                    </View>
                    {sharedLibs.map((item) => (
                        <Card key={item.id} style={styles.libCard}>
                            <View variant="transparent" style={styles.libInfo}>
                                <Text style={styles.libTitle}>{item.title}</Text>
                                <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                    다운로드: {item.download_count} | {item.category}
                                </Text>
                            </View>
                            <View variant="transparent" style={styles.actionGroup}>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: colors.tint }]}
                                    onPress={() => router.push(`/admin/shared-library/${item.id}` as any)}
                                >
                                    <FontAwesome name="folder-open" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: '#F59E0B' }]}
                                    onPress={() => handleEditOpen(item)}
                                >
                                    <FontAwesome name="edit" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: '#3B82F6' }]}
                                    onPress={() => handleUnpublishShared(item)}
                                >
                                    <FontAwesome name="undo" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniButton, { backgroundColor: colors.error }]}
                                    onPress={() => handleDeleteShared(item)}
                                >
                                    <FontAwesome name="trash" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}
                    {sharedLibs.length === 0 && <Text style={styles.emptyText}>공유된 단어장이 없습니다.</Text>}
                </View>
            )}

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
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 14,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    testButtonText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        color: '#64748B',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    libCard: {
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    libInfo: {
        flex: 1,
        marginRight: 10,
    },
    libTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    libSub: {
        fontSize: 12,
        marginTop: 4,
    },
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
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
    },
    helpText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
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
        marginTop: 30,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemInputGroup: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    miniInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
        backgroundColor: '#fff',
    }
});
