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
     * 알림 일괄 예약 (Batch Scheduling)
     */
    async scheduleNotificationBatch(userId?: string): Promise<void> {
        if (Platform.OS === 'web') return;

        console.log('[PushNotificationService] Starting batch scheduling...');

        // 1. 기존 예약 모두 취소
        await this.cancelAllNotifications();

        // 취소 후 잠시 대기 (안정성 확보)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. 설정 확인
        const settings = await this.getSettings();
        if (!settings || !settings.enabled || !settings.libraryId) {
            console.log('[PushNotificationService] Settings not configured or disabled');
            return;
        }

        const currentUserId = userId || await AsyncStorage.getItem('@user_id');
        if (!currentUserId) {
            console.log('[PushNotificationService] Warning: User ID not provided, continuing with anonymous scheduling');
        }

        try {
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

            // 배치 스케줄링 시에는 shownIds를 엄격하게 적용하지 않고, "이번 배치에서" 중복을 피하는 방식으로 진행 가능.
            // 하지만 영단어 암기 특성상 "안 본 단어" 우선이므로 shownIds를 체크함.
            const shownIds = await this.getShownIds();
            const availableItems = filteredItems.filter(item => !shownIds.includes(item.id));

            if (availableItems.length === 0) {
                console.log('[PushNotificationService] All items shown. Showing completion notification.');
                await this.showCompletionNotification();
                return;
            }

            // 4. 정렬/셔플
            let targetItems = [...availableItems];
            if (settings.order === 'random') {
                for (let i = targetItems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [targetItems[i], targetItems[j]] = [targetItems[j], targetItems[i]];
                }
            } else {
                targetItems.sort((a, b) => a.display_order - b.display_order);
            }

            // 5. 배치 예약 (최대 50개)
            const BATCH_SIZE = Math.min(targetItems.length, 50);
            console.log(`[PushNotificationService] Scheduling ${BATCH_SIZE} notifications. Interval: ${settings.interval} min`);

            const now = new Date();

            for (let i = 0; i < BATCH_SIZE; i++) {
                const item = targetItems[i];
                // 절대 시간 계산: (i+1) * interval 분 후
                const triggerDate = new Date(now.getTime() + settings.interval * 60 * 1000 * (i + 1));

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: settings.format === 'meaning_only' ? '단어 퀴즈' : item.question,
                        body: settings.format === 'word_only' ? '뜻을 맞춰보세요!' :
                            settings.format === 'meaning_only' ? item.answer : item.answer,
                        data: {
                            libraryId: settings.libraryId,
                            itemId: item.id,
                            question: item.question,
                            answer: item.answer,
                            type: 'learning',
                            orderIndex: i,
                            scheduledAt: triggerDate.toISOString(),
                        },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate, // Date 객체 직접 사용
                    },
                });
                console.log(`[PushNotificationService] Scheduled #${i + 1} at ${triggerDate.toLocaleTimeString()}`);
            }

            // 6. 예약된 목록 저장 (나중에 getProgress에서 도착 여부 판단용)
            try {
                const scheduledList = targetItems.slice(0, BATCH_SIZE).map((item, idx) => ({
                    id: item.id,
                    triggerAt: new Date(now.getTime() + settings.interval * 60 * 1000 * (idx + 1)).toISOString()
                }));
                await AsyncStorage.setItem(SCHEDULED_LIST_KEY, JSON.stringify(scheduledList));
            } catch (err) {
                console.error('[PushNotificationService] Failed to save scheduled list:', err);
            }

            console.log('[PushNotificationService] Batch scheduling completed.');

            // 예약 확인 로그 (상세 정보 출력)
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`[PushNotificationService] Total scheduled: ${scheduled.length}`);
            scheduled.forEach((n, idx) => {
                // 상위 5개만 로그 출력
                if (idx < 5) {
                    console.log(`[Check] #${idx + 1} ID: ${n.identifier}`);
                    console.log(`[Check] #${idx + 1} Trigger:`, JSON.stringify(n.trigger));
                }
            });

        } catch (error) {
            console.error('[PushNotificationService] Error in batch scheduling:', error);
        }
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
