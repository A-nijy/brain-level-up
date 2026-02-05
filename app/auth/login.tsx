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

    const onSignInWithGoogle = async () => {
        setIsLoading(true);
        try {
            const redirectUri = makeRedirectUri({
                scheme: 'mem-app',
                path: 'auth/callback',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: false, // Let Supabase handle redirect
                },
            });

            if (error) Alert.alert('Error', error.message);
            // OAuth flow is handled by browser redirect
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            // Note: On mobile, this might run before auth completes if browser opens uniquely
            setIsLoading(false);
        }
    };

    const onSignInWithApple = async () => {
        Alert.alert('Notice', 'Apple Login setup requires paid developer account credentials. Placeholder logic.');
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
