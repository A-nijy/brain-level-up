import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    NotificationCommonService,
    NotificationSettings,
    COMMON_STORAGE_KEYS
} from './NotificationCommonService';

// AsyncStorage 키 (공통 키 사용)
const SETTINGS_KEY = COMMON_STORAGE_KEYS.SETTINGS;
const SCHEDULED_LIST_KEY = '@push_notification_scheduled_list';
const BUFFER_SIZE = 50;

interface ScheduledNotification {
    id: string;          // 기기에 예약된 알림 고유 ID
    itemId: string;      // 해당 알림으로 발송될 단어 ID
    triggerTime: number; // 발송 예정 시간 (밀리초)
}

// 알림 핸들러 설정
try {
    if (Platform.OS !== 'web') {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: false,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }
} catch (error) {
    console.warn('[PushNotificationService] Handler Error:', error);
}

let isProcessing = false;

export const PushNotificationService = {
    /**
     * 알림 권한 요청
     */
    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('word-learning', {
                    name: '단어 학습 알림',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    bypassDnd: true,
                });
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.warn('[PushNotificationService] Permission Error:', error);
            return false;
        }
    },

    /**
     * 설정 저장 및 스케줄링
     */
    async saveSettings(settings: NotificationSettings, userId?: string): Promise<void> {
        const currentSettings = await this.getSettings();
        if (currentSettings && JSON.stringify(currentSettings) === JSON.stringify(settings)) {
            return;
        }

        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        if (settings.enabled) {
            await NotificationCommonService.resetProgress();
            await this.scheduleNextNotification(userId);
        } else {
            await this.cancelAllNotifications();
        }
    },

    /**
     * 설정 불러오기
     */
    async getSettings(): Promise<NotificationSettings | null> {
        const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
        return settingsJson ? JSON.parse(settingsJson) : null;
    },

    /**
     * 완료 알림 표시
     */
    async showCompletionNotification(): Promise<void> {
        const sent = await AsyncStorage.getItem(COMMON_STORAGE_KEYS.COMPLETION_SENT);
        if (sent === 'true') return;

        await Notifications.scheduleNotificationAsync({
            identifier: 'learning-completion',
            content: {
                title: '🎉 학습 완료!',
                body: '선택한 단어장의 모든 단어를 학습했습니다. 수고하셨습니다!',
                data: { type: 'completion' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
        });

        await AsyncStorage.setItem(COMMON_STORAGE_KEYS.COMPLETION_SENT, 'true');
    },

    /**
     * 진행도 초기화
     */
    async resetProgress(): Promise<void> {
        await NotificationCommonService.resetProgress();
        await AsyncStorage.removeItem(SCHEDULED_LIST_KEY);
    },

    /**
     * 누락된(이미 발송된) 알림 동기화 처리
     */
    async syncDeliveredNotifications(): Promise<void> {
        if (Platform.OS === 'web') return;

        try {
            const listJson = await AsyncStorage.getItem(SCHEDULED_LIST_KEY);
            if (!listJson) return;

            const scheduledList: ScheduledNotification[] = JSON.parse(listJson);
            const now = Date.now();
            
            // 💡 1. 예약된 시간이 1분(버퍼) 이상 지난 알림 필터링
            const pastNotifications = scheduledList.filter(item => item.triggerTime <= now);
            const futureNotifications = scheduledList.filter(item => item.triggerTime > now);

            if (pastNotifications.length > 0) {
                console.log(`[PushSync] 발견된 과거 알림 ${pastNotifications.length}건 동기화 진행...`);
                
                // 💡 2. 시간이 지난 단어들을 shownIds(진행도)에 추가
                for (const item of pastNotifications) {
                    await NotificationCommonService.addShownId(item.itemId);
                }

                // 💡 3. 이미 동기화 처리된 과거 내역을 스토리지에서 삭제
                if (futureNotifications.length > 0) {
                     await AsyncStorage.setItem(SCHEDULED_LIST_KEY, JSON.stringify(futureNotifications));
                } else {
                     await AsyncStorage.removeItem(SCHEDULED_LIST_KEY);
                }
                
                // 💡 4. 사용자 요청 1번 적용: 기존 예약된 알림 취소 (이후 다시 스케줄링 되므로 중복 방지)
                await Notifications.cancelAllScheduledNotificationsAsync();
                console.log('[PushSync] 기존 알림 취소 완료 및 동기화 처리 완료.');
                
                // 💡 5. 사용자 요청 3번 적용: 동기화 후 남은 단어가 없다면 완료 처리 연계
                const progress = await NotificationCommonService.getProgress(await this.getSettings() as NotificationSettings);
                if (progress && progress.total > 0 && progress.current >= progress.total) {
                     console.log('🎉 [PushSync] 동기화 중 모든 단어 학습 완료 확인. 완료 알림 트리거.');
                     const settings = await this.getSettings();
                     if (settings && settings.enabled) {
                         await this.saveSettings({ ...settings, enabled: false });
                         await this.showCompletionNotification();
                     }
                }
            }
        } catch (error) {
            console.error('[PushNotificationService] Sync Error:', error);
        }
    },

    /**
     * 50개 일괄 예약 로직
     */
    async scheduleNextNotification(userId?: string): Promise<void> {
        if (Platform.OS === 'web') return;
        if (isProcessing) return;

        try {
            isProcessing = true;
            const settings = await this.getSettings();
            if (!settings || !settings.enabled || !settings.libraryId) return;

            await Notifications.cancelAllScheduledNotificationsAsync();
            await new Promise(resolve => setTimeout(resolve, 300));

            const targetItems = await NotificationCommonService.getTargetItems(settings);

            if (targetItems.length === 0) {
                await this.showCompletionNotification();
                return;
            }

            const batchCount = Math.min(targetItems.length, BUFFER_SIZE);
            const now = Date.now();
            const newScheduleList: ScheduledNotification[] = [];

            for (let i = 0; i < batchCount; i++) {
                const item = targetItems[i];
                const triggerDate = new Date(now + (i + 1) * settings.interval * 60 * 1000);
                const { title, body } = NotificationCommonService.formatMessage(item, settings.format);

                await Notifications.scheduleNotificationAsync({
                    identifier: `reminder_${i}`,
                    content: {
                        title: settings.format === 'meaning_only' ? '단어 퀴즈' : title,
                        body: settings.format === 'word_only' ? '뜻을 맞춰보세요!' : body,
                        data: {
                            libraryId: settings.libraryId,
                            itemId: item.id,
                            type: 'learning',
                            slotIndex: i,
                        },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate,
                    },
                });

                newScheduleList.push({
                    id: `reminder_${i}`,
                    itemId: item.id,
                    triggerTime: triggerDate.getTime(),
                });
            }

            // 스케줄 리스트 스토리지에 저장 (동기화용)
            await AsyncStorage.setItem(SCHEDULED_LIST_KEY, JSON.stringify(newScheduleList));

            // 완료 알림 스케줄
            if (targetItems.length <= BUFFER_SIZE) {
                const completionTime = new Date(now + (targetItems.length + 1) * settings.interval * 60 * 1000);
                await Notifications.scheduleNotificationAsync({
                    identifier: 'learning-completion',
                    content: {
                        title: '🎉 학습 완료!',
                        body: '선택한 단어장의 모든 단어를 학습했습니다. 수고하셨습니다!',
                        data: { type: 'completion' },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: completionTime,
                    },
                });
            }
        } catch (error) {
            console.error('[PushNotificationService] Scheduling Error:', error);
        } finally {
            isProcessing = false;
        }
    },

    async cancelAllNotifications(): Promise<void> {
        if (Platform.OS === 'web') return;
        await Notifications.cancelAllScheduledNotificationsAsync();
    },

    /**
     * 학습 진행도 조회
     */
    async getProgress(): Promise<{ current: number; total: number } | null> {
        const settings = await this.getSettings();
        if (!settings) return null;
        return NotificationCommonService.getProgress(settings);
    },
};
