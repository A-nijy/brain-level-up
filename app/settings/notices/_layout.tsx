import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function NoticesLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
            }}
        >
            <Stack.Screen name="index" options={{ title: '공지사항' }} />
            <Stack.Screen name="[id]" options={{ title: '공지사항 상세' }} />
        </Stack>
    );
}
