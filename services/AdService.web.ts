import { LogService } from './LogService';

/**
 * 웹 환경을 위한 광고 서비스 Mock 구현
 * 실제 광고 라이브러리를 임포트하지 않아 번들링 에러를 방지합니다.
 */
export const AdService = {
    /**
     * 웹에서는 실제 광고 대신 테스트용 팝업을 보여줍니다.
     */
    async showRewardedAd(
        onComplete: () => void,
        showAlert: (params: any) => void,
        onLoadingChange?: (loading: boolean) => void,
        placement: string = 'unknown'
    ): Promise<void> {
        showAlert({
            title: '광고 시청 중 (웹 테스트)',
            message: '웹 버전에서는 현재 실제 광고 대신 테스트 모드로 작동합니다.',
            buttons: [
                {
                    text: '광고 완료(테스트)',
                    onPress: () => {
                        // 광고 시청 성공 로그 기록 (웹 테스트)
                        LogService.logEvent('ad_view', { 
                            placement,
                            platform: 'web_test'
                        });
                        onComplete();
                    }
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        });
    }
};
