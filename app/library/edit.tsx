import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LibraryService } from '@/services/LibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Strings } from '@/constants/Strings';

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
                Alert.alert(Strings.common.error, Strings.libraryForm.fetchError);
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, [libraryId]);

    const handleUpdate = async () => {
        if (!title.trim()) {
            Alert.alert(Strings.common.error, Strings.libraryForm.validationTitle);
            return;
        }

        if (!session?.user || !libraryId) {
            Alert.alert(Strings.common.error, Strings.itemForm.alerts.invalidAccess);
            return;
        }

        setSaving(true);
        try {
            await LibraryService.updateLibrary(libraryId, {
                title,
                description,
                category,
            });

            if (Platform.OS === 'web') {
                window.alert(Strings.itemForm.alerts.editSuccess);
            } else {
                Alert.alert(Strings.common.success, Strings.itemForm.alerts.editSuccess);
            }
            router.back();
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(`${Strings.itemForm.alerts.editFail}: ${error.message}`);
            } else {
                Alert.alert(Strings.itemForm.alerts.editFail, error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!libraryId) return;

        const confirmMessage = Strings.libraryForm.deleteConfirm;

        if (Platform.OS === 'web') {
            if (!window.confirm(confirmMessage)) return;
        } else {
            Alert.alert(Strings.common.deleteConfirmTitle, confirmMessage, [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        await deleteLibraryLogic();
                    }
                }
            ]);
            return;
        }
        await deleteLibraryLogic();
    };

    const deleteLibraryLogic = async () => {
        setSaving(true);
        try {
            await LibraryService.deleteLibrary(libraryId);
            if (Platform.OS === 'web') window.alert(Strings.libraryForm.deleteSuccess);
            else Alert.alert(Strings.common.success, Strings.libraryForm.deleteSuccess);

            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            if (Platform.OS === 'web') window.alert(`${Strings.libraryForm.deleteFail}: ${error.message}`);
            else Alert.alert(Strings.common.error, error.message);
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
