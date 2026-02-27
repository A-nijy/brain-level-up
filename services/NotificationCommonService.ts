import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemService } from './ItemService';
import { Item } from '@/types';
import { DeviceEventEmitter } from 'react-native';

export type NotificationRange = 'all' | 'specific' | 'learned' | 'confused';
export type NotificationFormat = 'both' | 'word_only' | 'meaning_only';
export type NotificationOrder = 'sequential' | 'random';

export interface NotificationSettings {
    enabled: boolean;
    libraryId: string | null;
    sectionId: string | null;
    range: NotificationRange;
    rangeStart?: number;
    rangeEnd?: number;
    format: NotificationFormat;
    order: NotificationOrder;
    interval: number; // 분 단위
}

export const COMMON_STORAGE_KEYS = {
    SETTINGS: '@push_notification_settings',
    SHOWN_IDS: '@push_notification_shown_ids',
    COMPLETION_SENT: '@push_completion_sent',
    LAST_INDEX: '@push_notification_last_index',
};

export const NotificationCommonService = {
    /**
     * 설정에 따른 아이템 필터링 및 정렬
     */
    async getTargetItems(settings: NotificationSettings): Promise<Item[]> {
        if (!settings.libraryId) return [];

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

        if (settings.order === 'random') {
            for (let i = remainingItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
            }
        } else {
            remainingItems.sort((a, b) => a.display_order - b.display_order);
        }

        return remainingItems;
    },

    /**
     * 노출된 아이템 ID 관리
     */
    async getShownIds(): Promise<string[]> {
        const json = await AsyncStorage.getItem(COMMON_STORAGE_KEYS.SHOWN_IDS);
        return json ? JSON.parse(json) : [];
    },

    async addShownId(id: string): Promise<void> {
        const ids = await this.getShownIds();
        if (!ids.includes(id)) {
            ids.push(id);
            await AsyncStorage.setItem(COMMON_STORAGE_KEYS.SHOWN_IDS, JSON.stringify(ids));
            DeviceEventEmitter.emit('push-progress-updated');
        }
    },

    /**
     * 학습 진행도 계산
     */
    async getProgress(settings: NotificationSettings): Promise<{ current: number; total: number } | null> {
        if (!settings.libraryId) return null;

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
            console.error('[NotificationCommon] Error getting progress:', error);
            return null;
        }
    },

    /**
     * 공통 상태 초기화
     */
    async resetProgress(): Promise<void> {
        await AsyncStorage.removeItem(COMMON_STORAGE_KEYS.SHOWN_IDS);
        await AsyncStorage.removeItem(COMMON_STORAGE_KEYS.COMPLETION_SENT);
        await AsyncStorage.removeItem(COMMON_STORAGE_KEYS.LAST_INDEX);
        DeviceEventEmitter.emit('push-progress-updated');
    },

    /**
     * 알림 메시지 포맷팅
     */
    formatMessage(item: Item, format: NotificationFormat): { title: string; body: string } {
        if (format === 'word_only') {
            return {
                title: `단어: ${item.question}`,
                body: '뜻을 맞춰보세요! (클릭하여 확인)',
            };
        } else if (format === 'meaning_only') {
            return {
                title: `뜻: ${item.answer}`,
                body: '단어를 머릿속으로 그려보세요!',
            };
        } else {
            return {
                title: item.question,
                body: `${item.answer}${item.memo ? ` (${item.memo})` : ''}`,
            };
        }
    }
};
