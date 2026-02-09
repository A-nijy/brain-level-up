import { Profile } from '../types';

export type FeatureType = 'DOWNLOAD_SHARED' | 'CREATE_LIBRARY' | 'WEB_ACCESS' | 'ADVANCED_STATS';

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
            if (profile?.membership_level === 'PREMIUM' || profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            return { status: 'REQUIRE_AD', message: 'Watch a short ad to download this library!' };
        }
    },
    CREATE_LIBRARY: {
        check: (profile, context) => {
            const currentCount = context?.currentCount || 0;
            if (profile?.membership_level === 'PREMIUM' || profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            if (currentCount >= 5) {
                return { status: 'LIMIT_REACHED', message: 'BASIC users are limited to 5 libraries.' };
            }
            return { status: 'GRANTED' };
        }
    },
    WEB_ACCESS: {
        check: (profile) => {
            if (profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            return { status: 'DENIED', message: 'Web access is exclusive to PRO members.' };
        }
    },
    ADVANCED_STATS: {
        check: (profile) => {
            if (profile?.membership_level === 'PRO') {
                return { status: 'GRANTED' };
            }
            return { status: 'DENIED', message: 'Advanced analytics are available for PRO members.' };
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
