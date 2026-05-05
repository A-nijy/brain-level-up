import { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Library } from '@/types';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';
import { UserProfile } from '@/types';

/**
 * [Local-Only] 암기장 목록에서 사용하는 주요 액션 핸들러
 * 광고 및 서버 연동 로직이 제거됨
 */
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
        // 로컬 버전: 권한 확인 없이 즉시 생성 화면으로 이동
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
        handleEditLibrary,
        handleDeleteLibrary,
        handleCreateLibrary,
        showLibraryOptions,
    };
};
