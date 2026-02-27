import { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Library } from '@/types';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export const useLibraryActions = (
    libraries: Library[],
    reorderLibraries: (newLibs: Library[]) => Promise<void>,
    deleteLibrary: (id: string) => Promise<void>
) => {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [reorderMode, setReorderMode] = useState(false);
    const [selectedLibraryForMenu, setSelectedLibraryForMenu] = useState<Library | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newLibs = [...libraries];
        [newLibs[index - 1], newLibs[index]] = [newLibs[index], newLibs[index - 1]];
        await reorderLibraries(newLibs);
    };

    const handleMoveDown = async (index: number) => {
        if (index === libraries.length - 1) return;
        const newLibs = [...libraries];
        [newLibs[index + 1], newLibs[index]] = [newLibs[index], newLibs[index + 1]];
        await reorderLibraries(newLibs);
    };

    const handleEditLibrary = (libraryId: string, title: string) => {
        router.push({
            pathname: "/library/edit",
            params: { id: libraryId, title: title }
        });
    };

    const handleDeleteLibrary = async (libraryId: string) => {
        try {
            await deleteLibrary(libraryId);
            showAlert({ title: Strings.common.success, message: Strings.libraryForm.deleteSuccess });
        } catch (error: any) {
            console.error(error);
            showAlert({ title: Strings.common.error, message: `${Strings.common.delete} 실패: ${error.message}` });
        }
    };

    const showLibraryOptions = (library: Library, event: any) => {
        if (reorderMode) return;

        if (Platform.OS === 'web') {
            const { pageX, pageY } = event.nativeEvent;
            setMenuPosition({ x: pageX, y: pageY });
            setSelectedLibraryForMenu(library);
        } else {
            showAlert({
                title: library.title,
                message: '암기장 설정',
                buttons: [
                    { text: Strings.common.edit, onPress: () => handleEditLibrary(library.id, library.title) },
                    {
                        text: Strings.common.delete,
                        style: 'destructive',
                        onPress: () => {
                            showAlert({
                                title: Strings.common.deleteConfirmTitle,
                                message: Strings.common.deleteConfirmMsg,
                                buttons: [
                                    { text: Strings.common.cancel, style: 'cancel' },
                                    { text: Strings.common.delete, style: 'destructive', onPress: () => handleDeleteLibrary(library.id) }
                                ]
                            });
                        }
                    },
                    { text: Strings.common.cancel, style: 'cancel' },
                ]
            });
        }
    };

    return {
        reorderMode,
        setReorderMode,
        selectedLibraryForMenu,
        setSelectedLibraryForMenu,
        menuPosition,
        handleMoveUp,
        handleMoveDown,
        handleEditLibrary,
        handleDeleteLibrary,
        showLibraryOptions
    };
};
