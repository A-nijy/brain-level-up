import { Platform } from 'react-native';
import * as AdMob from 'react-native-google-mobile-ads';

const { RewardedAd, RewardedAdEventType, AdEventType, TestIds } = AdMob;

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
    async showRewardedAd(onComplete: () => void, showAlert: (params: any) => void): Promise<void> {
        const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID as string, {
            requestNonPersonalizedAdsOnly: true,
        });

        let adLoaded = false;
        console.log('[AdService] Ad events mapping:', AD_EVENTS);

        const unsubscribeLoaded = rewarded.addAdEventListener(AD_EVENTS.LOADED, () => {
            console.log('[AdService] Ad Loaded');
            adLoaded = true;
            rewarded.show();
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            AD_EVENTS.EARNED_REWARD,
            (reward: any) => {
                console.log('[AdService] User earned reward:', reward);
                onComplete();
            }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(AD_EVENTS.CLOSED, () => {
            console.log('[AdService] Ad Closed');
            cleanup();
        });

        const unsubscribeError = rewarded.addAdEventListener(AD_EVENTS.ERROR, (error: any) => {
            console.error('[AdService] Ad Error:', error);
            cleanup();
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
                showAlert({ title: '알림', message: '광고 로딩 시간이 초과되었습니다. 다시 시도해주세요.' });
            }
        }, 10000);
    }
};
