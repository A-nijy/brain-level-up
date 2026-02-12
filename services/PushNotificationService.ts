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
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    console.warn('Failed to set notification handler:', error);
}

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

            // Android 알림 채널 설정
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('word-learning', {
                    name: '단어 학습 알림',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.warn('Failed to request notification permissions:', error);
            // 에러 발생 시 권한 없다고 처리하여 앱 크래시 방지
            return false;
        }
    },

    /**
     * 설정 저장
     */
    async saveSettings(settings: PushNotificationSettings): Promise<void> {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        if (settings.enabled) {
            // 알림이 활성화되면 진행도 초기화 및 첫 알림 예약
            await this.resetProgress();
            await this.scheduleNextNotification();
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
     * 이미 표시된 단어 ID 추가
     */
    async addShownId(itemId: string): Promise<void> {
        const shownIdsJson = await AsyncStorage.getItem(SHOWN_IDS_KEY);
        const shownIds: string[] = shownIdsJson ? JSON.parse(shownIdsJson) : [];

        if (!shownIds.includes(itemId)) {
            shownIds.push(itemId);
            await AsyncStorage.setItem(SHOWN_IDS_KEY, JSON.stringify(shownIds));
        }
    },

    /**
     * 이미 표시된 단어 ID 목록 조회
     */
    async getShownIds(): Promise<string[]> {
        const shownIdsJson = await AsyncStorage.getItem(SHOWN_IDS_KEY);
        return shownIdsJson ? JSON.parse(shownIdsJson) : [];
    },

    /**
     * 학습 진행도 초기화
     */
    async resetProgress(): Promise<void> {
        await AsyncStorage.setItem(LAST_INDEX_KEY, '0');
        await AsyncStorage.setItem(SHOWN_IDS_KEY, JSON.stringify([]));
    },

    /**
     * 다음 알림 예약
     */
    async scheduleNextNotification(): Promise<void> {
        if (Platform.OS === 'web') return;

        const settings = await this.getSettings();
        if (!settings || !settings.enabled || !settings.libraryId) {
            console.log('[Notification] Settings not configured or disabled');
            return;
        }

        try {
            // 현재 사용자 ID 가져오기 (AuthContext에서)
            // 임시로 하드코딩, 실제로는 AuthContext에서 가져와야 함
            const userId = await AsyncStorage.getItem('@user_id');
            if (!userId) {
                console.log('[Notification] User not logged in');
                return;
            }

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

            // 모든 단어를 표시했으면 완료 알림 후 종료
            if (remainingItems.length === 0) {
                console.log('[Notification] All words completed!');

                // 완료 알림 표시
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: '🎉 학습 완료!',
                        body: '모든 단어를 학습했습니다. 수고하셨습니다!',
                        data: { type: 'completion' },
                    },
                    trigger: null, // 즉시 표시
                });

                // 설정 비활성화
                await this.saveSettings({ ...settings, enabled: false });
                return;
            }

            // 다음 단어 선택
            let nextItem;
            if (settings.order === 'random') {
                const randomIndex = Math.floor(Math.random() * remainingItems.length);
                nextItem = remainingItems[randomIndex];
            } else {
                nextItem = remainingItems[0]; // 순차적
            }

            // 알림 내용 구성 (question = 단어, answer = 뜻)
            let title = '';
            let body = '';

            switch (settings.format) {
                case 'both':
                    title = nextItem.question;
                    body = nextItem.answer;
                    break;
                case 'word_only':
                    title = nextItem.question;
                    body = '뜻을 떠올려보세요';
                    break;
                case 'meaning_only':
                    title = nextItem.answer;
                    body = '단어를 떠올려보세요';
                    break;
            }

            // 알림 예약
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        libraryId: settings.libraryId,
                        itemId: nextItem.id,
                        question: nextItem.question,
                        answer: nextItem.answer,
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: settings.interval * 60, // 분을 초로 변환
                    repeats: false,
                },
            });

            // 표시된 단어 ID 추가
            await this.addShownId(nextItem.id);

            const progress = filteredItems.length - remainingItems.length + 1;
            console.log(`[Notification] Scheduled next notification: ${title} (${progress}/${filteredItems.length})`);
        } catch (error) {
            console.error('[Notification] Error scheduling notification:', error);
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
