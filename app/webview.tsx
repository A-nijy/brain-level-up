import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Strings } from '@/constants/Strings';

export default function WebViewScreen() {
    const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    if (!url) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <Text>{Strings.webview.invalidUrl}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Text style={{ color: colors.tint }}>{Strings.common.close}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[styles.headerTitleContainer]}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title || Strings.webview.screenTitle}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome name="times" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={[styles.loading, { backgroundColor: colors.background }]}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                )}
                allowsBackForwardNavigationGestures={true}
                domStorageEnabled={true}
                javaScriptEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
    },
    webview: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
