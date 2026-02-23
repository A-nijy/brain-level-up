import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, DeviceEventEmitter } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ItemService } from '@/services/ItemService';
import { Item } from '@/types';

const WEB_PUSH_SETTINGS_KEY = '@web_push_settings';

export interface WebPushSettings {
    enabled: boolean;
    libraryId: string | null;
    sectionId: string | null;
    range: 'all' | 'specific' | 'learned' | 'confused';
    format: 'both' | 'word_only' | 'meaning_only';
    order: 'sequential' | 'random';
    interval: number; // 분
}

export const WebPushService = {
    async isSupported(): Promise<boolean> {
        if (Platform.OS !== 'web') return false;
        return 'Notification' in window;
    },

    async requestPermission(): Promise<boolean> {
        if (!(await this.isSupported())) return false;

        // 이미 허용된 상태라면
        if (Notification.permission === 'granted') return true;

        // 아직 물어보지 않았다면 권한 요청
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    async getSettings(): Promise<WebPushSettings | null> {
        if (Platform.OS !== 'web') return null;
        const json = await AsyncStorage.getItem(WEB_PUSH_SETTINGS_KEY);
        return json ? JSON.parse(json) : null;
    },

    async saveSettings(settings: WebPushSettings): Promise<void> {
        if (Platform.OS !== 'web') return;
        await AsyncStorage.setItem(WEB_PUSH_SETTINGS_KEY, JSON.stringify(settings));

        // 알림 설정이 업데이트되면 인터벌 재설정
        this.handleWebPushInterval(settings);
    },

    // interval ID 및 현재 순서 인덱스를 관리 (순차적 출력용)
    _intervalId: null as any,
    _currentIndex: 0,

    async handleWebPushInterval(settings: WebPushSettings) {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        if (settings.enabled && settings.interval > 0) {
            console.log(`[WebPush] Interval set for ${settings.interval} minutes`);

            // 첫 실행 시에도 바로 하나를 보여주거나, 인터벌 시작
            const triggerNotification = async () => {
                try {
                    // 1. 데이터 가져 오기
                    let items: Item[] = [];
                    if (settings.sectionId && settings.sectionId !== 'all') {
                        items = await ItemService.getItems(settings.sectionId);
                    } else if (settings.libraryId) {
                        items = await ItemService.getItemsByLibrary(settings.libraryId);
                    }

                    if (items.length === 0) return;

                    // 2. 필터링 (range)
                    if (settings.range === 'learned') {
                        items = items.filter(i => i.study_status === 'learned');
                    } else if (settings.range === 'confused') {
                        items = items.filter(i => i.study_status === 'confused');
                    }

                    if (items.length === 0) return;

                    // 3. 중복 방지 필터링 (이미 노출된 단어 제외)
                    const SHOWN_IDS_KEY = '@push_notification_shown_ids';
                    const shownIdsJson = await AsyncStorage.getItem(SHOWN_IDS_KEY);
                    const shownIds: string[] = shownIdsJson ? JSON.parse(shownIdsJson) : [];

                    const remainingItems = items.filter(i => !shownIds.includes(i.id));

                    // 모든 단어를 다 본 경우 처리
                    if (remainingItems.length === 0) {
                        console.log('[WebPush] All items have been shown. Notifying user.');
                        this.showNotification('학습 완료!', '모든 단어를 확인했습니다. 수고하셨습니다!');
                        // 원한다면 여기서 shownIds를 초기화하여 다시 시작하게 할 수도 있음
                        return;
                    }

                    // 4. 선택 (random / sequential)
                    let selectedItem: Item;
                    if (settings.order === 'random') {
                        selectedItem = remainingItems[Math.floor(Math.random() * remainingItems.length)];
                    } else {
                        // 순차적 출력 시 인덱스 관리 (전체 items 기준이 아닌 remainingItems 기준으로 하거나, 
                        // 전체 items에서 shownIds가 아닌 첫 번째를 가져오는 식)
                        selectedItem = remainingItems[0];
                    }

                    // 5. 포맷팅 및 노출
                    let title = '단어 학습 시간입니다!';
                    let body = '';

                    if (settings.format === 'word_only') {
                        title = `단어: ${selectedItem.question}`;
                        body = '뜻을 떠올려보세요! (클릭하여 확인)';
                    } else if (settings.format === 'meaning_only') {
                        title = `뜻: ${selectedItem.answer}`;
                        body = '단어를 머릿속으로 그려보세요!';
                    } else {
                        // both
                        title = `${selectedItem.question}`;
                        body = `${selectedItem.answer}${selectedItem.memo ? ` (${selectedItem.memo})` : ''}`;
                    }

                    // 6. 알림 노출
                    console.log(`[WebPush] Triggering notification for item: ${selectedItem.id}`);
                    this.showNotification(title, body);

                    // 7. 도착 시 카운팅 기록
                    try {
                        if (!shownIds.includes(selectedItem.id)) {
                            shownIds.push(selectedItem.id);
                            await AsyncStorage.setItem(SHOWN_IDS_KEY, JSON.stringify(shownIds));
                            console.log(`[WebPush] Item ${selectedItem.id} recorded successfully (Total: ${shownIds.length})`);

                            // 실시간 UI 갱신 이벤트 발생
                            DeviceEventEmitter.emit('push-progress-updated');
                        }
                    } catch (idErr) {
                        console.error('[WebPush] Error recording id (but notification shown):', idErr);
                    }
                } catch (err) {
                    console.error('[WebPush] Failed to fetch items for notification:', err);
                }
            };

            // 처음 즉시 실행 (테스트 및 빠른 피드백 위함)
            triggerNotification();

            this._intervalId = setInterval(triggerNotification, settings.interval * 60 * 1000);
        }
    },

    async showNotification(title: string, body: string) {
        if (Platform.OS === 'web') {
            const permission = Notification.permission;
            console.log(`[WebPush] Attempting to show notification. Permission: ${permission}`);

            if (permission === 'granted') {
                try {
                    // 아이콘 경로 에러 및 복잡한 옵션이 노출을 방해할 수 있으므로 최소화
                    const notification = new Notification(title, {
                        body,
                        // icon, tag, requireInteraction 제거하여 가장 기본적인 알림으로 전송
                    });

                    notification.onshow = () => {
                        console.log('[WebPush] Notification displayed successfully on screen');
                    };

                    notification.onerror = (err) => {
                        console.error('[WebPush] Browser failed to display notification:', err);
                    };

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                    console.log('[WebPush] Notification object created and event listeners attached');
                } catch (e) {
                    console.error('[WebPush] Failed to create Notification object:', e);
                }
            } else {
                console.warn('[WebPush] Cannot show notification: Permission is', permission);
            }
        }
    }
};
