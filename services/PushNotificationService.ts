import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';

// 알림 설정 타입 정의
export interface PushNotificationSettings {
    enabled: boolean;
    libraryId: string | null;
    range: 'all' | 'specific' | 'incorrect';
    rangeStart?: number;
    rangeEnd?: number;
    format: 'both' | 'word_only' | 'meaning_only';
    order: 'sequential' | 'random';
    interval: number; // 분 단위
}

// AsyncStorage 키
const SETTINGS_KEY = '@push_notification_settings';
const LAST_INDEX_KEY = '@push_notification_last_index';
const SHOWN_IDS_KEY = '@push_notification_shown_ids';

// 알림 핸들러 설정 (앱 포그라운드에서도 알림 표시)
try {
    console.log('[PushNotificationService] Setting notification handler...');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    console.log('[PushNotificationService] Notification handler set successfully');
} catch (error) {
    console.warn('[PushNotificationService] Failed to set notification handler:', error);
}

export const PushNotificationService = {
    /**
     * 알림 권한 요청
     */
    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            console.log('[PushNotificationService] Checking permissions...');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            console.log('[PushNotificationService] Existing status:', existingStatus);

            if (existingStatus !== 'granted') {
                console.log('[PushNotificationService] Requesting permissions...');
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('[PushNotificationService] New status:', status);
            }

            // Android 알림 채널 설정
            if (Platform.OS === 'android') {
                console.log('[PushNotificationService] Setting up Android channel...');
                await Notifications.setNotificationChannelAsync('word-learning', {
                    name: '단어 학습 알림',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
                console.log('[PushNotificationService] Android channel set up');
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.warn('[PushNotificationService] Failed to request notification permissions:', error);
            // 에러 발생 시 권한 없다고 처리하여 앱 크래시 방지
            return false;
        }
    },

    /**
     * 설정 저장
     */
    async saveSettings(settings: PushNotificationSettings, userId?: string): Promise<void> {
        console.log('[PushNotificationService] Saving settings:', JSON.stringify(settings));
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        if (settings.enabled) {
            // 알림이 활성화되면 진행도 초기화 및 첫 알림 예약
            await this.resetProgress();
            await this.scheduleNextNotification(userId);
        } else {
            // 알림이 비활성화되면 모든 알림 취소
            await this.cancelAllNotifications();
        }
    },

    /**
     * 설정 불러오기
     */
    async getSettings(): Promise<PushNotificationSettings | null> {
        const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
        return settingsJson ? JSON.parse(settingsJson) : null;
    },

    /**
     * 마지막 학습 위치 업데이트
     */
    async updateLastIndex(index: number): Promise<void> {
        await AsyncStorage.setItem(LAST_INDEX_KEY, index.toString());
    },

    /**
     * 마지막 학습 위치 조회
     */
    async getLastIndex(): Promise<number> {
        const index = await AsyncStorage.getItem(LAST_INDEX_KEY);
        return index ? parseInt(index, 10) : 0;
    },

    /**
     * 완료 알림 표시 및 설정 비활성화
     */
    async showCompletionNotification(): Promise<void> {
        console.log('[PushNotificationService] Showing completion notification...');
        const settings = await this.getSettings();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎉 학습 완료!',
                body: '선택한 단어장의 모든 단어를 학습했습니다. 수고하셨습니다!',
                data: { type: 'completion' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // 즉시 표시
        });

        if (settings) {
            console.log('[PushNotificationService] Disabling notifications as learning is complete');
            await this.saveSettings({ ...settings, enabled: false });
        }
    },

    /**
     * 표시된 단어 ID 추가
     */
    async addShownId(id: string): Promise<void> {
        const ids = await this.getShownIds();
        if (!ids.includes(id)) {
            ids.push(id);
            await AsyncStorage.setItem(SHOWN_IDS_KEY, JSON.stringify(ids));
        }
    },

    /**
     * 표시된 단어 ID 목록 조회
     */
    async getShownIds(): Promise<string[]> {
        const json = await AsyncStorage.getItem(SHOWN_IDS_KEY);
        return json ? JSON.parse(json) : [];
    },

    /**
     * 진행도 초기화
     */
    async resetProgress(): Promise<void> {
        await AsyncStorage.removeItem(SHOWN_IDS_KEY);
        console.log('[PushNotificationService] Progress has been reset');
    },

    /**
     * 다음 알림 예약
     */
    async scheduleNextNotification(userId?: string): Promise<void> {
        if (Platform.OS === 'web') return;

        const settings = await this.getSettings();
        if (!settings || !settings.enabled || !settings.libraryId) {
            console.log('[Notification] Settings not configured or disabled');
            return;
        }

        try {
            // 사용자 ID 확인 (인자로 받거나 저장소에서 조회)
            const currentUserId = userId || await AsyncStorage.getItem('@user_id');

            // 로그인을 강제하지 않음 (로컬 알림은 로그인 없이도 동작 가능해야 함. 단, 학습 기록 연동 등을 위해 필요할 수 있음)
            // 하지만 현재 로직에서는 userId가 없으면 리턴해버림.
            // 일단 로그만 찍고 진행하도록 수정하거나, userId가 필수라면 인자로 확실히 받아야 함.
            if (!currentUserId) {
                console.log('[PushNotificationService] Warning: User ID not provided, verification skipped');
                // return; // 로그인 체크를 일시적으로 해제하여 테스트
            }

            console.log('[PushNotificationService] Scheduling for user:', currentUserId || 'anonymous');

            // 단어장의 모든 아이템 가져오기
            const allItems = await ItemService.getItems(settings.libraryId);

            // 범위 필터링
            let filteredItems = allItems;
            if (settings.range === 'incorrect') {
                // success_count가 0이고 fail_count가 0보다 큰 항목 (오답)
                filteredItems = allItems.filter(item => item.fail_count > 0 && item.success_count === 0);
            } else if (settings.range === 'specific' && settings.rangeStart !== undefined && settings.rangeEnd !== undefined) {
                filteredItems = allItems.slice(settings.rangeStart, settings.rangeEnd + 1);
            }

            // 이미 표시된 단어 제외
            const shownIds = await this.getShownIds();
            const remainingItems = filteredItems.filter(item => !shownIds.includes(item.id));
            const availableItems = filteredItems.filter(item => !shownIds.includes(item.id));

            if (availableItems.length === 0) {
                console.log('[PushNotificationService] All items shown, showing completion notification');
                await this.showCompletionNotification();
                return;
            }

            // 다음 표시할 단어 선택
            let nextItem;
            if (settings.order === 'random') {
                const randomIndex = Math.floor(Math.random() * availableItems.length);
                nextItem = availableItems[randomIndex];
            } else {
                // 순차적: display_order 기준 정렬 후 첫 번째
                availableItems.sort((a, b) => a.display_order - b.display_order);
                nextItem = availableItems[0];
            }

            console.log('[PushNotificationService] Next item selected:', nextItem.question);

            // 알림 예약
            const triggerSeconds = settings.interval * 60;
            console.log('[PushNotificationService] Scheduling notification in', triggerSeconds, 'seconds');

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: settings.format === 'meaning_only' ? '단어 퀴즈' : nextItem.question,
                    body: settings.format === 'word_only' ? '뜻을 맞춰보세요!' :
                        settings.format === 'meaning_only' ? nextItem.answer : nextItem.answer,
                    data: {
                        libraryId: settings.libraryId,
                        itemId: nextItem.id,
                        question: nextItem.question,
                        answer: nextItem.answer,
                        type: 'learning',
                    },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: triggerSeconds > 0 ? triggerSeconds : 60, // 최소 60초
                    repeats: false,
                },
            });

            // 표시된 ID 저장
            await this.addShownId(nextItem.id);
            // 진행도 업데이트 (전체 아이템 수 대비 완료 수)
            // 완료 수 = 전체 - 남은 수
            // 남은 수 = availableItems.length - 1 (방금 예약한거)
            // 하지만 정확히는 shownIds.length + 1 이 완료된 수
            // progress.total = filteredItems.length
            // progress.current = shownIds.length + 1

            console.log('[PushNotificationService] Notification scheduled successfully');
        } catch (error) {
            console.error('[PushNotificationService] Error scheduling notification:', error);
        }
    },

    /**
     * 모든 알림 취소
     */
    async cancelAllNotifications(): Promise<void> {
        if (Platform.OS === 'web') return;
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('[Notification] All notifications cancelled');
    },

    /**
     * 학습 진행도 조회
     */
    async getProgress(): Promise<{ current: number; total: number } | null> {
        const settings = await this.getSettings();
        if (!settings || !settings.libraryId) return null;

        try {
            const allItems = await ItemService.getItems(settings.libraryId);
            let filteredItems = allItems;

            if (settings.range === 'incorrect') {
                filteredItems = allItems.filter(item => item.fail_count > 0 && item.success_count === 0);
            } else if (settings.range === 'specific' && settings.rangeStart !== undefined && settings.rangeEnd !== undefined) {
                filteredItems = allItems.slice(settings.rangeStart, settings.rangeEnd + 1);
            }
            const shownIds = await this.getShownIds();
            const current = shownIds.filter(id => filteredItems.some(item => item.id === id)).length;

            return {
                current,
                total: filteredItems.length,
            };
        } catch (error) {
            console.error('[Notification] Error getting progress:', error);
            return null;
        }
    },
};
