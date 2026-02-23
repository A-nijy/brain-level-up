import { Stack } from 'expo-router';
import { Strings } from '@/constants/Strings';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function NoticesLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTintColor: colors.text,
            }}
        >
            <Stack.Screen name="index" options={{ title: Strings.notices.screenTitle }} />
            <Stack.Screen name="[id]" options={{ title: Strings.notices.detailTitle }} />
        </Stack>
    );
}
