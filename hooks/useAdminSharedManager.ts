import { useState } from 'react';
import { SharedLibrary } from '@/types';
import { useAdminShared } from './useAdminShared';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { supabase } from '@/lib/supabase';

export function useAdminSharedManager() {
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
        reorderSharedLibraries,
        createDraft
    } = useAdminShared();

    const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
    const [isDirectModalVisible, setIsDirectModalVisible] = useState(false);
    const [directForm, setDirectForm] = useState({
        title: '',
        description: '',
        category_id: null as string | null
    });

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

    const handleMove = async (item: SharedLibrary, direction: 'up' | 'down') => {
        const index = sharedLibs.findIndex(l => l.id === item.id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sharedLibs.length - 1) return;

        const newLibs = [...sharedLibs];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;

        [newLibs[index], newLibs[swapIdx]] = [newLibs[swapIdx], newLibs[index]];

        const updates = newLibs.map((lib, i) => ({
            id: lib.id,
            display_order: i
        }));

        try {
            await reorderSharedLibraries(updates);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: error.message });
        }
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

    return {
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
    };
}
