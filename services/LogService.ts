import { runCommand } from '../lib/db';

export type AppEventType = 'app_open' | 'app_close' | 'ad_view' | 'error' | 'app_error' | 'study_complete' | 'screen_view' | 'heartbeat' | 'feature_usage' | 'library_mutation' | 'section_mutation' | 'item_mutation';

/**
 * [Local-First] 앱 내 주요 이벤트를 로컬 SQLite에 기록하는 서비스
 */
export const LogService = {
    /**
     * 앱 내 주요 이벤트를 기록합니다.
     */
    async logEvent(eventType: AppEventType, metadata: any = {}, userId?: string) {
        try {
            const now = new Date().toISOString();
            
            await runCommand(
                'INSERT INTO app_logs (user_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?)',
                [userId || null, eventType, JSON.stringify(metadata), now]
            );

            // app_open 이벤트인 경우 프로필의 최근 접속일도 갱신
            if (eventType === 'app_open' && userId) {
                await runCommand(
                    'UPDATE profiles SET updated_at = ? WHERE id = ?',
                    [now, userId]
                );
            }
        } catch (e) {
            // 로그 기록 실패는 무시 (무한 루프 방지)
            console.warn('[LogService] Unexpected error:', e);
        }
    }
};
