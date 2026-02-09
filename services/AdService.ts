import { Alert } from 'react-native';

export const AdService = {
    /**
     * 보상형 광고를 보여주고 완료 시 콜백을 실행합니다.
     * 나중에 실제 SDK(AdMob 등)로 교체할 때 이 메서드 내부만 수정하면 됩니다.
     */
    async showRewardedAd(onComplete: () => void): Promise<void> {
        // 실제 SDK 연동 시 여기에 로드 및 노출 로직 작성
        // 예: const rewarded = await RewardedAd.load(...); await rewarded.show();

        Alert.alert(
            '광고 시청 중...',
            '보상형 광고를 끝까지 시청하시면 혜택이 지급됩니다.',
            [
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
        );
    }
};
