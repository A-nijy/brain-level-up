import React from 'react';
import { StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SharedLibrary } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useAdminSharedManager } from '@/hooks/useAdminSharedManager';
import { Strings } from '@/constants/Strings';

export default function OfficialManagement() {
    const {
        sharedLibs,
        draftLibs,
        categories,
        loading,
        activeTab,
        setActiveTab,
        isDirectModalVisible,
        setIsDirectModalVisible,
        directForm,
        setDirectForm,
        editingLib,
        setEditingLib,
        editForm,
        setEditForm,
        editingDraft,
        setEditingDraft,
        editDraftForm,
        setEditDraftForm,
        refresh,
        handleEditOpen,
        handleUpdateDraft,
        handlePublishDraft,
        handleDeleteDraft,
        handleUpdate,
        handleDeleteShared,
        handleUnpublishShared,
        handleMove,
        handleCreateDraft
    } = useAdminSharedManager();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const router = useRouter();

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
                {!isDraft && (
                    <>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, { backgroundColor: colors.border }]}
                            onPress={() => handleMove(item, 'up')}
                        >
                            <FontAwesome name="arrow-up" size={12} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, { backgroundColor: colors.border }]}
                            onPress={() => handleMove(item, 'down')}
                        >
                            <FontAwesome name="arrow-down" size={12} color={colors.text} />
                        </TouchableOpacity>
                    </>
                )}
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

    if (loading && !isDirectModalVisible && !editingLib && !editingDraft && draftLibs.length === 0 && sharedLibs.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View variant="transparent" style={styles.content}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 14,
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
    miniActionBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
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
