import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
    const {
        user,
        profile,
        nickname,
        setNickname,
        isEditing,
        setIsEditing,
        loading,
        error,
        setError,
        updateNickname,
        withdraw,
        cancelEditing
    } = useProfile();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen
                options={{
                    title: '프로필 관리',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.headerSection}>
                    <View variant="transparent" style={styles.avatarWrapper}>
                        <FontAwesome name="user-circle-o" size={100} color={colors.tint} />
                    </View>
                    <Text style={styles.userIdNumber}>ID: #{profile?.user_id_number || '-----'}</Text>
                </Animated.View>

                <View variant="transparent" style={styles.section}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>닉네임</Text>
                    <Card style={styles.infoCard}>
                        {isEditing ? (
                            <View variant="transparent" style={styles.editRow}>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: error ? colors.error : colors.border }]}
                                    value={nickname}
                                    onChangeText={(text) => {
                                        setNickname(text);
                                        setError(null);
                                    }}
                                    autoFocus
                                    maxLength={8}
                                    placeholder="2~8자 입력"
                                />
                                <View variant="transparent" style={styles.editButtons}>
                                    <TouchableOpacity
                                        style={[styles.smallButton, { backgroundColor: colors.tint }]}
                                        onPress={updateNickname}
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallButtonText}>저장</Text>}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.smallButton, styles.cancelButton]}
                                        onPress={cancelEditing}
                                    >
                                        <Text style={styles.smallButtonText}>취소</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View variant="transparent" style={styles.displayRow}>
                                <Text style={styles.valueText}>{profile?.nickname || '닉네임 없음'}</Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <FontAwesome name="pencil" size={18} color={colors.tint} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </Card>
                    {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>닉네임은 2자에서 8자까지 설정 가능합니다.</Text>
                </View>

                <View variant="transparent" style={styles.section}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>로그인 계정 (이메일)</Text>
                    <Card style={[styles.infoCard, { borderStyle: 'dashed' }]}>
                        <View variant="transparent" style={styles.displayRow}>
                            <Text style={[styles.valueText, { color: colors.textSecondary }]}>{user?.email}</Text>
                            <FontAwesome name="lock" size={18} color={colors.border} />
                        </View>
                    </Card>
                </View>

                <TouchableOpacity style={styles.withdrawButton} onPress={withdraw}>
                    <Text style={styles.withdrawText}>회원 탈퇴</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    userIdNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.5,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    infoCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    displayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editRow: {
        flexDirection: 'column',
    },
    valueText: {
        fontSize: 18,
        fontWeight: '700',
    },
    input: {
        height: 50,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    editButtons: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'flex-end',
    },
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    smallButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    hint: {
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
        opacity: 0.7,
    },
    withdrawButton: {
        marginTop: 40,
        alignSelf: 'center',
        padding: 10,
    },
    withdrawText: {
        color: '#ff4444',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
});
