import { Profile } from '../types';

export type FeatureType = 'DOWNLOAD_SHARED' | 'CREATE_LIBRARY' | 'WEB_ACCESS' | 'ADVANCED_STATS' | 'EXPORT_PDF';
export type AccessStatus = 'GRANTED' | 'REQUIRE_AD' | 'LIMIT_REACHED' | 'DENIED';

interface AccessResult {
    status: AccessStatus;
    message?: string;
}

/**
 * [Local-Only] 멤버십 및 권한 관리 서비스
 * 로컬 버전에서는 모든 기능을 광고나 제한 없이 전면 개방함
 */
export const MembershipService = {
    /**
     * 특정 기능에 대한 접근 권한을 확인합니다.
     */
    checkAccess(feature: FeatureType, profile: Profile | null, context?: any): AccessResult {
        // 로컬 버전: 모든 기능을 항상 허용
        return { status: 'GRANTED' };
    },

    /**
     * 보상형 광고 시청이 필요한 기능인지 확인합니다.
     */
    shouldShowAd(feature: FeatureType, profile: Profile | null): boolean {
        // 로컬 버전: 광고가 필요 없음
        return false;
    }
};
