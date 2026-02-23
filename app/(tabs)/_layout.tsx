import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { Strings } from '@/constants/Strings';

import { MembershipService } from '@/services/MembershipService';
import { NotificationService } from '@/services/NotificationService';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { profile, user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePress = async () => {
    if (!profile || !user) return;

    const { count, error } = await supabase
      .from('libraries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error checking library count:', error);
      return;
    }

    const access = MembershipService.checkAccess('CREATE_LIBRARY', profile, { currentCount: count || 0 });

    if (access.status === 'LIMIT_REACHED') {
      Alert.alert(
        Strings.membership.alerts.limitReachedTitle,
        access.message || Strings.membership.alerts.limitReachedMsg,
        [
          { text: Strings.common.cancel, style: 'cancel' },
          { text: Strings.membership.upgrade, onPress: () => router.push('/membership') }
        ]
      );
      return;
    }

    router.push('/library/create');
  };

  // 플랫폼과 안전 영역에 따른 하단 패딩 및 높이 계산
  const tabPaddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 30 : 10);
  const tabHeight = 54 + tabPaddingBottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: 10,
          display: Platform.OS === 'web' ? 'none' : 'flex',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: Platform.OS === 'web' ? false : useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text,
        },
        headerTintColor: colors.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: Strings.tabs.home,
          tabBarIcon: ({ color }) => <TabBarIcon name={Strings.tabs.icons.home as any} color={color} />,
          headerRight: () => (
            <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <Pressable onPress={() => router.push('/notifications')}>
                {({ pressed }) => (
                  <View variant="transparent" style={{ marginRight: 20, position: 'relative' }}>
                    <FontAwesome
                      name="bell-o"
                      size={20}
                      color={colors.text}
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                    {unreadCount > 0 && (
                      <View style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: colors.error,
                        borderRadius: 10,
                        minWidth: 16,
                        height: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 4
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>

              <Pressable onPress={handleCreatePress}>
                {({ pressed }) => (
                  <FontAwesome
                    name="plus"
                    size={22}
                    color={colors.text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: Strings.tabs.shared,
          tabBarIcon: ({ color }) => <TabBarIcon name={Strings.tabs.icons.shared as any} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: Strings.tabs.stats,
          tabBarIcon: ({ color }) => <TabBarIcon name={Strings.tabs.icons.stats as any} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: Strings.tabs.settings,
          tabBarIcon: ({ color }) => <TabBarIcon name={Strings.tabs.icons.settings as any} color={color} />,
        }}
      />
    </Tabs>
  );
}
