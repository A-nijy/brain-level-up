import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AdminLayout() {
    const { profile, isLoading } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.replace('/(tabs)');
        }
    }, [isAdmin, isLoading]);

    if (isLoading) {
        return (
            <View style={[styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <Stack screenOptions={{
            headerShown: Platform.OS !== 'web',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        }}>
            <Stack.Screen name="index" options={{ title: '관리자 대시보드' }} />
            <Stack.Screen name="users" options={{ title: '사용자 관리' }} />
            <Stack.Screen name="shared-manager" options={{ title: '공유 단어장 관리' }} />
            <Stack.Screen name="notices" options={{ title: '공지사항 관리' }} />
            <Stack.Screen name="inquiries" options={{ title: '문의 및 건의사항' }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
