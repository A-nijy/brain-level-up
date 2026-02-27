import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
    NotificationCommonService,
    NotificationSettings,
    COMMON_STORAGE_KEYS
} from './NotificationCommonService';

export const WebPushService = {
    async isSupported(): Promise<boolean> {
        if (Platform.OS !== 'web') return false;
        return 'Notification' in window;
    },

    async requestPermission(): Promise<boolean> {
        if (!(await this.isSupported())) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    },

    async getSettings(): Promise<NotificationSettings | null> {
        if (Platform.OS !== 'web') return null;
        const json = await AsyncStorage.getItem(COMMON_STORAGE_KEYS.SETTINGS);
        return json ? JSON.parse(json) : null;
    },

    async saveSettings(settings: NotificationSettings): Promise<void> {
        if (Platform.OS !== 'web') return;

        // 설정 저장
        await AsyncStorage.setItem(COMMON_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

        console.log('[WebPush] Settings saved and synchronized.');

        // 인터벌 재설정
        this.handleWebPushInterval(settings);
    },

    _intervalId: null as any,

    async handleWebPushInterval(settings: NotificationSettings) {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        if (settings.enabled && settings.interval > 0) {
            console.log(`[WebPush] Interval set for ${settings.interval} minutes`);

            const triggerNotification = async () => {
                try {
                    // 1. 공통 서비스를 통해 대상 아이템 가져오기
                    const remainingItems = await NotificationCommonService.getTargetItems(settings);

                    // 모든 단어를 다 본 경우 처리
                    if (remainingItems.length === 0) {
                        console.log('[WebPush] All items shown. Disabling...');
                        this.showNotification('학습 완료!', '모든 단어를 확인했습니다. 알림 기능을 종료합니다.');

                        await this.saveSettings({ ...settings, enabled: false });
                        return;
                    }

                    // 2. 아이템 선택 (이미 getTargetItems에서 정렬/셔플됨)
                    const selectedItem = remainingItems[0];

                    // 3. 메시지 포맷팅
                    const { title, body } = NotificationCommonService.formatMessage(selectedItem, settings.format);

                    // 4. 알림 노출
                    this.showNotification(title, body);

                    // 5. 노출 기록 (공통 서비스 사용)
                    await NotificationCommonService.addShownId(selectedItem.id);

                } catch (err) {
                    console.error('[WebPush] Notification cycle error:', err);
                }
            };

            // 처음 즉시 실행
            triggerNotification();
            this._intervalId = setInterval(triggerNotification, settings.interval * 60 * 1000);
        }
    },

    async showNotification(title: string, body: string) {
        if (Platform.OS === 'web' && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, { body });
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (e) {
                console.error('[WebPush] Notification error:', e);
            }
        }
    }
};
