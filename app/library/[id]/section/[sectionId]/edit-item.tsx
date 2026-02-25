import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSectionDetail } from '@/hooks/useSectionDetail';
import { Item } from '@/types';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function EditItemScreen() {
    const { id, sectionId, itemId } = useLocalSearchParams();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;
    const itemUuid = Array.isArray(itemId) ? itemId[0] : itemId;

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [saving, setSaving] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    const { items, loading, updateItem } = useSectionDetail(sid);

    useEffect(() => {
        if (!loading && items.length > 0 && itemUuid) {
            const target = items.find((i: Item) => i.id === itemUuid);
            if (target) {
                setQuestion(target.question);
                setAnswer(target.answer);
                setMemo(target.memo || '');
            } else {
                showAlert({ title: Strings.common.error, message: Strings.itemForm.alerts.notFound });
                router.back();
            }
        }
    }, [loading, items, itemUuid]);

    const handleUpdate = async () => {
        if (!question.trim() || !answer.trim()) {
            showAlert({ title: Strings.common.error, message: Strings.itemForm.alerts.enterAll });
            return;
        }

        if (!itemUuid) {
            showAlert({ title: Strings.common.error, message: Strings.itemForm.alerts.invalidAccess });
            return;
        }

        setSaving(true);
        try {
            await updateItem(itemUuid, {
                question,
                answer,
                memo,
            });

            showAlert({ title: Strings.common.success, message: Strings.itemForm.alerts.editSuccess });
            router.back();
        } catch (error: any) {
            showAlert({ title: Strings.itemForm.alerts.editFail, message: error.message });
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
                    title: Strings.itemForm.editTitle,
                    headerTintColor: colors.text,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.itemForm.labelQuestion}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.itemForm.placeholderQuestion}
                        value={question}
                        onChangeText={setQuestion}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.itemForm.labelAnswer}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.itemForm.placeholderAnswer}
                        value={answer}
                        onChangeText={setAnswer}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.itemForm.labelMemo}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.itemForm.placeholderMemo}
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
                        {saving ? Strings.itemForm.submitSaving : Strings.itemForm.submitSave}
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
