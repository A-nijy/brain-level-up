import { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Library } from '@/types';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';
import { MembershipService } from '@/services/MembershipService';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const useLibraryActions = (
    libraries: Library[],
    reorderLibraries: (newLibs: Library[]) => Promise<void>,
    deleteLibrary: (id: string) => Promise<void>,
    profile: UserProfile | null,
    userId: string | undefined
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

    const handleCreateLibrary = async () => {
        if (!profile || !userId) return;

        const { count, error } = await supabase
            .from('libraries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error('Error checking library count:', error);
            return;
        }

        const access = MembershipService.checkAccess('CREATE_LIBRARY', profile, { currentCount: count || 0 });

        if (access.status === 'LIMIT_REACHED') {
            showAlert({
                title: Strings.membership.alerts.limitReachedTitle,
                message: access.message || Strings.membership.alerts.limitReachedMsg,
                buttons: [
                    { text: Strings.common.cancel, style: 'cancel' },
                    { text: Strings.membership.upgrade, onPress: () => router.push('/membership') }
                ]
            });
            return;
        }

        router.push('/library/create');
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
        handleCreateLibrary,
        showLibraryOptions
    };
};
