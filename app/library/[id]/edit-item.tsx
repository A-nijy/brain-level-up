import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ItemService } from '@/services/ItemService';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
export default function EditItemScreen() {
    const { id, itemId } = useLocalSearchParams(); // library_id(id), item_id(itemId)
    const libraryId = Array.isArray(id) ? id[0] : id;
    const itemUuid = Array.isArray(itemId) ? itemId[0] : itemId;

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!libraryId || !itemUuid) return;
        const fetchItem = async () => {
            try {
                // 주의: getItems는 전체를 가져옴. 성능 이슈가 있을 수 있으나 MVP로는 허용.
                const items = await ItemService.getItems(libraryId);
                const target = items.find(i => i.id === itemUuid);

                if (target) {
                    setQuestion(target.question);
                    setAnswer(target.answer);
                    setMemo(target.memo || '');
                } else {
                    Alert.alert('오류', '단어를 찾을 수 없습니다.');
                    router.back();
                }
            } catch (error) {
                console.error(error);
                Alert.alert('오류', '정보를 불러오지 못했습니다.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [libraryId, itemUuid]);

    const handleUpdate = async () => {
        if (!question.trim() || !answer.trim()) {
            Alert.alert('오류', '문제와 정답을 모두 입력해주세요.');
            return;
        }

        if (!itemUuid) {
            Alert.alert('오류', '잘못된 접근입니다.');
            return;
        }

        setSaving(true);
        try {
            await ItemService.updateItem(itemUuid, {
                question,
                answer,
                memo,
            });

            if (Platform.OS === 'web') {
                window.alert('수정되었습니다.');
            } else {
                Alert.alert('성공', '수정되었습니다.');
            }
            router.back();
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(`수정 실패: ${error.message}`);
            } else {
                Alert.alert('수정 실패', error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ title: '단어 수정' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>문제 (단어) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: Ambiguous"
                        value={question}
                        onChangeText={setQuestion}
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
                    style={[styles.submitButton, saving && styles.disabledButton]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    <Text style={styles.submitButtonText}>
                        {saving ? '저장 중...' : '저장하기'}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
        backgroundColor: 'transparent',
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
        backgroundColor: '#007AFF', // Blue for items
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
