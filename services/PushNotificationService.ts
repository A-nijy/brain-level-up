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
const SCHEDULED_LIST_KEY = '@push_notification_scheduled_list';
const COMPLETION_SENT_KEY = '@push_completion_sent';
const BUFFER_SIZE = 50;

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
        // 이미 완료 알림이 나갔는지 체크 (중복 가드)
        const sent = await AsyncStorage.getItem(COMPLETION_SENT_KEY);
        if (sent === 'true') {
            console.log('[PushNotificationService] Completion notification already sent. Skipping.');
            return;
        }

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

        // 완료 상태 저장
        await AsyncStorage.setItem(COMPLETION_SENT_KEY, 'true');

        if (settings) {
            console.log('[PushNotificationService] Disabling notifications as learning is complete');
            await this.saveSettings({ ...settings, enabled: false });

            // 실시간 UI 갱신 이벤트 발생
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
        await AsyncStorage.removeItem(COMPLETION_SENT_KEY);
        console.log('[PushNotificationService] All progress and scheduled states have been reset');
    },

    /**
     * 단순화된 50개 일괄 예약 (Clean & Fill 50)
     */
    async scheduleNextNotification(userId?: string): Promise<void> {
        if (Platform.OS === 'web') return;
        if (isProcessing) return;

        try {
            isProcessing = true;
            const settings = await this.getSettings();
            if (!settings || !settings.enabled || !settings.libraryId) return;

            // 1. 미래에 예약된 모든 알림 취소 (이미 온 알림에는 영향 없음)
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 2. 대상 아이템 로드 및 필터링
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
                await this.showCompletionNotification();
                return;
            }

            // 3. 예약 순서 결정
            let targetItems = [...remainingItems];
            if (settings.order === 'random') {
                for (let i = targetItems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [targetItems[i], targetItems[j]] = [targetItems[j], targetItems[i]];
                }
            } else {
                targetItems.sort((a, b) => a.display_order - b.display_order);
            }

            // 4. 최대 50개 일괄 예약
            const batchCount = Math.min(targetItems.length, BUFFER_SIZE);
            const now = Date.now();

            console.log(`[PushNotificationService] Clean & Fill 50: Scheduling ${batchCount} items...`);

            for (let i = 0; i < batchCount; i++) {
                const item = targetItems[i];
                const triggerDate = new Date(now + (i + 1) * settings.interval * 60 * 1000);

                await Notifications.scheduleNotificationAsync({
                    identifier: `word-${item.id}`, // 고유 ID로 알림창에 쌓이게 함
                    content: {
                        title: settings.format === 'meaning_only' ? '단어 퀴즈' : item.question,
                        body: settings.format === 'word_only' ? '뜻을 맞춰보세요!' : item.answer,
                        data: {
                            libraryId: settings.libraryId,
                            itemId: item.id,
                            type: 'learning',
                        },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate,
                    },
                });
            }

            // 마지막에 완료 알림 스케줄 (남은 단어가 50개 미만일 때만)
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
            console.error('[PushNotificationService] Simple schedule error:', error);
        } finally {
            isProcessing = false;
        }
    },

    /**
     * 실제 예약 실행 (공통 로직)
     * 고유 식별자 word-${id}를 사용하여 알림 사라짐 방지
     */
    async performSchedule(item: Item, date: Date, settings: PushNotificationSettings): Promise<void> {
        const identifier = `word-${item.id}`; // 고유 ID 사용 (UI에서 차례로 쌓이게 함)
        await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
                title: settings.format === 'meaning_only' ? '단어 퀴즈' : item.question,
                body: settings.format === 'word_only' ? '뜻을 맞춰보세요!' : item.answer,
                data: {
                    libraryId: settings.libraryId,
                    itemId: item.id,
                    type: 'learning',
                    scheduledAt: date.toISOString(),
                },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: date,
            },
        });
        console.log(`[PushNotificationService] Scheduled: ${item.question} at ${date.toLocaleTimeString()} (ID: ${identifier})`);
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
            const current = shownIds.filter(id => filteredItems.some(item => item.id === id)).length;
            const total = filteredItems.length;

            return { current, total };
        } catch (error) {
            console.error('[Notification] Error getting progress:', error);
            return null;
        }
    },
};
