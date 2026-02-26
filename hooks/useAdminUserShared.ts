import { useState, useCallback, useEffect } from 'react';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { AdminService } from '@/services/AdminService';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export function useAdminUserShared() {
    const [libs, setLibs] = useState<SharedLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { showAlert } = useAlert();

    const fetchUserLibs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await AdminService.getUserSharedLibraries();
            setLibs(data);
        } catch (error: any) {
            console.error('[useAdminUserShared] Fetch error:', error);
            showAlert({ title: Strings.common.error, message: error.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchUserLibs();
    }, [fetchUserLibs]);

    const handleToggleHide = async (id: string, currentHidden: boolean) => {
        const nextHidden = !currentHidden;
        const confirmTitle = nextHidden ? Strings.adminUserShared.alerts.hideConfirm : Strings.adminUserShared.alerts.showConfirm;

        showAlert({
            title: Strings.common.confirm,
            message: confirmTitle,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.confirm,
                    onPress: async () => {
                        try {
                            await AdminService.toggleSharedLibraryHidden(id, nextHidden);
                            setLibs(prev => prev.map(lib => lib.id === id ? { ...lib, is_hidden: nextHidden } : lib));
                            showAlert({
                                title: Strings.common.success,
                                message: nextHidden ? Strings.adminUserShared.alerts.hideSuccess : Strings.adminUserShared.alerts.showSuccess
                            });
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const handleDelete = async (id: string) => {
        showAlert({
            title: Strings.common.confirm,
            message: Strings.adminUserShared.alerts.delConfirm,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.adminUserShared.btns.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AdminService.deleteSharedLibrary(id);
                            setLibs(prev => prev.filter(lib => lib.id !== id));
                            showAlert({ title: Strings.common.success, message: Strings.adminUserShared.alerts.delSuccess });
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: error.message });
                        }
                    }
                }
            ]
        });
    };

    return {
        libs,
        loading,
        refreshing,
        refresh: () => fetchUserLibs(true),
        handleToggleHide,
        handleDelete
    };
}
