import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser'; // For web OAuth if needed
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession(); // Required for web redirect handling

export default function LoginScreen() {
    const [isLoading, setIsLoading] = useState(false);

    // 간단한 테스트를 위해 이메일/비밀번호 로그인도 추가할 수 있지만, 
    // 요구사항에 따라 Google/Apple 로그인을 메인으로 배치합니다.

    // URL에서 토큰 파싱하는 헬퍼 함수
    const extractSessionFromUrl = async (url: string) => {
        try {
            // #access_token=...&refresh_token=... 형태 파싱
            const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (error) throw error;
                return true;
            }
            return false;
        } catch (e) {
            console.error('Session parsing error:', e);
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

            console.log('Using Redirect URI:', redirectUri);

            // 1. Get Auth URL from Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                    queryParams: {
                        prompt: 'select_account',
                    },
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('No auth URL returned from Supabase');

            console.log('Auth URL:', data.url);

            // 2. Open Browser
            if (Platform.OS === 'web') {
                window.location.href = data.url;
                // 웹은 리다이렉트 후 돌아오면 supabase.ts의 detectSessionInUrl: true 덕분에 자동 처리됨
            } else {
                // 앱: WebBrowser 사용
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

                console.log('WebBrowser Result:', result);

                if (result.type === 'success' && result.url) {
                    const success = await extractSessionFromUrl(result.url);
                    if (!success) {
                        // iOS/Android에서 type은 success지만 url에 토큰이 없는 경우가 있을 수 있음 (딥링크 처리 필요시)
                        // 하지만 openAuthSessionAsync는 보통 리다이렉트된 URL을 반환함.
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
        // Apple 로그인은 개발자 계정 설정이 필요하므로 MVP 단계에서는 준비 중 메시지 표시
        if (Platform.OS === 'web') {
            window.alert('알림: Apple 로그인은 현재 준비 중입니다.\n(Google 로그인이나 체험하기를 이용해주세요)');
        } else {
            Alert.alert('알림', 'Apple 로그인은 현재 준비 중입니다.\n(Google 로그인이나 체험하기를 이용해주세요)');
        }
    };

    // Mock Login for Development (Since actual OAuth needs setup)
    const onDevLogin = async () => {
        setIsLoading(true);
        // 익명 로그인 또는 테스트 계정 로그인 로직 (Optional)
        // 여기서는 편의상 익명 로그인 시도 (Supabase Auth 설정 필요)
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) Alert.alert('Dev Login Error', error.message);
        setIsLoading(false);
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Memorize Mate</Text>
                <Text style={styles.subtitle}>모든 것을 기억하는 가장 완벽한 방법</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.button, styles.googleButton]}
                    onPress={onSignInWithGoogle}
                    disabled={isLoading}
                >
                    {/* Google Icon Placeholder */}
                    <Text style={styles.buttonTextBlack}>Google로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.appleButton]}
                    onPress={onSignInWithApple}
                    disabled={isLoading}
                >
                    {/* Apple Icon Placeholder */}
                    <Text style={styles.buttonTextWhite}>Apple로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.devButton]}
                    onPress={onDevLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonTextWhite}>체험하기 (익명 로그인)</Text>
                </TouchableOpacity>

                {isLoading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#000" />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    content: {
        gap: 16,
    },
    button: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    googleButton: {
        backgroundColor: '#fff',
        borderColor: '#ddd',
    },
    appleButton: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    devButton: {
        backgroundColor: '#666',
        borderColor: '#666',
        marginTop: 20, // Separate from social login
    },
    buttonTextBlack: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    buttonTextWhite: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
