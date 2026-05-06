import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Strings } from '@/constants/Strings';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useCallback, useState } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform, TouchableOpacity, DeviceEventEmitter, AppState } from 'react-native';
import { PushNotificationService } from '@/services/PushNotificationService';
import { NotificationCommonService } from '@/services/NotificationCommonService';

import { useColorScheme } from '@/components/useColorScheme';
import { AlertProvider } from '@/contexts/AlertContext';
import { HeaderProvider } from '@/contexts/HeaderContext';
import CustomAlert from '@/components/CustomAlert';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { LogService } from '@/services/LogService';
import { initDB } from '@/lib/db';
import { LoadingProvider } from '@/contexts/LoadingContext';

// DB 초기화 실행
initDB().catch(err => console.error('Failed to init DB:', err));

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

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
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === 'web';

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // 모든 플랫폼에서 사용 시간 추적 활성화
  useUsageTracking();

  // [Optimization] 레이아웃 구성을 메모이제이션하여 렌더링 가속
  const LayoutContent = useMemo(() => {
    const HeaderActions = require('@/components/HeaderActions').default;
    return (
      <Stack
        screenOptions={{
          headerShown: !isWeb,
          title: "뇌벨업",
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
                marginRight: 10,
              }}
            >
              <FontAwesome
                name="chevron-left"
                size={20}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
                style={{ transform: [{ translateY: Platform.OS === 'ios' ? 1 : 0 }] }}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <HeaderActions />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="library/create" options={{ headerTitle: Strings.libraryForm.createTitle }} />
        <Stack.Screen name="library/edit" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.libraryForm.editTitle
        })} />
        <Stack.Screen name="library/[id]" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || "암기장"
        })} />
        <Stack.Screen name="library/[id]/section/[sectionId]" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || "학습 섹션"
        })} />
        <Stack.Screen name="study/[id]" options={{ headerShown: !isWeb }} />
        <Stack.Screen name="library/[id]/section/[sectionId]/create-item" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.itemForm.createTitle
        })} />
        <Stack.Screen name="library/[id]/section/[sectionId]/edit-item" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.itemForm.editTitle
        })} />
        <Stack.Screen name="library/[id]/section/[sectionId]/import" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.librarySection.menu.importWords
        })} />
        <Stack.Screen name="shared/[id]" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.sharedDetail.screenTitle
        })} />
        <Stack.Screen name="shared/[id]/section/[sectionId]" options={({ route }) => ({
          headerTitle: (route.params as any)?.title || Strings.sharedDetail.screenTitle
        })} />
        <Stack.Screen name="notifications" options={{ headerTitle: Strings.notifications.screenTitle }} />
        <Stack.Screen name="statistics_detail" options={{ headerTitle: Strings.stats.detailTitle }} />
        <Stack.Screen name="webview" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    );
  }, [colorScheme, isWeb]);

  // 푸시 알림 및 상태 변화 핸들러
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        await PushNotificationService.syncDeliveredNotifications();
        const progress = await PushNotificationService.getProgress();
        if (progress && progress.total > 0 && progress.current >= progress.total) {
          const settings = await PushNotificationService.getSettings();
          if (settings && settings.enabled) {
            await PushNotificationService.saveSettings({ ...settings, enabled: false });
            await PushNotificationService.showCompletionNotification();
            return;
          }
        }
        await PushNotificationService.scheduleNextNotification();
      }
    };

    const initPushOnStartup = async () => {
      await PushNotificationService.syncDeliveredNotifications();
      await PushNotificationService.scheduleNextNotification();
    };

    initPushOnStartup();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data;
      if (data?.itemId) {
        await NotificationCommonService.addShownId(data.itemId as string);
        if (data.type !== 'completion' && data.libraryId) {
          router.push(`/library/${data.libraryId as string}`);
        }
      }
      DeviceEventEmitter.emit('push-progress-updated');
    });

    const notificationSubscription = Notifications.addNotificationReceivedListener(async notification => {
      const data = notification.request.content.data;
      if (data?.itemId) {
        await NotificationCommonService.addShownId(data.itemId as string);
        DeviceEventEmitter.emit('push-progress-updated');
      }
    });

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  useEffect(() => {
    if (!user && !isLoading && loaded) {
      // 로컬 모드 리다이렉트 가드
    }
  }, [user?.id, segments.join('/'), isLoading, loaded]);

  useEffect(() => {
    if (user?.id) {
      LogService.logEvent('app_open');
    }
  }, [user?.id]);

  // 웹 브라우저 탭 제목 고정
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const appName = "뇌벨업";
    document.title = appName;
    const observer = new MutationObserver(() => {
      if (document.title !== appName) document.title = appName;
    });
    const titleElement = document.querySelector('title');
    if (titleElement) observer.observe(titleElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // [Early Return] 모든 훅 선언 후에 위치해야 함
  if (!loaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const showWebLayout = isWeb && user && segments[0] !== 'auth';
  const CustomLightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, card: '#F8FAFC', background: '#F8FAFC' } };
  const CustomDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, card: '#0F172A', background: '#0F172A' } };

  if (showWebLayout) {
    const WebSidebar = require('@/components/WebSidebar').default;
    const WebHeader = require('@/components/WebHeader').default;

    return (
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }}>
          <WebSidebar />
          <View style={{ flex: 1 }}>
            <WebHeader />
            <View style={{ flex: 1, paddingRight: 24, paddingLeft: 8 }}>
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

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <HeaderProvider>
            <AlertProvider>
              <LoadingProvider>
                <AuthProvider>
                  <InitialLayout />
                  <CustomAlert />
                  <StatusBar style="auto" />
                </AuthProvider>
              </LoadingProvider>
            </AlertProvider>
          </HeaderProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
