import { supabase } from '@/lib/supabase';

export type AppEventType = 'app_open' | 'app_close' | 'ad_view' | 'error' | 'app_error' | 'study_complete' | 'screen_view' | 'heartbeat' | 'feature_usage' | 'library_mutation' | 'section_mutation' | 'item_mutation';

export const LogService = {
    /**
     * 앱 내 주요 이벤트를 기록합니다.
     */
    async logEvent(eventType: AppEventType, metadata: any = {}, userId?: string) {
        try {
            let finalUserId = userId;
            
            if (!finalUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                finalUserId = user?.id;
            }

            const { error } = await supabase
                .from('app_logs')
                .insert({
                    user_id: finalUserId || null,
                    event_type: eventType,
                    metadata: metadata
                });

            // app_open 이벤트인 경우 프로필의 최근 접속일도 갱신
            if (!error && eventType === 'app_open' && finalUserId) {
                await supabase
                    .from('profiles')
                    .update({ last_access_at: new Date().toISOString() })
                    .eq('id', finalUserId);
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
