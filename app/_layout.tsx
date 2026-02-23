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
import { View, ActivityIndicator, Platform, TouchableOpacity, DeviceEventEmitter } from 'react-native';
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

  // 푸시 알림 클릭 및 수신 핸들러
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 1. 알림 응답(클릭) 리스너 - 클릭 시에만 다음 알림 예약
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
      try {
        const data = response.notification.request.content.data;
        if (!data) return;

        console.log('[Layout] Notification response received:', data.type);

        // 학습 알림 클릭 시 처리
        if (data.itemId) {
          console.log('[Layout] Processing click for item:', data.itemId);
          await PushNotificationService.addShownId(data.itemId as string);

          // 완료 알림이 아니면 해당 단어장으로 이동
          if (data.type !== 'completion' && data.libraryId) {
            router.push(`/library/${data.libraryId as string}`);
          }
        }

        // 실시간 UI 갱신 이벤트 발생
        DeviceEventEmitter.emit('push-progress-updated');

        // [핵심] 클릭 시점에 다음 알림 예약 (릴레이)
        await PushNotificationService.scheduleNextNotification();
      } catch (err) {
        console.error('[Layout] Error handling notification response:', err);
      }
    });

    // 2. 알림 수신 리스너 - 수신 시에는 다음 예약을 하지 않음 (이미 PushNotificationService.addShownId에서 처리)
    const notificationSubscription = Notifications.addNotificationReceivedListener(async notification => {
      try {
        const data = notification.request.content.data;
        if (data?.itemId) {
          console.log('[Layout] Foreground notification arrived:', data.itemId);
          await PushNotificationService.addShownId(data.itemId as string);
          DeviceEventEmitter.emit('push-progress-updated');
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
