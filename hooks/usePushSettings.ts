import { useState, useEffect, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { PushNotificationService } from '@/services/PushNotificationService';
import { NotificationSettings } from '@/services/NotificationCommonService';
import { LibraryService } from '@/services/LibraryService';
import { Library, Section } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import notifee from '@notifee/react-native';

export function usePushSettings() {
    const { user, session } = useAuth();
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
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
                ranges: ['all'],
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

    const saveSettings = async (newSettings: NotificationSettings) => {
        try {
            await PushNotificationService.saveSettings(newSettings, session?.user?.id);

            // 데이터 무결성을 위해 최신 설정과 진행도를 다시 가져와서 상태에 확실히 반영
            const [updatedSettings, prog] = await Promise.all([
                PushNotificationService.getSettings(),
                PushNotificationService.getProgress()
            ]);

            if (updatedSettings) {
                setNotificationSettings(updatedSettings);
            }
            setProgress(prog);
        } catch (error: any) {
            console.error('[usePushSettings] Save error:', error);
            throw error;
        }
    };


    const requestPermissions = async () => {
        return await PushNotificationService.requestPermissions();
    };

    /**
     * (Android 전용) 배터리 최적화 확인 및 필요시 해제 설정창 유도
     */
    const checkAndRequestBatteryOptimization = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;
        
        // 에뮬레이터 환경에서는 인텐트 런쳐 등 일부 기능이 무시되거나 에러를 발생시킬 수 있음
        if (!Device.isDevice) {
            console.log('[BatteryOptimization] Simulator detected, skipping intent');
            return true;
        }

        try {
            // 실제 배터리 최적화 예외 상태를 실시간으로 확인 (Notifee 활용)
            const isBatteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
            
            if (!isBatteryOptimizationEnabled) {
                 // 이미 "제한 없음"으로 설정되어 최적화가 꺼져있는 상태
                 return true;
            }

            // 안드로이드 6.0(Marshmallow) 이상부터 Doze 모드 적용
            if (Platform.Version >= 23) {
                 await IntentLauncher.startActivityAsync(
                     IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
                 );
                 
                 // 설정 창을 띄웠으므로 일단 false를 반환하여 현재 플로우를 중지하게 안내함
                 // 사용자가 설정 화면에서 수동으로 최적화를 끄고 돌아와야만 다음 시도에서 완료됨
                 return false;
            }
            return true;
        } catch (error) {
            console.error('[BatteryOptimization] Exception:', error);
            // 에러가 났을 때(사용 불가능한 기기 등)는 흐름을 막지 않음
            return true;
        }
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
        checkAndRequestBatteryOptimization,
        refresh: loadData
    };
}
