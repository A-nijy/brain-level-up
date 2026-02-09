import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        }}>
            <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="users" options={{ title: 'User Management' }} />
            <Stack.Screen name="shared-manager" options={{ title: 'Shared Libraries' }} />
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
