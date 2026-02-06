import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LibraryService } from '@/services/LibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Library } from '@/types';

export default function EditLibraryScreen() {
    const { session } = useAuth();
    const { id } = useLocalSearchParams();
    const libraryId = Array.isArray(id) ? id[0] : id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

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
                Alert.alert('오류', '정보를 불러오지 못했습니다.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, [libraryId]);

    const handleUpdate = async () => {
        if (!title.trim()) {
            Alert.alert('오류', '제목을 입력해주세요.');
            return;
        }

        if (!session?.user || !libraryId) {
            Alert.alert('오류', '잘못된 접근입니다.');
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

    const handleDelete = async () => {
        if (!libraryId) return;

        const confirmMessage = '정말 이 암기장을 삭제하시겠습니까?\n포함된 모든 단어가 함께 삭제됩니다.';

        if (Platform.OS === 'web') {
            if (!window.confirm(confirmMessage)) return;
        } else {
            // Native Alert
            // We can't use await Alert here easily without a wrapper Promise, 
            // so we just return and do the logic inside the callback.
            // But to keep code clean, we will split logic.
            // Here we just show Alert and return.
            Alert.alert('삭제 확인', confirmMessage, [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteLibraryLogic();
                    }
                }
            ]);
            return;
        }

        // Web (or if we could await Native Alert) executes this:
        await deleteLibraryLogic();
    };

    const deleteLibraryLogic = async () => {
        setSaving(true);
        try {
            await LibraryService.deleteLibrary(libraryId);
            if (Platform.OS === 'web') window.alert('암기장이 삭제되었습니다.');
            else Alert.alert('성공', '암기장이 삭제되었습니다.');

            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            if (Platform.OS === 'web') window.alert(`삭제 실패: ${error.message}`);
            else Alert.alert('오류', error.message);
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
            <Stack.Screen options={{ title: '암기장 수정' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>제목 *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 토익 보카 2024"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>설명</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="이 암기장에 대한 설명 (선택)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>카테고리</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 영어, 자격증, IT"
                        value={category}
                        onChangeText={setCategory}
                        placeholderTextColor="#999"
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

                <TouchableOpacity
                    style={[styles.deleteButton, saving && styles.disabledButton]}
                    onPress={handleDelete}
                    disabled={saving}
                >
                    <Text style={styles.deleteButtonText}>암기장 삭제</Text>
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
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ff4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30, // 하단 여백
    },
    disabledButton: {
        backgroundColor: '#ccc',
        borderColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButtonText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
