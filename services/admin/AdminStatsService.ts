import { supabase } from '@/lib/supabase';

export const AdminStatsService = {
    /**
     * 앱 전체 통계 조회
     */
    async getGlobalStats() {
        // 1. 총 사용자 수
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. 총 암기장 수
        const { count: libraryCount, error: libError } = await supabase
            .from('libraries')
            .select('*', { count: 'exact', head: true });

        // 3. 총 암기 항목(Item) 수
        const { count: itemCount, error: itemError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true });

        // 4. 공유 자료실 총 다운로드 수
        const { data: sharedData, error: sharedError } = await supabase
            .from('shared_libraries')
            .select('download_count');

        if (userError || libError || itemError || sharedError) {
            throw userError || libError || itemError || sharedError;
        }

        // 5. 최근 5명의 새 멤버(활동 로그 용)
        const { data: recentProfiles, error: recentError } = await supabase
            .from('profiles')
            .select('email, created_at, role')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;

        const totalDownloads = sharedData?.reduce((acc, curr) => acc + (curr.download_count || 0), 0) || 0;

        const activities = (recentProfiles || []).map(p => ({
            id: p.email,
            type: p.role === 'admin' ? 'admin_joined' : 'user_joined',
            message: `새로운 사용자가 가입했습니다: ${p.email || '익명'}`,
            created_at: p.created_at
        }));

        return {
            userCount: userCount || 0,
            libraryCount: libraryCount || 0,
            itemCount: itemCount || 0,
            totalDownloads,
            activities
        };
    },

    /**
     * 고도화된 관리자 지표 조회 (DAU, MAU, 수익, 에러 등)
     */
    async getAdvancedStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();

        // 1. DAU (오늘 접속한 고유 사용자 수)
        const { count: dau } = await supabase
            .from('app_logs')
            .select('user_id', { count: 'exact', head: true })
            .eq('event_type', 'app_open')
            .gte('created_at', today);

        // 2. MAU (최근 30일 접속한 고유 사용자 수)
        const { count: mau } = await supabase
            .from('app_logs')
            .select('user_id', { count: 'exact', head: true })
            .eq('event_type', 'app_open')
            .gte('created_at', thirtyDaysAgo);

        // 3. 신규 가입자 (오늘 vs 어제)
        const { count: newUsersToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        const { count: newUsersYesterday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // 4. 광고 수익 (이동 횟수 기반 시뮬레이션: 1회당 50원 가정)
        const { count: adViews } = await supabase
            .from('app_logs')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'ad_view')
            .gte('created_at', today);

        const estRevenue = (adViews || 0) * 50;

        // 5. 시스템 상태 (최근 24시간 에러 횟수)
        const { count: errorCount } = await supabase
            .from('app_logs')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'error')
            .gte('created_at', yesterday);

        // 6. 평균 학습 시간 (최근 7일 study_logs 기반)
        const { data: studyLogs } = await supabase
            .from('study_logs')
            .select('study_time_seconds')
            .gte('study_date', thirtyDaysAgo);

        const avgStudyTime = studyLogs && studyLogs.length > 0
            ? Math.floor(studyLogs.reduce((acc, curr) => acc + curr.study_time_seconds, 0) / studyLogs.length / 60)
            : 0;

        return {
            dau: dau || 0,
            mau: mau || 0,
            newUsersToday: newUsersToday || 0,
            newUsersYesterday: newUsersYesterday || 0,
            adViews: adViews || 0,
            estRevenue,
            errorCount: errorCount || 0,
            avgStudyTimeMinutes: avgStudyTime
        };
    },

    /**
     * 인기 카테고리/주제 분석
     */
    async getPopularTopics() {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('category_id, shared_library_categories(title), download_count')
            .order('download_count', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data;
    },

    /**
     * 시간대별 접속 분포 (최근 7일)
     */
    async getLogDistribution() {
        const { data, error } = await supabase
            .from('app_logs')
            .select('created_at')
            .eq('event_type', 'app_open')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 시간대별 카운트 (0-23시)
        const distribution = new Array(24).fill(0);
        data?.forEach(log => {
            const hour = new Date(log.created_at).getHours();
            distribution[hour]++;
        });

        return distribution;
    },

    /**
     * 깔때기(Funnel) 분석: 단어장 생성 -> 아이템 추가 -> 학습 기록
     */
    async getFunnelStats() {
        // 1. 최소 1개 이상의 단어장을 가진 사용자 수
        const { count: userWithLib } = await supabase
            .from('libraries')
            .select('user_id', { count: 'exact', head: true });

        // 2. 최소 1개 이상의 아이템을 가진 사용자 수
        const { data: libs } = await supabase.from('libraries').select('id');
        const libIds = libs?.map(l => l.id) || [];
        const { count: userWithItems } = await supabase
            .from('items')
            .select('library_id', { count: 'exact', head: true })
            .in('library_id', libIds);

        // 3. 최근 30일 내 학습 기록이 있는 사용자 수
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: userWithStudy } = await supabase
            .from('study_logs')
            .select('user_id', { count: 'exact', head: true })
            .gte('study_date', thirtyDaysAgo.toISOString());

        return {
            stage1: userWithLib || 0,
            stage2: userWithItems || 0,
            stage3: userWithStudy || 0
        };
    },

    /**
     * 시스템 에러 상세 내역 (최근 50건)
     */
    async getErrorDetails() {
        const { data, error } = await supabase
            .from('app_logs')
            .select(`
                id,
                created_at,
                metadata,
                profiles:user_id (email)
            `)
            .eq('event_type', 'error')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return (data as any[]).map(log => ({
            id: log.id,
            timestamp: log.created_at,
            user: log.profiles?.email || 'N/A',
            message: log.metadata?.message || 'Unknown Error',
            stack: log.metadata?.stack,
            path: log.metadata?.path
        }));
    },

    /**
     * 광고 시청 상세 내역 (수익 원천)
     */
    async getAdViewDetails() {
        const { data, error } = await supabase
            .from('app_logs')
            .select(`
                id,
                created_at,
                metadata,
                profiles:user_id (email)
            `)
            .eq('event_type', 'ad_view')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return (data as any[]).map(log => ({
            id: log.id,
            timestamp: log.created_at,
            user: log.profiles?.email || 'N/A',
            reward_type: log.metadata?.reward_type || 'General',
            placement: log.metadata?.placement || 'Unknown'
        }));
    },
};
