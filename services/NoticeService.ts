import { Notice } from '@/types';
import noticesDataRaw from '../assets/data/notices.json';

const noticesData = noticesDataRaw as Notice[];

/**
 * [Local-Only] 공지사항 관련 비즈니스 로직을 담당하는 서비스
 * assets/data/notices.json 파일을 소스로 사용하도록 리팩토링됨
 */
export const NoticeService = {
    /**
     * 공지사항 목록을 가져옵니다. (중요 공지 우선, 최신순)
     */
    async getNotices(): Promise<Notice[]> {
        return [...noticesData].sort((a, b) => {
            // 중요 공지 우선
            if (a.is_important !== b.is_important) {
                return a.is_important ? -1 : 1;
            }
            // 최신순
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    },

    /**
     * 특정 공지사항 상세 정보를 가져옵니다.
     */
    async getNoticeById(id: string): Promise<Notice | null> {
        return noticesData.find(n => n.id === id) || null;
    },

    /**
     * (관리자 전용) 로컬 버전에서는 지원하지 않거나 파일 직접 수정을 권장함
     */
    async createNotice(notice: Omit<Notice, 'id' | 'created_at' | 'updated_at'>): Promise<Notice> {
        throw new Error('로컬 버전에서는 파일(notices.json)을 직접 수정해야 합니다.');
    },

    async updateNotice(id: string, updates: Partial<Omit<Notice, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
        throw new Error('로컬 버전에서는 파일(notices.json)을 직접 수정해야 합니다.');
    },

    async deleteNotice(id: string): Promise<void> {
        throw new Error('로컬 버전에서는 파일(notices.json)을 직접 수정해야 합니다.');
    }
};
