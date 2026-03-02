import { Platform } from 'react-native';

// 앱 환경일 때만 광고 라이브러리 임포트
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
    try {
        const adLib = require('react-native-google-mobile-ads');
        RewardedAd = adLib.RewardedAd;
        RewardedAdEventType = adLib.RewardedAdEventType;
        TestIds = adLib.TestIds;
    } catch (e) {
        console.warn('AdMob library not found or failed to load');
    }
}

// 보상형 광고 단위 ID (테스트용)
const REWARDED_AD_UNIT_ID = Platform.select({
    ios: TestIds?.REWARDED || 'ca-app-pub-3940256099942544/1712485313',
    android: TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917',
    default: 'ca-app-pub-3940256099942544/5224354917'
});

export const AdService = {
    /**
     * 보상형 광고를 보여주고 완료 시 콜백을 실행합니다.
     */
    async showRewardedAd(onComplete: () => void, showAlert: (params: any) => void): Promise<void> {
        if (Platform.OS === 'web') {
            // 웹에서는 여전히 테스트용 가상 로직 사용
            showAlert({
                title: '광고 시청 중 (웹 테스트)',
                message: '웹 버전에서는 현재 실제 광고 대신 테스트 모드로 작동합니다.',
                buttons: [
                    {
                        text: '광고 완료(테스트)',
                        onPress: () => {
                            onComplete();
                        }
                    },
                    {
                        text: '취소',
                        style: 'cancel'
                    }
                ]
            });
            return;
        }

        // 앱 환경에서의 실제 로직
        if (!RewardedAd) {
            showAlert({ title: '오류', message: '광고 모듈을 로드할 수 없습니다.' });
            return;
        }

        const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
            requestNonPersonalizedAdsOnly: true,
        });

        // 로딩 표시용 가짜 알림 (실제로는 로딩 UI를 따로 두는 것이 좋음)
        // 여기서는 간단하게 처리
        let adLoaded = false;

        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            adLoaded = true;
            rewarded.show();
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward: any) => {
                console.log('User earned reward of ', reward);
                onComplete();
            }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
            // 광고 닫힘 처리
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
        });

        // 광고 로드 시작
        rewarded.load();

        // 5초 동안 로드되지 않으면 타임아웃 처리 (간단 예시)
        setTimeout(() => {
            if (!adLoaded) {
                unsubscribeLoaded();
                unsubscribeEarned();
                unsubscribeClosed();
                showAlert({ title: '알림', message: '광고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' });
            }
        }, 8000);
    }
};
