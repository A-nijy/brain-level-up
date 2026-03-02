import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, useWindowDimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function LoginScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const { showAlert } = useAlert();

    const isWeb = Platform.OS === 'web' && width > 768;

    const extractSessionFromUrl = async (url: string) => {
        try {
            let paramsStr = '';
            if (url.includes('#')) {
                paramsStr = url.substring(url.indexOf('#') + 1);
            } else if (url.includes('?')) {
                paramsStr = url.substring(url.indexOf('?') + 1);
            }

            if (!paramsStr) {
                showAlert({ title: Strings.common.error, message: Strings.auth.errorNoParams + '\nURL: ' + url.substring(0, 100) });
                return false;
            }

            const params: Record<string, string> = {};
            paramsStr.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    params[key] = decodeURIComponent(value);
                }
            });

            const accessToken = params['access_token'];
            const refreshToken = params['refresh_token'];
            const errorDesc = params['error_description'];

            if (errorDesc) {
                showAlert({ title: Strings.auth.errorGoogleTitle, message: errorDesc.replace(/\+/g, ' ') });
                return false;
            }

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (error) throw error;
                return true;
            }

            showAlert({ title: Strings.common.error, message: Strings.auth.errorNoToken + '\n파라미터: ' + JSON.stringify(params) });
            return false;
        } catch (e) {
            console.error('Session parsing error:', e);
            showAlert({ title: Strings.common.error, message: String(e) });
            return false;
        }
    };

    const onSignInWithGoogle = async () => {
        setIsLoading(true);
        try {
            let redirectUri;
            if (Platform.OS === 'web') {
                redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined;
            } else {
                redirectUri = makeRedirectUri({
                    scheme: 'memapp',
                    path: 'auth/callback',
                });
            }

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                    queryParams: {
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('No auth URL returned from Supabase');

            if (Platform.OS === 'web') {
                window.location.href = data.url;
            } else {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
                if (result.type === 'success' && result.url) {
                    const success = await extractSessionFromUrl(result.url);
                    if (!success) {
                        showAlert({ title: Strings.common.info, message: Strings.auth.errorSession });
                    }
                }
            }
        } catch (error: any) {
            showAlert({ title: Strings.auth.errorLoginTitle, message: error.message });
        } finally {
            if (Platform.OS !== 'web') {
                setIsLoading(false);
            }
        }
    };

    const onSignInWithApple = async () => {
        showAlert({ title: Strings.common.info, message: Strings.auth.appleComingSoon });
    };

    const onDevLogin = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) showAlert({ title: Strings.common.error, message: error.message });
        setIsLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.contentWrapper, isWeb && { maxWidth: 500, alignSelf: 'center', width: '100%' }]}>
                <View style={styles.header}>
                    <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>{Strings.auth.appName}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {Strings.auth.welcomeMsg}
                        </Text>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.content}>
                    <TouchableOpacity
                        style={[styles.button, styles.googleButton, { borderColor: colors.border }]}
                        onPress={onSignInWithGoogle}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <FontAwesome name={Strings.auth.icons.google as any} size={20} color="#EA4335" style={{ marginRight: 12 }} />
                        <Text style={styles.buttonTextBlack}>{Strings.auth.googleLogin}</Text>
                    </TouchableOpacity>

                    {/* 배포 초기에 애플/게스트 로그인은 숨김 처리 (안드로이드 우선 배포) */}
                    {/* 
                    <TouchableOpacity
                        style={[styles.button, styles.appleButton]}
                        onPress={onSignInWithApple}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <FontAwesome name={Strings.auth.icons.apple as any} size={20} color="#fff" style={{ marginRight: 12 }} />
                        <Text style={styles.buttonTextWhite}>{Strings.auth.appleLogin}</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{Strings.auth.or}</Text>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.devButton, { borderColor: colors.border }]}
                        onPress={onDevLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.buttonTextDev, { color: colors.text }]}>{Strings.auth.guestLogin}</Text>
                    </TouchableOpacity> 
                    */}

                    {isLoading && (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.tint} />
                    )}
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    {Strings.auth.footerLaw}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 100,
    },
    logoImage: {
        width: 160,
        height: 160,
        marginBottom: 16,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
        fontWeight: '500',
        opacity: 0.7,
    },
    content: {
        width: '100%',
        marginTop: 20,
    },
    button: {
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    googleButton: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
    },
    appleButton: {
        backgroundColor: '#000',
    },
    devButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    buttonTextBlack: {
        fontSize: 17,
        fontWeight: '800',
        color: '#000',
    },
    buttonTextWhite: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
    },
    buttonTextDev: {
        fontSize: 17,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1.5,
        opacity: 0.1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.5,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
        opacity: 0.5,
    },
});
