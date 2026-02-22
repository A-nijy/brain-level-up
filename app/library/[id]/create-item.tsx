import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ItemService } from '@/services/ItemService';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function CreateItemScreen() {
    const { id } = useLocalSearchParams(); // library_id
    const libraryId = Array.isArray(id) ? id[0] : id; // Ensure string type

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleCreate = async () => {
        if (!question.trim() || !answer.trim()) {
            Alert.alert('오류', '문제와 정답을 모두 입력해주세요.');
            return;
        }

        if (!libraryId) {
            Alert.alert('오류', '잘못된 접근입니다.');
            return;
        }

        setLoading(true);
        try {
            await ItemService.createItem({
                library_id: libraryId,
                question,
                answer,
                memo,
            });

            if (Platform.OS === 'web') {
                const more = window.confirm('성공! 추가되었습니다.\n계속 추가하시겠습니까?');
                if (more) {
                    setQuestion('');
                    setAnswer('');
                    setMemo('');
                } else {
                    router.back();
                }
            } else {
                Alert.alert('성공', '추가되었습니다. 계속 추가하시겠습니까?', [
                    {
                        text: '아니오',
                        onPress: () => router.back(),
                        style: 'cancel',
                    },
                    {
                        text: '예',
                        onPress: () => {
                            setQuestion('');
                            setAnswer('');
                            setMemo('');
                        },
                    },
                ]);
            }
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(`추가 실패: ${error.message}`);
            } else {
                Alert.alert('추가 실패', error.message);
            }
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
                    title: '단어 추가',
                    headerTintColor: colors.text,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>문제 (단어) *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="예: Ambiguous"
                        value={question}
                        onChangeText={setQuestion}
                        autoFocus
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>정답 (뜻) *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="예: 애매모호한, 불분명한"
                        value={answer}
                        onChangeText={setAnswer}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>메모</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder="예문이나 팁을 적어보세요."
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.tint }, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? '저장 중...' : '저장하기'}
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
