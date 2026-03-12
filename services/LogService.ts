import { supabase } from '@/lib/supabase';

export type AppEventType = 'app_open' | 'ad_view' | 'error' | 'study_complete' | 'screen_view' | 'heartbeat';

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

            // app_open 이벤트인 경우 프로필의 최근 접속일도 갱신
            if (!error && eventType === 'app_open' && user?.id) {
                await supabase
                    .from('profiles')
                    .update({ last_access_at: new Date().toISOString() })
                    .eq('id', user.id);
            }

            if (error) {
                // 로그 기록 자체가 실패했을 때의 에러는 무시하거나 콘솔에만 출력 (무한 루프 방지)
                console.warn('[LogService] Log insertion failed:', error);
            }
        } catch (e) {
            console.warn('[LogService] Unexpected error:', e);
        }
    }
};
