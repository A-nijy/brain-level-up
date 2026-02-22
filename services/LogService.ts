import { supabase } from '@/lib/supabase';

export type AppEventType = 'app_open' | 'ad_view' | 'error' | 'study_complete' | 'screen_view';

export const LogService = {
    /**
     * 앱 내 주요 이벤트를 기록합니다.
     */
    async logEvent(eventType: AppEventType, metadata: any = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('app_logs')
                .insert({
                    user_id: user?.id || null,
                    event_type: eventType,
                    metadata: metadata
                });

            if (error) {
                // 로그 기록 자체가 실패했을 때의 에러는 무시하거나 콘솔에만 출력 (무한 루프 방지)
                console.warn('[LogService] Log insertion failed:', error);
            }
        } catch (e) {
            console.warn('[LogService] Unexpected error:', e);
        }
    }
};
