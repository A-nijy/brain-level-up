import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ItemService } from '@/services/ItemService';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function EditItemScreen() {
    const { id, sectionId, itemId } = useLocalSearchParams();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;
    const itemUuid = Array.isArray(itemId) ? itemId[0] : itemId;

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    useEffect(() => {
        if (!sid || !itemUuid) return;
        const fetchItem = async () => {
            try {
                const items = await ItemService.getItems(sid);
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
    }, [sid, itemUuid]);

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
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen
                options={{
                    title: '단어 수정',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
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
                    style={[styles.submitButton, { backgroundColor: colors.tint }, saving && styles.disabledButton]}
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
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
