import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Platform, useWindowDimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

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
                Alert.alert('오류', '반환된 URL에 파라미터가 없습니다.\nURL: ' + url.substring(0, 100));
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
                Alert.alert('구글 로그인 오류', errorDesc.replace(/\+/g, ' '));
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

            Alert.alert('오류', '토큰을 찾을 수 없습니다.\n파라미터: ' + JSON.stringify(params));
            return false;
        } catch (e) {
            console.error('Session parsing error:', e);
            Alert.alert('디버그오류', String(e));
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
                        Alert.alert('알림', '세션 정보를 받아오지 못했습니다.');
                    }
                }
            }
        } catch (error: any) {
            Alert.alert('로그인 오류', error.message);
        } finally {
            if (Platform.OS !== 'web') {
                setIsLoading(false);
            }
        }
    };

    const onSignInWithApple = async () => {
        Alert.alert('알림', 'Apple 로그인은 현재 준비 중입니다.\n(Google 로그인이나 체험하기를 이용해주세요)');
    };

    const onDevLogin = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) Alert.alert('오류', error.message);
        setIsLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.contentWrapper, isWeb && { maxWidth: 500, alignSelf: 'center', width: '100%' }]}>
                <View style={styles.header}>
                    <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                        <LinearGradient
                            colors={[colors.tint, colors.primaryGradient[1]]}
                            style={styles.logoContainer}
                        >
                            <FontAwesome name="book" size={48} color="#fff" />
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>Memorize Mate</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            스마트한 암기 생활의 시작,{"\n"}지금 바로 경험해보세요.
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
                        <FontAwesome name="google" size={20} color="#EA4335" style={{ marginRight: 12 }} />
                        <Text style={styles.buttonTextBlack}>Google로 시작하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.appleButton]}
                        onPress={onSignInWithApple}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <FontAwesome name="apple" size={20} color="#fff" style={{ marginRight: 12 }} />
                        <Text style={styles.buttonTextWhite}>Apple로 시작하기</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>또는</Text>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.devButton, { borderColor: colors.border }]}
                        onPress={onDevLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.buttonTextDev, { color: colors.text }]}>게스트로 체험하기</Text>
                    </TouchableOpacity>

                    {isLoading && (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.tint} />
                    )}
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
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
        marginBottom: 60,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
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
