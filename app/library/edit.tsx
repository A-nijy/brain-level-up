import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LibraryService } from '@/services/LibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function EditLibraryScreen() {
    const { session } = useAuth();
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const libraryId = Array.isArray(id) ? id[0] : id;

    const [title, setTitle] = useState(paramTitle || '');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    useEffect(() => {
        if (!libraryId) return;
        const fetchLibrary = async () => {
            try {
                const data = await LibraryService.getLibraryById(libraryId);
                if (data) {
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setCategory(data.category || '');
                }
            } catch (error) {
                console.error(error);
                showAlert({ title: Strings.common.error, message: Strings.libraryForm.fetchError });
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, [libraryId]);

    const handleUpdate = async () => {
        if (!title.trim()) {
            showAlert({ title: Strings.common.error, message: Strings.libraryForm.validationTitle });
            return;
        }

        if (!session?.user || !libraryId) {
            showAlert({ title: Strings.common.error, message: Strings.itemForm.alerts.invalidAccess });
            return;
        }

        setSaving(true);
        try {
            await LibraryService.updateLibrary(libraryId, {
                title,
                description,
                category,
            });

            showAlert({ title: Strings.common.success, message: Strings.itemForm.alerts.editSuccess });
            router.back();
        } catch (error: any) {
            showAlert({ title: Strings.itemForm.alerts.editFail, message: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!libraryId) return;

        const confirmMessage = Strings.libraryForm.deleteConfirm;

        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: confirmMessage,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        await deleteLibraryLogic();
                    }
                }
            ]
        });
    };

    const deleteLibraryLogic = async () => {
        setSaving(true);
        try {
            await LibraryService.deleteLibrary(libraryId);
            showAlert({ title: Strings.common.success, message: Strings.libraryForm.deleteSuccess });

            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            showAlert({ title: Strings.libraryForm.deleteFail, message: error.message });
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
                    title: Strings.libraryDetail.modal.editTitle,
                    headerTintColor: colors.text,
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.common.title} *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.libraryForm.placeholderTitle}
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.common.description}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.libraryForm.placeholderDesc}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{Strings.common.category}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                        placeholder={Strings.libraryForm.placeholderCategory}
                        value={category}
                        onChangeText={setCategory}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.tint }, saving && styles.disabledButton]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    <Text style={styles.submitButtonText}>
                        {saving ? Strings.common.saving : Strings.common.save}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: colors.error }, saving && styles.disabledButton]}
                    onPress={handleDelete}
                    disabled={saving}
                >
                    <Text style={[styles.deleteButtonText, { color: colors.error }]}>{Strings.libraryForm.deleteBtn}</Text>
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
    deleteButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 30,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
