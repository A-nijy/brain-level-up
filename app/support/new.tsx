import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { InquiryCategory } from '@/types';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSupport } from '@/hooks/useSupport';
import { Strings } from '@/constants/Strings';

const CATEGORIES: InquiryCategory[] = [
    Strings.support.categories.qa as InquiryCategory,
    Strings.support.categories.suggestion as InquiryCategory,
    Strings.support.categories.bug as InquiryCategory
];

export default function NewSupportScreen() {
    const { submitInquiry } = useSupport();
    const [category, setCategory] = useState<InquiryCategory>(Strings.support.categories.qa as InquiryCategory);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert(Strings.common.info, Strings.support.alerts.enterAll);
            return;
        }

        setLoading(true);
        try {
            await submitInquiry(category, title.trim(), content.trim());
            Alert.alert(Strings.common.success, Strings.support.alerts.submitSuccess, [
                { text: Strings.common.confirm, onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert(Strings.common.error, `${Strings.support.alerts.submitError} ${error.message}`);
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
                    title: Strings.support.screenTitle,
                    headerShown: true,
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInUp.duration(600)}>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {Strings.support.description}
                    </Text>

                    <Text style={styles.label}>{Strings.support.labelCategory}</Text>
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

                    <Text style={styles.label}>{Strings.support.labelTitle}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder={Strings.support.placeholderTitle}
                        placeholderTextColor={colors.textSecondary + '80'}
                    />

                    <Text style={styles.label}>{Strings.support.labelContent}</Text>
                    <TextInput
                        style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                        value={content}
                        onChangeText={setContent}
                        placeholder={Strings.support.placeholderContent}
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
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{Strings.support.submitBtn}</Text>}
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
