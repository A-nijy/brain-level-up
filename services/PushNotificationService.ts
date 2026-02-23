import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';
import { Item } from '@/types';

// 알림 설정 타입 정의
export interface PushNotificationSettings {
    enabled: boolean;
    libraryId: string | null;
    sectionId: string | null; // added
    range: 'all' | 'specific' | 'learned' | 'confused';
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
const SCHEDULED_LIST_KEY = '@push_notification_scheduled_list'; // 예약된 알림 목록 (도착 카운팅용)

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

// 중복 실행 방지 플래그
let isProcessing = false;

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
                    importance: Notifications.AndroidImportance.MAX, // 중요도 최상으로 변경
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // 잠금 화면 표시 허용
                    bypassDnd: true, // 방해금지 모드 우회 시도
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
            // 알림이 활성화되면 진행도 초기화 및 배지 알림 예약
            await this.resetProgress();
            await this.scheduleNotificationBatch(userId);
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

            // 실시간 UI 갱신 이벤트 발생 (설정 화면 스위치 오프)
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('push-progress-updated');
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

            // 실시간 완료 체크 (100% 도달 시 알림 종료)
            await this.getProgress();
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
        await AsyncStorage.removeItem(SCHEDULED_LIST_KEY);
        console.log('[PushNotificationService] Progress and scheduled list have been reset');
    },

    /**
     * 다음 알림 하나 예약 (릴레이 방식)
     */
    async scheduleNextNotification(userId?: string): Promise<void> {
        if (Platform.OS === 'web') return;
        if (isProcessing) {
            console.log('[PushNotificationService] Already processing. Skipping...');
            return;
        }

        try {
            isProcessing = true;
            console.log('[PushNotificationService] Starting relay scheduling...');

            // 1. 현재 예약된 알림 확인 (중복 예약 방지)
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const hasLearningNotification = scheduled.some(n => n.content.data?.type === 'learning');

            if (hasLearningNotification) {
                console.log('[PushNotificationService] A learning notification is already scheduled. Skipping relay.');
                return;
            }

            // 2. 설정 확인
            const settings = await this.getSettings();
            if (!settings || !settings.enabled || !settings.libraryId) {
                console.log('[PushNotificationService] Settings not configured or disabled');
                return;
            }

            // 3. 아이템 로드 및 필터링
            let allItems: Item[] = [];
            if (settings.sectionId && settings.sectionId !== 'all') {
                allItems = await ItemService.getItems(settings.sectionId);
            } else {
                allItems = await ItemService.getItemsByLibrary(settings.libraryId);
            }

            let filteredItems = allItems;
            if (settings.range === 'confused') {
                filteredItems = allItems.filter(item => item.study_status === 'confused');
            } else if (settings.range === 'learned') {
                filteredItems = allItems.filter(item => item.study_status === 'learned');
            } else if (settings.range === 'specific' && settings.rangeStart !== undefined && settings.rangeEnd !== undefined) {
                filteredItems = allItems.slice(settings.rangeStart, settings.rangeEnd + 1);
            }

            const shownIds = await this.getShownIds();
            const remainingItems = filteredItems.filter(item => !shownIds.includes(item.id));

            if (remainingItems.length === 0) {
                console.log('[PushNotificationService] No remaining items. Completion check...');
                await this.showCompletionNotification();
                return;
            }

            // 4. 다음 아이템 선택
            let nextItem: Item;
            if (settings.order === 'random') {
                const randomIndex = Math.floor(Math.random() * remainingItems.length);
                nextItem = remainingItems[randomIndex];
            } else {
                remainingItems.sort((a, b) => a.display_order - b.display_order);
                nextItem = remainingItems[0];
            }

            // 5. 발송 시간 계산 (Issue 2 해결: Drift 방지)
            // 마지막 예약 목록의 시간을 기준으로 하거나, 단순히 현재+간격으로 설정
            const now = new Date();
            const triggerDate = new Date(now.getTime() + settings.interval * 60 * 1000);

            // 6. 예약
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
                        scheduledAt: triggerDate.toISOString(),
                    },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
            });

            // 7. 예약된 목록(상태바 카운팅용) 업데이트
            try {
                const scheduledList = [{
                    id: nextItem.id,
                    triggerAt: triggerDate.toISOString()
                }];
                await AsyncStorage.setItem(SCHEDULED_LIST_KEY, JSON.stringify(scheduledList));
            } catch (err) {
                console.error('[PushNotificationService] Failed to save scheduled list:', err);
            }

            console.log(`[PushNotificationService] Relay: Next notification scheduled for ${nextItem.question} at ${triggerDate.toLocaleTimeString()}`);

        } catch (error) {
            console.error('[PushNotificationService] Error in relay scheduling:', error);
        } finally {
            isProcessing = false;
        }
    },

    /**
     * 구 버전 호환용 (이제 relay 방식을 사용하지만 이름 유지를 위해 래핑)
     */
    async scheduleNotificationBatch(userId?: string): Promise<void> {
        await this.scheduleNextNotification(userId);
    },

    /**
     * 모든 알림 취소
     */
    async cancelAllNotifications(): Promise<void> {
        if (Platform.OS === 'web') return;
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('[PushNotificationService] All notifications cancelled');
    },

    /**
     * 학습 진행도 조회
     */
    async getProgress(): Promise<{ current: number; total: number } | null> {
        const settings = await this.getSettings();
        if (!settings || !settings.libraryId) return null;

        try {
            let allItems: Item[] = [];
            if (settings.sectionId && settings.sectionId !== 'all') {
                allItems = await ItemService.getItems(settings.sectionId);
            } else {
                allItems = await ItemService.getItemsByLibrary(settings.libraryId);
            }

            let filteredItems = allItems;
            if (settings.range === 'confused') {
                filteredItems = allItems.filter(item => item.study_status === 'confused');
            } else if (settings.range === 'learned') {
                filteredItems = allItems.filter(item => item.study_status === 'learned');
            } else if (settings.range === 'specific' && settings.rangeStart !== undefined && settings.rangeEnd !== undefined) {
                filteredItems = allItems.slice(settings.rangeStart, settings.rangeEnd + 1);
            }
            const shownIds = await this.getShownIds();

            // 도착 카운팅 로직 보강: 예약된 목록 중 현재 시간이 지난 것들을 '표시됨'으로 간주
            let finalShownIds = [...shownIds];
            try {
                const scheduledJson = await AsyncStorage.getItem(SCHEDULED_LIST_KEY);
                if (scheduledJson) {
                    const scheduledList: { id: string, triggerAt: string }[] = JSON.parse(scheduledJson);
                    const now = new Date();
                    const passedItems = scheduledList
                        .filter(item => new Date(item.triggerAt) <= now)
                        .map(item => item.id);

                    // 기존 shownIds에 없는 것들 추가
                    passedItems.forEach(id => {
                        if (!finalShownIds.includes(id)) {
                            finalShownIds.push(id);
                        }
                    });

                    // (선택사항) 실제 shownIds 저장소에도 반영하여 영구화
                    if (passedItems.some(id => !shownIds.includes(id))) {
                        await AsyncStorage.setItem(SHOWN_IDS_KEY, JSON.stringify(finalShownIds));
                    }
                }
            } catch (err) {
                console.error('[PushNotificationService] Error checking scheduled list:', err);
            }

            const current = finalShownIds.filter(id => filteredItems.some(item => item.id === id)).length;
            const total = filteredItems.length;

            // 추가: 진행도가 100%이면 자동으로 완료 처리 (단, 이미 꺼져있는 경우는 제외)
            if (total > 0 && current >= total && settings.enabled) {
                console.log('[PushNotificationService] Progress reached 100% in getProgress. Triggering completion.');
                // 비동기로 실행하여 루프 방지
                setTimeout(() => this.showCompletionNotification(), 500);
            }

            return {
                current,
                total,
            };
        } catch (error) {
            console.error('[Notification] Error getting progress:', error);
            return null;
        }
    },
};
