import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { LogService } from '@/services/LogService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 사용자의 앱/웹 사용 시간을 추적하기 위한 커스텀 훅입니다.
 * 앱이 활성 상태일 때 1분마다 'heartbeat' 로그를 전송합니다.
 */
export function useUsageTracking() {
    const { session } = useAuth();
    const intervalRef = useRef<any>(null);
    const appState = useRef(AppState.currentState);

    const sendHeartbeat = async () => {
        if (!session?.user) return;

        await LogService.logEvent('heartbeat', {
            platform: Platform.OS,
            isWeb: Platform.OS === 'web',
            userAgent: Platform.OS === 'web' ? window.navigator.userAgent : undefined,
        });
    };

    useEffect(() => {
        // 세션이 없으면 추적 중단
        if (!session?.user) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // 1. 초기 진입 시 실행
        sendHeartbeat();

        // 2. 1분마다 주기적으로 실행
        intervalRef.current = setInterval(() => {
            if (appState.current === 'active') {
                sendHeartbeat();
            }
        }, 60000); // 1분

        // 3. 앱 상태 변화 감지 (Native 전용)
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // 백그라운드에서 돌아왔을 때 즉시 한 번 기록
                sendHeartbeat();
            }
            appState.current = nextAppState;
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            subscription.remove();
        };
    }, [session?.user]);
}
