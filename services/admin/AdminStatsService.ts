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
    /**
     * 특정 사용자의 상세 사용량 통계 조회 (오늘 및 최근 7일)
     */
    async getUserUsageStats(userId: string) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

        // 1. 전체 로그(heartbeat) 조회
        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('event_type, metadata, created_at')
            .eq('user_id', userId)
            .eq('event_type', 'heartbeat')
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // 2. 오늘 사용 시간 계산 (분 단위)
        let todayAppMinutes = 0;
        let todayWebMinutes = 0;
        
        // 3. 최근 7일 사용량 추이 데이터 생성
        const dailyStats: { [date: string]: { app: number, web: number } } = {};
        
        // 7일치 초기화 (로컬 날짜 기준)
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyStats[dateStr] = { app: 0, web: 0 };
        }

        logs?.forEach(log => {
            const logDate = new Date(log.created_at);
            const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const platform = (log.metadata as any)?.platform;
            const isWeb = (log.metadata as any)?.isWeb || platform === 'web';
            
            if (dailyStats[dateKey]) {
                if (isWeb) dailyStats[dateKey].web += 1;
                else dailyStats[dateKey].app += 1;
            }

            // 오늘 기록이면 별도 합산
            if (logDate.toISOString() >= today) {
                if (isWeb) todayWebMinutes += 1;
                else todayAppMinutes += 1;
            }
        });

        // 그래프용 배열 변환
        const chartData = Object.keys(dailyStats).sort().map(date => ({
            date,
            app: dailyStats[date].app,
            web: dailyStats[date].web,
            total: dailyStats[date].app + dailyStats[date].web
        }));

        return {
            today: {
                app: todayAppMinutes,
                web: todayWebMinutes,
                total: todayAppMinutes + todayWebMinutes
            },
            chartData
        };
    },

    /**
     * 특정 사용자의 오늘 시간대별 접속 타임라인 조회
     */
    async getUserUsageTimeline(userId: string) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('metadata, created_at')
            .eq('user_id', userId)
            .eq('event_type', 'heartbeat')
            .gte('created_at', today)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // 시간별(0-23시) 분포
        const hourlyDistribution = new Array(24).fill(0).map((_, i) => ({
            hour: i,
            minutes: 0,
            platforms: new Set<string>()
        }));

        logs?.forEach(log => {
            const date = new Date(log.created_at);
            const hour = date.getHours();
            const platform = (log.metadata as any)?.platform || 'unknown';
            
            hourlyDistribution[hour].minutes += 1;
            hourlyDistribution[hour].platforms.add(platform);
        });

        return hourlyDistribution.map(h => ({
            ...h,
            platforms: Array.from(h.platforms)
        }));
    },
    /**
     * 특정 사용자의 광고 사용량 통계 조회
     */
    async getUserAdUsageStats(userId: string) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();

        // 1. 전체 광고 로그 조회 (ad_view)
        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('metadata, created_at')
            .eq('user_id', userId)
            .eq('event_type', 'ad_view')
            .order('created_at', { ascending: true });

        if (error) throw error;

        let todayCount = 0;
        const totalCount = logs?.length || 0;
        const placementCounts: { [key: string]: number } = {};
        const dailyTrends: { [date: string]: number } = {};

        // 30일치 일자 초기화 (로컬 날짜 기준)
        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyTrends[dateStr] = 0;
        }

        logs?.forEach(log => {
            const logDate = new Date(log.created_at);
            const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const placement = (log.metadata as any)?.placement || '일반 (Unknown)';

            // 오늘 횟수
            if (logDate.toISOString() >= today) {
                todayCount++;
            }

            // 경로별 집계
            placementCounts[placement] = (placementCounts[placement] || 0) + 1;

            // 일별 추이 (최근 30일)
            if (dailyTrends[dateStr] !== undefined) {
                dailyTrends[dateStr]++;
            }
        });

        // 그래프용 데이터 변환
        const chartData = Object.keys(dailyTrends).sort().map(date => {
            const dateLogs = logs?.filter(log => {
                const logDate = new Date(log.created_at);
                return `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}` === date;
            }) || [];

            const placements: { [key: string]: number } = {};
            dateLogs.forEach(log => {
                const p = (log.metadata as any)?.placement || 'UNKNOWN';
                placements[p] = (placements[p] || 0) + 1;
            });

            return {
                date,
                count: dailyTrends[date],
                placements
            };
        });

        // 경로별 순위 변환
        const topPlacements = Object.entries(placementCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            summary: {
                today: todayCount,
                total: totalCount
            },
            chartData,
            topPlacements
        };
    },
    /**
     * 특정 사용자의 기능 사용량 통계 조회 (오늘, 누적, 7일 추이)
     */
    async getUserFeatureUsageStats(userId: string) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

        // 1. 전체 기능 사용 로그 조회 (feature_usage)
        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('metadata, created_at')
            .eq('user_id', userId)
            .eq('event_type', 'feature_usage')
            .order('created_at', { ascending: true });

        if (error) throw error;

        let todayCount = 0;
        const totalCount = logs?.length || 0;
        const featureCounts: { [key: string]: number } = {};
        const dailyTrends: { [date: string]: number } = {};

        // 7일치 일자 초기화
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyTrends[dateStr] = 0;
        }

        logs?.forEach(log => {
            const logDate = new Date(log.created_at);
            const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const feature = (log.metadata as any)?.feature || 'UNKNOWN';

            // 오늘 횟수
            if (dateStr === todayStr) {
                todayCount++;
            }

            // 기능별 집계
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;

            // 일별 추이 (최근 7일)
            if (dailyTrends[dateStr] !== undefined) {
                dailyTrends[dateStr]++;
            }
        });

        // 그래프용 데이터 변환
        const chartData = Object.keys(dailyTrends).sort().map(date => {
            const dateLogs = logs?.filter(log => {
                const ld = new Date(log.created_at);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}` === date;
            }) || [];

            const features: { [key: string]: number } = {};
            dateLogs.forEach(log => {
                const f = (log.metadata as any)?.feature || 'UNKNOWN';
                features[f] = (features[f] || 0) + 1;
            });

            return {
                date,
                count: dailyTrends[date],
                features
            };
        });

        // 기능별 순위 변환
        const topFeatures = Object.entries(featureCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            summary: {
                today: todayCount,
                total: totalCount
            },
            chartData,
            topFeatures
        };
    },
};
