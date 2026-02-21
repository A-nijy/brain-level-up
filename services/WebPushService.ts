import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

        // 알림 설정이 활성화되면 서비스 워커 등을 통해 크론잡을 돌리거나 
        // 최소한 로컬 interval을 설정해야 합니다 (간단 버전에서는 setInterval)
        this.handleWebPushInterval(settings);
    },

    // interval ID를 관리하기 위한 전역 변수 (실제로는 recoil이나 redux 등에서 관리하거나 service worker 사용)
    _intervalId: null as any,

    handleWebPushInterval(settings: WebPushSettings) {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        if (settings.enabled && settings.interval > 0) {
            console.log(`[WebPush] Interval set for ${settings.interval} minutes`);
            this._intervalId = setInterval(() => {
                this.showNotification('단어 학습 시간입니다!', '알림을 클릭하여 단어를 확인하세요.');
            }, settings.interval * 60 * 1000); // 분을 밀리초로 변환
        }
    },

    async showNotification(title: string, body: string) {
        if (Platform.OS === 'web' && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.png' });
        }
    }
};
