import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Strings } from '@/constants/Strings';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform, TouchableOpacity, DeviceEventEmitter, AppState } from 'react-native';
import { PushNotificationService } from '@/services/PushNotificationService';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { LogService } from '@/services/LogService';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    card: '#F8FAFC',
    background: '#F8FAFC',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    card: '#0F172A',
    background: '#0F172A',
  },
};

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // 3. 앱 상태 변화(포그라운드 복귀) 및 초기 기동 시 버퍼 체크
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('[Layout] App became active. Checking progress and buffer...');

        // 1. 진행도 체크 및 완료 처리 (100% 도달 시 알림 비활성화)
        const progress = await PushNotificationService.getProgress();
        console.log('📊 [Layout] Current Progress:', progress);

        if (progress && progress.total > 0 && progress.current >= progress.total) {
          const settings = await PushNotificationService.getSettings();
          if (settings && settings.enabled) {
            console.warn('🎉 [Layout] 100% Reached! DISABLING NOTIFICATIONS NOW.');
            // 중복 루프 방지를 위해 saveSettings 호출 전 한 번 더 체크 (서비스 내부 가드도 동일하게 동작)
            await PushNotificationService.saveSettings({ ...settings, enabled: false });
            await PushNotificationService.showCompletionNotification();
            return; // 100% 상태면 예약 건너뜀
          }
        }

        // 2. 고정 슬롯 예약 갱신
        await PushNotificationService.scheduleNextNotification();
      }
    };

    // 초기 기동 시 실행
    PushNotificationService.scheduleNextNotification();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // 푸시 알림 클릭 및 수신 핸들러
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 1. 알림 응답(클릭) 리스너 - 클릭 시 버퍼 다시 채움
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
      try {
        const data = response.notification.request.content.data;
        if (!data) return;

        console.log('[Layout] Notification response received:', data.type);

        if (data.itemId) {
          await PushNotificationService.addShownId(data.itemId as string);

          if (data.type !== 'completion' && data.libraryId) {
            router.push(`/library/${data.libraryId as string}`);
          }
        }

        DeviceEventEmitter.emit('push-progress-updated');

        // 사용자 요청: 알림 클릭 시의 재예약 로직 완전 삭제 (중복 방지)
        // 예약은 오직 앱 활성화(active) 시점에만 일괄 처리함.
      } catch (err) {
        console.error('[Layout] Error handling notification response:', err);
      }
    });

    // 2. 알림 수신 리스너 - 수신 시에는 진행도 반영만 수행 (재예약 X)
    const notificationSubscription = Notifications.addNotificationReceivedListener(async notification => {
      try {
        const data = notification.request.content.data;
        if (data?.itemId) {
          console.log('[Layout] Foreground notification arrived:', data.itemId);
          await PushNotificationService.addShownId(data.itemId as string);
          DeviceEventEmitter.emit('push-progress-updated');

          // 알림이 올 때마다 전체를 재예약하면 성능 저하 및 알림 뭉침의 원인이 될 수 있으므로 제거함.
          // 대신 앱을 열거나 알림을 클릭할 때만 보충함.
        }
      } catch (err) {
        console.error('[Layout] Error handling foreground notification:', err);
      }
    });

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, [router]);

  // 웹 푸시 알림 전역 초기화
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initWebPush = async () => {
      try {
        console.log('[Layout] Checking for Web Push settings...');
        const { WebPushService } = require('@/services/WebPushService');
        // WebPushService가 사용하는 고유 키와 PushNotificationService 공용 키 모두 확인
        const WEB_SETTINGS_KEY = '@web_push_settings';
        const PUSH_SETTINGS_KEY = '@push_notification_settings';
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        let settings = null;
        const webJson = await AsyncStorage.getItem(WEB_SETTINGS_KEY);
        const pushJson = await AsyncStorage.getItem(PUSH_SETTINGS_KEY);

        console.log('[Layout] Web Settings raw:', webJson);
        console.log('[Layout] Push Settings raw:', pushJson);

        if (webJson) settings = JSON.parse(webJson);
        else if (pushJson) settings = JSON.parse(pushJson);

        if (settings && settings.enabled) {
          console.log('[Layout] Initializing Web Push with settings. Interval:', settings.interval);
          if (settings.interval > 0) {
            WebPushService.handleWebPushInterval(settings);
          } else {
            console.warn('[Layout] Web Push interval is 0, not starting');
          }
        } else {
          console.log('[Layout] Web Push is disabled or no settings found. Settings:', settings);
        }
      } catch (error) {
        console.error('[Layout] Failed to initialize Web Push:', error);
      }
    };

    // 약간의 지연을 주어 다른 초기화와 겹치지 않게 함
    const timer = setTimeout(initWebPush, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  useEffect(() => {
    if (isLoading || !loaded) return;

    const inAuthGroup = segments[0] === 'auth';

    console.log('[Layout] Navigation check:', { hasSession: !!session, inAuthGroup });

    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading, loaded]);

  if (!loaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';
  const showWebLayout = isWeb && session && segments[0] !== 'auth';

  const LayoutContent = (
    <Stack
      screenOptions={{
        headerShown: !isWeb, // 웹에서는 WebHeader가 있으므로 Stack 헤더를 숨깁니다.
        headerShadowVisible: false,
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerLeft: (props) => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginLeft: Platform.OS === 'web' ? 0 : 8,
              padding: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="chevron-left" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/notices" options={{ headerTitle: Strings.notices.screenTitle }} />
      <Stack.Screen name="settings/notices/index" options={{ headerTitle: Strings.notices.screenTitle }} />
      <Stack.Screen name="settings/notices/[id]" options={{ headerTitle: Strings.notices.screenTitle }} />
      <Stack.Screen name="statistics_detail" options={{ headerTitle: Strings.stats.detailTitle }} />
      <Stack.Screen name="webview" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );

  if (showWebLayout) {
    const WebSidebar = require('@/components/WebSidebar').default;
    const WebHeader = require('@/components/WebHeader').default;

    return (
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }}>
          <WebSidebar />
          <View style={{ flex: 1 }}>
            <WebHeader />
            <View style={{ flex: 1, paddingRight: Platform.OS === 'web' ? 24 : 0, paddingLeft: Platform.OS === 'web' ? 8 : 0 }}>
              {LayoutContent}
            </View>
          </View>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      {LayoutContent}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </AppThemeProvider>
  );
}
