import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useAdminShared } from '@/hooks/useAdminShared';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

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
    const { showAlert } = useAlert();

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
            showAlert({ title: Strings.common.success, message: Strings.adminSharedManager.alerts.updated });
            setEditingDraft(null);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: error.message });
        }
    };

    const handlePublishDraft = async (lib: SharedLibrary) => {
        try {
            const sections = await SharedLibraryService.getSharedSections(lib.id);
            if (sections.length === 0) {
                showAlert({ title: Strings.common.warning, message: Strings.adminSharedManager.alerts.noSections });
                return;
            }

            showAlert({
                title: Strings.common.info,
                message: Strings.adminSharedManager.alerts.publishConfirm(lib.title),
                buttons: [
                    { text: Strings.common.cancel, style: 'cancel' },
                    {
                        text: Strings.common.confirm,
                        onPress: async () => {
                            await publishDraft(lib.id);
                            showAlert({ title: Strings.common.success, message: Strings.adminSharedManager.alerts.publishSuccess });
                        }
                    }
                ]
            });
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: error.message });
        }
    };

    const handleDeleteDraft = async (lib: SharedLibrary) => {
        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: Strings.adminSharedManager.alerts.deleteConfirm(lib.title),
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDraft(lib.id);
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const handleUpdate = async () => {
        if (!editingLib) return;
        try {
            await updateSharedLibrary(editingLib.id, {
                title: editForm.title,
                description: editForm.description,
                category_id: editForm.category_id
            });
            showAlert({ title: Strings.common.success, message: Strings.adminSharedManager.alerts.updated });
            setEditingLib(null);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: error.message });
        }
    };

    const handleDeleteShared = async (item: SharedLibrary) => {
        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: Strings.adminSharedManager.alerts.deleteSharedConfirm(item.title),
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteShared(item.id);
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const handleUnpublishShared = async (item: SharedLibrary) => {
        showAlert({
            title: Strings.common.info,
            message: Strings.adminSharedManager.alerts.unpublishConfirm(item.title),
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.confirm,
                    onPress: async () => {
                        try {
                            await unpublishShared(item.id);
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const handleCreateDraft = async () => {
        if (!directForm.title.trim()) {
            showAlert({ title: Strings.common.warning, message: Strings.adminSharedManager.alerts.enterTitle });
            return;
        }

        try {
            const { data } = await supabase.auth.getUser();
            if (!data.user) throw new Error(Strings.auth.errorNoAdmin);

            await createDraft({
                ...directForm,
                adminId: data.user.id
            });

            showAlert({ title: Strings.common.success, message: Strings.adminSharedManager.alerts.saveSuccess });
            setIsDirectModalVisible(false);
            setDirectForm({
                title: '',
                description: '',
                category_id: null
            });
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: error.message });
        }
    };

    const LibRow = ({ item, isDraft }: { item: SharedLibrary, isDraft: boolean }) => (
        <View variant="transparent" style={styles.tableRow}>
            <View variant="transparent" style={[styles.col, { flex: 2.5 }]}>
                <View style={[styles.libIconContainer, { backgroundColor: colors.tint + '10' }]}>
                    <FontAwesome name={Strings.admin.icons.libraries as any} size={16} color={colors.tint} />
                </View>
                <View variant="transparent">
                    <Text style={styles.cellText}>{item.title}</Text>
                    <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{item.category || Strings.adminSharedManager.modal.none}</Text>
                </View>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1 }]}>
                <View style={[styles.statusBadge, { backgroundColor: (isDraft ? '#F59E0B' : colors.success) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isDraft ? '#F59E0B' : colors.success }]} />
                    <Text style={[styles.statusText, { color: isDraft ? '#F59E0B' : colors.success }]}>
                        {isDraft ? Strings.adminSharedManager.status.draft : Strings.adminSharedManager.status.published}
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
                    <FontAwesome name={Strings.shared.icons.globe as any} size={12} color="#fff" />
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
                    <FontAwesome name={Strings.settings.icons.pencil as any} size={12} color="#fff" />
                </TouchableOpacity>
                {isDraft ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.success }]}
                        onPress={() => handlePublishDraft(item)}
                    >
                        <FontAwesome name={Strings.settings.icons.check as any} size={12} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => handleUnpublishShared(item)}
                    >
                        <FontAwesome name={Strings.settings.icons.refresh as any} size={12} color="#fff" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => isDraft ? handleDeleteDraft(item) : handleDeleteShared(item)}
                >
                    <FontAwesome name={Strings.common.icons.delete as any} size={12} color="#fff" />
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
                    <Text style={styles.title}>{Strings.adminSharedManager.title}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>{Strings.adminSharedManager.subtitle}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setIsDirectModalVisible(true)}>
                    <FontAwesome name={Strings.shared.icons.plus as any} size={14} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addBtnText}>{Strings.adminSharedManager.addBtn}</Text>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={styles.tabWrapper}>
                <View variant="transparent" style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
                        onPress={() => setActiveTab('draft')}
                    >
                        <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
                            {Strings.adminSharedManager.tabs.draft(draftLibs.length)}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'published' && styles.activeTab]}
                        onPress={() => setActiveTab('published')}
                    >
                        <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>
                            {Strings.adminSharedManager.tabs.published(sharedLibs.length)}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
                    <FontAwesome name={Strings.settings.icons.refresh as any} size={14} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <Card style={styles.tableCard}>
                <View variant="transparent" style={styles.tableHeader}>
                    <Text style={[styles.headerCol, { flex: 2.5 }]}>{Strings.adminSharedManager.table.info}</Text>
                    <Text style={[styles.headerCol, { flex: 1 }]}>{Strings.adminSharedManager.table.status}</Text>
                    {activeTab === 'published' && <Text style={[styles.headerCol, { flex: 0.8 }]}>{Strings.adminSharedManager.table.download}</Text>}
                    <Text style={[styles.headerCol, { flex: 1.2 }]}>{Strings.adminSharedManager.table.date}</Text>
                    <Text style={[styles.headerCol, { flex: 1.5, textAlign: 'right' }]}>{Strings.adminSharedManager.table.manage}</Text>
                </View>

                {activeTab === 'draft' ? (
                    draftLibs.length > 0 ? (
                        draftLibs.map((item) => <LibRow key={item.id} item={item} isDraft={true} />)
                    ) : (
                        <View variant="transparent" style={styles.emptyTable}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.adminSharedManager.alerts.emptyDraft}</Text>
                        </View>
                    )
                ) : (
                    sharedLibs.length > 0 ? (
                        sharedLibs.map((item) => <LibRow key={item.id} item={item} isDraft={false} />)
                    ) : (
                        <View variant="transparent" style={styles.emptyTable}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.adminSharedManager.alerts.emptyPublished}</Text>
                        </View>
                    )
                )}
            </Card>

            {/* Edit Modal */}
            <Modal visible={!!editingLib} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>{Strings.adminSharedManager.modal.editTitle}</Text>

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelTitle}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.title}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                        />

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelDesc}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editForm.description}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                            multiline
                        />

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelCategory}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    !editForm.category_id && { backgroundColor: colors.tint }
                                ]}
                                onPress={() => setEditForm(prev => ({ ...prev, category_id: null }))}
                            >
                                <Text style={[styles.categoryChipText, !editForm.category_id && { color: '#fff' }]}>{Strings.adminSharedManager.modal.none}</Text>
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
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{Strings.common.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdate}>
                                <Text style={styles.modalButtonText}>{Strings.common.save}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Draft 수정 Modal */}
            <Modal visible={!!editingDraft} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>{Strings.adminSharedManager.modal.draftEditTitle}</Text>

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelTitle}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editDraftForm.title}
                            onChangeText={(text) => setEditDraftForm(prev => ({ ...prev, title: text }))}
                            placeholder={Strings.adminSharedManager.modal.labelTitle}
                            placeholderTextColor={colors.textSecondary}
                        />

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelDesc}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editDraftForm.description}
                            onChangeText={(text) => setEditDraftForm(prev => ({ ...prev, description: text }))}
                            multiline
                            placeholder={Strings.adminSharedManager.modal.placeholderDescDraft}
                            placeholderTextColor={colors.textSecondary}
                        />

                        <Text style={styles.label}>{Strings.adminSharedManager.modal.labelCategory}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                            <TouchableOpacity
                                style={[styles.categoryChip, !editDraftForm.category_id && { backgroundColor: colors.tint }]}
                                onPress={() => setEditDraftForm(prev => ({ ...prev, category_id: null }))}
                            >
                                <Text style={[styles.categoryChipText, !editDraftForm.category_id && { color: '#fff' }]}>{Strings.adminSharedManager.modal.none}</Text>
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
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{Strings.common.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdateDraft}>
                                <Text style={styles.modalButtonText}>{Strings.common.save}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Direct Publish Modal */}
            <Modal visible={isDirectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, maxHeight: '90%' }]}>
                        <Text style={styles.modalTitle}>{Strings.adminSharedManager.modal.createTitle}</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>{Strings.adminSharedManager.modal.labelTitle}</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={directForm.title}
                                onChangeText={(text) => setDirectForm(prev => ({ ...prev, title: text }))}
                                placeholder={Strings.adminSharedManager.modal.placeholderTitle}
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>{Strings.adminSharedManager.modal.labelDesc}</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, height: 60 }]}
                                value={directForm.description}
                                onChangeText={(text) => setDirectForm(prev => ({ ...prev, description: text }))}
                                multiline
                                placeholder={Strings.adminSharedManager.modal.placeholderDesc}
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>{Strings.adminSharedManager.modal.labelCategory}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                                <TouchableOpacity
                                    style={[
                                        styles.categoryChip,
                                        !directForm.category_id && { backgroundColor: colors.tint }
                                    ]}
                                    onPress={() => setDirectForm(prev => ({ ...prev, category_id: null }))}
                                >
                                    <Text style={[styles.categoryChipText, !directForm.category_id && { color: '#fff' }]}>{Strings.adminSharedManager.modal.none}</Text>
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
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{Strings.common.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleCreateDraft}>
                                <Text style={styles.modalButtonText}>{Strings.adminSharedManager.status.draft}</Text>
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
