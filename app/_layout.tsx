import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform } from 'react-native';
import { PushNotificationService } from '@/services/PushNotificationService';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

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

  // 푸시 알림 클릭 핸들러
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // 완료 알림은 무시
      if (data?.type === 'completion') return;

      // 단어장으로 이동
      if (data?.libraryId) {
        router.push(`/library/${data.libraryId}`);
      }

      // 다음 알림 예약
      PushNotificationService.scheduleNotificationBatch();
    });

    return () => subscription.remove();
  }, [router]);

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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="webview" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );

  if (showWebLayout) {
    const WebSidebar = require('@/components/WebSidebar').default;
    const WebHeader = require('@/components/WebHeader').default;

    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
