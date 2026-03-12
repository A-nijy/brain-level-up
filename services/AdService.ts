import * as AdMob from 'react-native-google-mobile-ads';
import { LogService } from './LogService';

const { RewardedAd, RewardedAdEventType, AdEventType } = AdMob;

/**
 * AdMob v16.x 기준 공식 이벤트 타입 문자열
 * RewardedAd는 RewardedAdEventType과 AdEventType을 혼용합니다.
 */
const AD_EVENTS = {
    // RewardedAd 전용 이벤트 (prefix가 붙음)
    LOADED: RewardedAdEventType.LOADED,
    EARNED_REWARD: RewardedAdEventType.EARNED_REWARD,

    // MobileAd 공통 이벤트 (prefix가 없음)
    CLOSED: AdEventType.CLOSED,
    ERROR: AdEventType.ERROR
};

// 보상형 광고 단위 ID (환경 변수에서 직접 가져옴)
const REWARDED_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID;

export const AdService = {
    /**
     * 보상형 광고를 보여주고 완료 시 콜백을 실행합니다.
     * (이 파일은 네이티브 환경에서만 사용됩니다.)
     */
    async showRewardedAd(
        onComplete: () => void,
        showAlert: (params: any) => void,
        onLoadingChange?: (loading: boolean) => void,
        placement: string = 'unknown'
    ): Promise<void> {
        const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID as string, {
            requestNonPersonalizedAdsOnly: true,
        });

        let isEarned = false;
        let adLoaded = false;

        // 로딩 시작 알림
        onLoadingChange?.(true);

        const unsubscribeLoaded = rewarded.addAdEventListener(AD_EVENTS.LOADED, () => {
            console.log('[AdService] Ad Loaded');
            adLoaded = true;
            // 광고 로드 완료 시 로딩 중단 (광고가 화면을 덮음)
            onLoadingChange?.(false);
            rewarded.show();
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            AD_EVENTS.EARNED_REWARD,
            (reward: any) => {
                console.log('[AdService] User earned reward:', reward);
                isEarned = true;
                
                // 광고 시청 성공 로그 기록
                LogService.logEvent('ad_view', { 
                    placement,
                    reward_type: reward.type,
                    reward_amount: reward.amount
                });
            }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(AD_EVENTS.CLOSED, () => {
            console.log('[AdService] Ad Closed');
            cleanup();
            if (isEarned) {
                // 보상을 획득한 경우, 별도의 지연 없이 즉시 완료 콜백 호출
                // (이미 화면단에서 통합 로딩 상태가 유지되고 있음)
                onComplete();
            } else {
                onLoadingChange?.(false);
            }
        });

        const unsubscribeError = rewarded.addAdEventListener(AD_EVENTS.ERROR, (error: any) => {
            console.error('[AdService] Ad Error:', error);
            cleanup();
            onLoadingChange?.(false);
            showAlert({ title: '알림', message: '광고를 불러올 수 없습니다.' });
        });

        function cleanup() {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();
        }

        // 광고 로드 시작
        rewarded.load();

        // 10초 동안 로드되지 않으면 타임아웃 처리
        setTimeout(() => {
            if (!adLoaded) {
                cleanup();
                onLoadingChange?.(false);
                showAlert({ title: '알림', message: '광고 로딩 시간이 초과되었습니다. 다시 시도해주세요.' });
            }
        }, 10000);
    }
};
