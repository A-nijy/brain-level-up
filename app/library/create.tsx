import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LibraryService } from '@/services/LibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function CreateLibraryScreen() {
    const { session } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('오류', '제목을 입력해주세요.');
            return;
        }

        if (!session?.user) {
            Alert.alert('오류', '로그인이 필요합니다.');
            return;
        }

        setLoading(true);
        try {
            await LibraryService.createLibrary(session.user.id, {
                title,
                description,
                category,
                is_public: false,
            });

            router.back();
        } catch (error: any) {
            Alert.alert('생성 실패', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen
                options={{
                    title: '새 암기장 만들기',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>제목 *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="예: 토익 보카 2024"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>설명</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="이 암기장에 대한 설명 (선택)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>카테고리</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="예: 영어, 자격증, IT"
                        value={category}
                        onChangeText={setCategory}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.tint }, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? '생성 중...' : '만들기'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 24,
        backgroundColor: 'transparent',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
