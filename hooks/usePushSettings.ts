import { useState, useEffect, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { PushNotificationService, PushNotificationSettings } from '@/services/PushNotificationService';
import { LibraryService } from '@/services/LibraryService';
import { Library, Section } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function usePushSettings() {
    const { user, session } = useAuth();
    const [notificationSettings, setNotificationSettings] = useState<PushNotificationSettings | null>(null);
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [settings, libs, prog] = await Promise.all([
                PushNotificationService.getSettings(),
                LibraryService.getLibraries(user.id),
                PushNotificationService.getProgress()
            ]);

            setNotificationSettings(settings || {
                enabled: false,
                libraryId: null,
                sectionId: null,
                range: 'all',
                format: 'both',
                order: 'sequential',
                interval: 60,
            });
            setLibraries(libs);
            setProgress(prog);
        } catch (error) {
            console.error('[usePushSettings] Load error:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();

        // 실시간 진행도 업데이트 수신
        const subscription = DeviceEventEmitter.addListener('push-progress-updated', () => {
            console.log('[usePushSettings] Real-time progress update triggered');
            loadData(); // Call loadData directly as refresh is an alias for it
        });

        return () => {
            subscription.remove();
        };
    }, [loadData]); // Keep loadData in dependencies to re-subscribe if loadData changes (e.g., user changes)

    const fetchSections = useCallback(async (libId: string) => {
        setLoadingSections(true);
        try {
            const data = await LibraryService.getSections(libId);
            setSections(data);
            return data;
        } catch (error) {
            console.error('[usePushSettings] Fetch sections error:', error);
            return [];
        } finally {
            setLoadingSections(false);
        }
    }, []);

    const saveSettings = async (newSettings: PushNotificationSettings) => {
        try {
            await PushNotificationService.saveSettings(newSettings, session?.user?.id);
            setNotificationSettings(newSettings);
            const prog = await PushNotificationService.getProgress();
            setProgress(prog);
        } catch (error: any) {
            console.error('[usePushSettings] Save error:', error);
            throw error;
        }
    };


    const requestPermissions = async () => {
        return await PushNotificationService.requestPermissions();
    };

    return {
        notificationSettings,
        libraries,
        sections,
        loadingSections,
        progress,
        loading,
        fetchSections,
        saveSettings,
        requestPermissions,
        refresh: loadData
    };
}
