import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SupportService } from '@/services/SupportService';
import { InquiryCategory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

const CATEGORIES: InquiryCategory[] = ['Q&A', '건의사항', '버그'];

export default function NewSupportScreen() {
    const { user } = useAuth();
    const [category, setCategory] = useState<InquiryCategory>('Q&A');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (!user) {
            Alert.alert('오류', '로그인 후 이용 가능합니다.');
            return;
        }

        setLoading(true);
        try {
            await SupportService.submitInquiry(user.id, category, title, content);
            Alert.alert('성공', '소중한 의견이 제출되었습니다. 확인 후 처리해 드리겠습니다.', [
                { text: '확인', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '제출 중 문제가 발생했습니다. 다시 시도해 주세요.');
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
                    title: 'Q&A 및 건의사항',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInUp.duration(600)}>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        앱 사용 중 궁금한 점이나 개선이 필요한 점, 발견하신 버그를 알려주세요. 관리자가 확인 후 답변 드리거나 반영하겠습니다.
                    </Text>

                    <Text style={styles.label}>카테고리</Text>
                    <View variant="transparent" style={styles.categoryRow}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryButton,
                                    { borderColor: category === cat ? colors.tint : colors.border },
                                    category === cat && { backgroundColor: colors.tint + '10' }
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    { color: category === cat ? colors.tint : colors.textSecondary }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>제목</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="제목을 입력하세요"
                        placeholderTextColor={colors.textSecondary + '80'}
                    />

                    <Text style={styles.label}>내용</Text>
                    <TextInput
                        style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                        value={content}
                        onChangeText={setContent}
                        placeholder="내용을 입력하세요 (버그 제보 시 발생 상황을 상세히 적어주시면 큰 도움이 됩니다)"
                        placeholderTextColor={colors.textSecondary + '80'}
                        multiline
                        numberOfLines={10}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.tint }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>제출하기</Text>}
                    </TouchableOpacity>
                </Animated.View>
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
        paddingBottom: 40,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 4,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    categoryButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        minHeight: 180,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingTop: 16,
        fontSize: 16,
        marginBottom: 30,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});
