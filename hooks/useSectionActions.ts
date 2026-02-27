import { useState } from 'react';
import { Section, Library } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export const useSectionActions = (
    library: Library | null,
    sections: Section[],
    createSection: (title: string) => Promise<any>,
    updateSection: (id: string, updates: { title: string }) => Promise<void>,
    deleteSection: (id: string) => Promise<void>,
    reorderSections: (newSections: Section[]) => Promise<void>
) => {
    const { showAlert } = useAlert();
    const [sharing, setSharing] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);

    // Section Create Modal State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [creating, setCreating] = useState(false);

    // Section Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleShare = async () => {
        if (!library) return;

        showAlert({
            title: Strings.common.info,
            message: Strings.libraryDetail.alerts.shareConfirm,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.libraryDetail.share,
                    onPress: async () => {
                        setSharing(true);
                        try {
                            await SharedLibraryService.shareLibrary(
                                library.user_id,
                                library.id,
                                library.category_id || 'others',
                                []
                            );
                            showAlert({ title: Strings.common.success, message: Strings.libraryDetail.alerts.shareSuccess });
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: `${Strings.libraryDetail.alerts.shareFail}: ${error.message}` });
                        } finally {
                            setSharing(false);
                        }
                    }
                }
            ]
        });
    };

    const handleCreateSection = async () => {
        if (!newSectionTitle.trim()) {
            showAlert({ title: Strings.common.warning, message: Strings.libraryDetail.alerts.enterName });
            return;
        }

        setCreating(true);
        try {
            await createSection(newSectionTitle.trim());
            setNewSectionTitle('');
            setCreateModalVisible(false);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${Strings.libraryDetail.alerts.createFail}: ${error.message}` });
        } finally {
            setCreating(false);
        }
    };

    const handleEditSection = async () => {
        if (!editingSection || !editSectionTitle.trim()) {
            showAlert({ title: Strings.common.warning, message: Strings.libraryDetail.alerts.enterName });
            return;
        }

        setUpdating(true);
        try {
            await updateSection(editingSection.id, { title: editSectionTitle.trim() });
            setEditSectionTitle('');
            setEditingSection(null);
            setEditModalVisible(false);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${Strings.libraryDetail.alerts.editFail}: ${error.message}` });
        } finally {
            setUpdating(false);
        }
    };

    const openEditModal = (section: Section) => {
        setEditingSection(section);
        setEditSectionTitle(section.title);
        setEditModalVisible(true);
    };

    const handleDeleteSection = async (section: Section) => {
        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: Strings.libraryDetail.alerts.deleteConfirm(section.title),
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSection(section.id);
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: `${Strings.libraryDetail.alerts.deleteFail}: ${error.message}` });
                        }
                    }
                }
            ]
        });
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newSections = [...sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        await reorderSections(newSections);
    };

    const handleMoveDown = async (index: number) => {
        if (index === sections.length - 1) return;
        const newSections = [...sections];
        [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
        await reorderSections(newSections);
    };

    return {
        sharing,
        reorderMode,
        setReorderMode,
        createModalVisible,
        setCreateModalVisible,
        newSectionTitle,
        setNewSectionTitle,
        creating,
        editModalVisible,
        setEditModalVisible,
        editingSection,
        editSectionTitle,
        setEditSectionTitle,
        updating,
        handleShare,
        handleCreateSection,
        handleEditSection,
        openEditModal,
        handleDeleteSection,
        handleMoveUp,
        handleMoveDown
    };
};
