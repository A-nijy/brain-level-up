import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function CreateItemScreen() {
    const { id } = useLocalSearchParams(); // library_id
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!question.trim() || !answer.trim()) {
            Alert.alert('오류', '문제와 정답을 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('items')
                .insert([
                    {
                        library_id: id,
                        question,
                        answer,
                        memo,
                    },
                ]);

            if (error) throw error;

            // Ask if user wants to add another
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
        } catch (error: any) {
            Alert.alert('추가 실패', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ title: '단어 추가' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>문제 (단어) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: Ambiguous"
                        value={question}
                        onChangeText={setQuestion}
                        autoFocus
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>정답 (뜻) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 애매모호한, 불분명한"
                        value={answer}
                        onChangeText={setAnswer}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>메모</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="예문이나 팁을 적어보세요."
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
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
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        color: '#333',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#666',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
