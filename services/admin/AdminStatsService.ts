import { supabase } from '@/lib/supabase';

/**
 * [Refactored] 관리자 통계 기능을 담당하는 서비스
 * 너무 많은 책임을 가지고 있던 기존 구조를 영역별로 내부 객체로 분할하여 정리
 */

// 1. 일반 전역 통계
const GlobalStats = {
    async getStats() {
        const [
            { count: userCount, error: userError },
            { count: libraryCount, error: libError },
            { count: itemCount, error: itemError },
            { data: sharedData, error: sharedError }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('libraries').select('*', { count: 'exact', head: true }),
            supabase.from('items').select('*', { count: 'exact', head: true }),
            supabase.from('shared_libraries').select('download_count')
        ]);

        if (userError || libError || itemError || sharedError) {
            throw userError || libError || itemError || sharedError;
        }

        const { data: recentProfiles } = await supabase
            .from('profiles')
            .select('email, created_at, role')
            .order('created_at', { ascending: false })
            .limit(5);

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
    }
};

// 2. 사용자 활동 및 세그먼트 통계
const UserStats = {
    async getAdvancedStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();

        const [
            { count: dau },
            { count: mau },
            { count: newUsersToday },
            { count: newUsersYesterday },
            { count: adViews },
            { count: errorCount },
            { data: studyLogs }
        ] = await Promise.all([
            supabase.from('app_logs').select('user_id', { count: 'exact', head: true }).eq('event_type', 'app_open').gte('created_at', today),
            supabase.from('app_logs').select('user_id', { count: 'exact', head: true }).eq('event_type', 'app_open').gte('created_at', thirtyDaysAgo),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today),
            supabase.from('app_logs').select('*', { count: 'exact', head: true }).eq('event_type', 'ad_view').gte('created_at', today),
            supabase.from('app_logs').select('*', { count: 'exact', head: true }).eq('event_type', 'error').gte('created_at', yesterday),
            supabase.from('study_logs').select('study_time_seconds').gte('study_date', thirtyDaysAgo)
        ]);

        const estRevenue = (adViews || 0) * 50;
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

    async getUserUsageStats(userId: string) {
        // ... (기존 사용자 상세 통계 로직 유지)
        // 지면 관계상 핵심 로직은 병렬 처리 및 가독성 위주로 정리됨
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('event_type, metadata, created_at')
            .eq('user_id', userId)
            .eq('event_type', 'heartbeat')
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: true });

        if (error) throw error;

        let todayAppMinutes = 0;
        let todayWebMinutes = 0;
        const dailyStats: { [date: string]: { app: number, web: number } } = {};
        
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

            if (logDate.toISOString() >= today) {
                if (isWeb) todayWebMinutes += 1;
                else todayAppMinutes += 1;
            }
        });

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
    }
};

// 3. 시스템 로그 및 모니터링
const SystemStats = {
    async getErrorDetails() {
        const { data, error } = await supabase
            .from('app_logs')
            .select(`id, created_at, metadata, profiles:user_id (email)`)
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

    async pruneOldLogs(days: number) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - days);
        
        const { count, error } = await supabase
            .from('app_logs')
            .delete()
            .lt('created_at', targetDate.toISOString());

        if (error) throw error;
        return count;
    }
};

/**
 * 최종 통합 서비스 객체
 * 기존 인터페이스를 유지하면서 내부 로직을 책임별로 호출
 */
export const AdminStatsService = {
    // Global
    getGlobalStats: () => GlobalStats.getStats(),
    
    // User Engagement & Usage
    getAdvancedStats: () => UserStats.getAdvancedStats(),
    getLogDistribution: async () => {
        const { data, error } = await supabase.from('app_logs').select('created_at').eq('event_type', 'app_open').order('created_at', { ascending: false });
        if (error) throw error;
        const distribution = new Array(24).fill(0);
        data?.forEach(log => {
            const hour = new Date(log.created_at).getHours();
            distribution[hour]++;
        });
        return distribution;
    },
    getFunnelStats: async () => {
        const [
            { count: userWithLib },
            { data: libs },
            { count: userWithStudy }
        ] = await Promise.all([
            supabase.from('libraries').select('user_id', { count: 'exact', head: true }),
            supabase.from('libraries').select('id'),
            supabase.from('study_logs').select('user_id', { count: 'exact', head: true }).gte('study_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);
        const libIds = libs?.map(l => l.id) || [];
        const { count: userWithItems } = await supabase.from('items').select('library_id', { count: 'exact', head: true }).in('library_id', libIds);
        return { stage1: userWithLib || 0, stage2: userWithItems || 0, stage3: userWithStudy || 0 };
    },
    getUserUsageStats: (userId: string) => UserStats.getUserUsageStats(userId),
    getUserUsageTimeline: async (userId: string) => {
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
    getUserAdUsageStats: async (userId: string) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

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

        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyTrends[dateStr] = 0;
        }

        logs?.forEach(log => {
            const logDate = new Date(log.created_at);
            const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const placement = (log.metadata as any)?.placement || '일반 (Unknown)';

            if (logDate.toISOString() >= today) {
                todayCount++;
            }
            placementCounts[placement] = (placementCounts[placement] || 0) + 1;
            if (dailyTrends[dateStr] !== undefined) {
                dailyTrends[dateStr]++;
            }
        });

        const chartData = Object.keys(dailyTrends).sort().map(date => {
            const dateLogs = logs?.filter(log => {
                const ld = new Date(log.created_at);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}` === date;
            }) || [];

            const placements: { [key: string]: number } = {};
            dateLogs.forEach(log => {
                const p = (log.metadata as any)?.placement || 'UNKNOWN';
                placements[p] = (placements[p] || 0) + 1;
            });

            return { date, count: dailyTrends[date], placements };
        });

        const topPlacements = Object.entries(placementCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return { summary: { today: todayCount, total: totalCount }, chartData, topPlacements };
    },
    getUserFeatureUsageStats: async (userId: string) => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyTrends[dateStr] = 0;
        }

        logs?.forEach(log => {
            const logDate = new Date(log.created_at);
            const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const feature = (log.metadata as any)?.feature || 'UNKNOWN';

            if (dateStr === todayStr) todayCount++;
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
            if (dailyTrends[dateStr] !== undefined) dailyTrends[dateStr]++;
        });

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

            return { date, count: dailyTrends[date], features };
        });

        const topFeatures = Object.entries(featureCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return { summary: { today: todayCount, total: totalCount }, chartData, topFeatures };
    },
    getUserActivityTimeline: async (userId: string) => {
        const { data: logs, error } = await supabase
            .from('app_logs')
            .select('*')
            .eq('user_id', userId)
            .neq('event_type', 'heartbeat')
            .order('created_at', { ascending: false })
            .limit(300);

        if (error) throw error;

        const leftTimeline: any[] = [];
        const rightTimeline: any[] = [];
        let batchedItemAction: any = null;

        logs?.forEach((log) => {
            const eventType = log.event_type;
            const metadata = log.metadata || {};
            const createdAt = new Date(log.created_at);

            if (['library_mutation', 'section_mutation', 'item_mutation'].includes(eventType)) {
                if (eventType === 'item_mutation') {
                    if (batchedItemAction && 
                        batchedItemAction.action === metadata.action &&
                        (new Date(batchedItemAction.lastTime).getTime() - createdAt.getTime()) < 30 * 60 * 1000) {
                        
                        batchedItemAction.count += (metadata.count || 1);
                        batchedItemAction.lastTime = log.created_at;
                        return;
                    } else {
                        if (batchedItemAction) rightTimeline.push(AdminStatsService.formatTimelineItem(batchedItemAction));
                        batchedItemAction = { ...log, count: metadata.count || 1, lastTime: log.created_at, isBatched: true };
                    }
                } else {
                    if (batchedItemAction) {
                        rightTimeline.push(AdminStatsService.formatTimelineItem(batchedItemAction));
                        batchedItemAction = null;
                    }
                    rightTimeline.push(AdminStatsService.formatTimelineItem(log));
                }
            } else {
                if (batchedItemAction) {
                    rightTimeline.push(AdminStatsService.formatTimelineItem(batchedItemAction));
                    batchedItemAction = null;
                }
                leftTimeline.push(AdminStatsService.formatTimelineItem(log));
            }
        });

        if (batchedItemAction) rightTimeline.push(AdminStatsService.formatTimelineItem(batchedItemAction));
        return { left: leftTimeline, right: rightTimeline };
    },

    // System
    getErrorDetails: () => SystemStats.getErrorDetails(),
    pruneOldLogs: (days: number) => SystemStats.pruneOldLogs(days),

    // Content Insights
    async getPopularTopics() {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('category_id, shared_library_categories(title), download_count')
            .order('download_count', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data;
    },

    // Utils
    formatTimelineItem(log: any) {
        const metadata = log.metadata || {};
        const action = metadata.action;
        let icon = 'info-circle';
        let message = '';
        let color = '#64748b';

        switch (log.event_type) {
            case 'app_open': icon = 'sign-in'; message = '앱 접속'; color = '#10b981'; break;
            case 'app_close': icon = 'sign-out'; message = '앱 종료'; color = '#6b7280'; break;
            case 'ad_view': icon = 'play-circle'; message = `광고 시청 (${metadata.placement || '일반'})`; color = '#f59e0b'; break;
            case 'feature_usage':
                if (metadata.feature === 'EXPORT_PDF') { icon = 'file-pdf-o'; message = 'PDF 추출'; color = '#ef4444'; }
                else if (metadata.feature === 'DOWNLOAD_SHARED') { icon = 'cloud-download'; message = metadata.title ? `자료실 다운로드: ${metadata.title}` : '자료실 다운로드'; color = '#3b82f6'; }
                else if (metadata.feature === 'SHARE_LIBRARY') { icon = 'share-alt'; message = metadata.title ? `자료실 공유: ${metadata.title}` : '자료실 공유'; color = '#8b5cf6'; }
                else { icon = 'rocket'; message = `기능 사용: ${metadata.feature}`; }
                break;
            case 'library_mutation':
                icon = 'book'; color = '#3b82f6';
                if (action === 'create') message = `암기장 생성: ${metadata.title}`;
                else if (action === 'download') message = `암기장 다운로드: ${metadata.title}`;
                else if (action === 'update') message = `암기장 수정: ${metadata.title}`;
                else if (action === 'delete') message = '암기장 삭제';
                break;
            case 'section_mutation':
                icon = 'folder-open-o'; color = '#6366f1';
                if (action === 'create') message = `섹션 생성: ${metadata.title}`;
                else if (action === 'update') message = `섹션 수정: ${metadata.title}`;
                else if (action === 'delete') message = '섹션 삭제';
                break;
            case 'item_mutation':
                icon = 'pencil-square-o'; color = '#ec4899';
                const count = log.count || 1;
                const actStr = action === 'create' || action === 'create_bulk' ? '생성' : (action === 'update' ? '수정' : '삭제');
                message = count > 1 ? `문항 ${count}개 ${actStr}` : `문항 ${actStr}: ${metadata.question || ''}`;
                break;
            case 'error':
            case 'app_error':
                icon = 'exclamation-triangle';
                message = metadata.summary ? `${metadata.summary}: ${metadata.message || ''}` : '시스템 에러 발생';
                color = '#ef4444';
                break;
        }

        return { id: log.id, time: log.created_at, icon, message, color, eventType: log.event_type };
    },

    async deleteUserLogs(userId: string) {
        const { error } = await supabase.from('app_logs').delete().eq('user_id', userId);
        if (error) throw error;
    }
};
