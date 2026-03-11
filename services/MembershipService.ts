import { Profile } from '../types';

export type FeatureType = 'DOWNLOAD_SHARED' | 'CREATE_LIBRARY' | 'WEB_ACCESS' | 'ADVANCED_STATS' | 'EXPORT_PDF';

export type AccessStatus = 'GRANTED' | 'REQUIRE_AD' | 'LIMIT_REACHED' | 'DENIED';

interface AccessResult {
    status: AccessStatus;
    message?: string;
}

interface FeatureStrategy {
    check(profile: Profile | null, context?: any): AccessResult;
}

// 기능별 전략 정의
const strategies: Record<FeatureType, FeatureStrategy> = {
    DOWNLOAD_SHARED: {
        check: (profile) => {
            // 결제 기능 비활성화로 인해 모든 등급에서 광고 시청 유도 (추후 복구 가능하도록 로직 유지)
            if (profile?.membership_level === 'PREMIUM' || profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            return { status: 'REQUIRE_AD', message: '광고를 시청하시면 자료를 다운로드할 수 있습니다.' };
        }
    },
    CREATE_LIBRARY: {
        check: (profile, context) => {
            const currentCount = context?.currentCount || 0;
            if (profile?.membership_level === 'PREMIUM' || profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            if (currentCount >= 5) {
                return { status: 'REQUIRE_AD', message: '암기장이 5개를 초과했습니다. 광고를 시청하시면 하나 더 추가할 수 있습니다.' };
            }
            return { status: 'GRANTED' };
        }
    },
    WEB_ACCESS: {
        check: () => {
            // 웹 버전 한시적 전면 개방
            return { status: 'GRANTED' };
        }
    },
    ADVANCED_STATS: {
        check: () => {
            // 고급 통계 한시적 전면 개방
            return { status: 'GRANTED' };
        }
    },
    EXPORT_PDF: {
        check: (profile) => {
            if (profile?.membership_level === 'PREMIUM' || profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            return { status: 'REQUIRE_AD', message: '광고를 시청하시면 PDF로 내보낼 수 있습니다.' };
        }
    }
};

export const MembershipService = {
    /**
     * 특정 기능에 대한 접근 권한을 확인합니다.
     * @param feature 기능 이름
     * @param profile 사용자 프로필
     * @param context 추가 컨텍스트 (예: 현재 개수 등)
     */
    checkAccess(feature: FeatureType, profile: Profile | null, context?: any): AccessResult {
        const strategy = strategies[feature];
        if (!strategy) {
            return { status: 'GRANTED' }; // 정의되지 않은 기능은 기본적으로 허용
        }
        return strategy.check(profile, context);
    },

    /**
     * 보상형 광고 시청이 필요한 기능인지 확인합니다.
     */
    shouldShowAd(feature: FeatureType, profile: Profile | null): boolean {
        const result = this.checkAccess(feature, profile);
        return result.status === 'REQUIRE_AD';
    }
};
