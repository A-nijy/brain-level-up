import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSectionDetail } from '@/hooks/useSectionDetail';
import { Strings } from '@/constants/Strings';

export default function CreateItemScreen() {
    const { id, sectionId } = useLocalSearchParams();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { createItem } = useSectionDetail(sid);

    const handleCreate = async () => {
        if (!question.trim() || !answer.trim()) {
            Alert.alert(Strings.common.error, Strings.itemForm.alerts.enterAll);
            return;
        }

        if (!libraryId || !sid) {
            Alert.alert(Strings.common.error, Strings.itemForm.alerts.invalidAccess);
            return;
        }

        setLoading(true);
        try {
            await createItem({
                library_id: libraryId,
                section_id: sid,
                question,
                answer,
                memo,
            });

            if (Platform.OS === 'web') {
                const more = window.confirm(`${Strings.common.success}! ${Strings.itemForm.alerts.saveSuccess}`);
                if (more) {
                    setQuestion('');
                    setAnswer('');
                    setMemo('');
                } else {
                    router.back();
                }
            } else {
                Alert.alert(Strings.common.success, Strings.itemForm.alerts.saveSuccess, [
                    {
                        text: Strings.common.no,
                        onPress: () => router.back(),
                        style: 'cancel',
                    },
                    {
                        text: Strings.common.yes,
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
                window.alert(`${Strings.itemForm.alerts.saveFail}: ${error.message}`);
            } else {
                Alert.alert(Strings.itemForm.alerts.saveFail, error.message);
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
                    title: Strings.itemForm.createTitle,
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
                        autoFocus
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
                    style={[styles.submitButton, { backgroundColor: colors.tint }, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? Strings.itemForm.submitSaving : Strings.itemForm.submitSave}
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
