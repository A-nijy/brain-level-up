import React from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useProfile } from '@/hooks/useProfile';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';

import { Strings } from '@/constants/Strings';

export default function ProfileScreen() {
    const {
        profile,
        nickname,
        setNickname,
        loading,
        error,
        updateNickname,
        withdraw
    } = useProfile();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const router = useRouter();

    const isWeb = Platform.OS === 'web' && width > 768;

    const handleSave = async () => {
        if (nickname.length < 2 || nickname.length > 8) {
            Alert.alert(Strings.common.warning, Strings.settings.profile.hintNickname);
            return;
        }
        await updateNickname();
    };

    const handleWithdraw = () => {
        Alert.alert(
            Strings.settings.profile.withdraw,
            Strings.profile.deleteConfirm,
            [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.confirm,
                    style: 'destructive',
                    onPress: async () => {
                        await withdraw();
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ title: Strings.settings.profile.editTitle }} />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <FontAwesome name={Strings.settings.icons.userCircle as any} size={100} color={colors.tint} />
                    <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>{profile?.email}</Text>
                </View>

                <Card style={styles.formCard}>
                    <View variant="transparent" style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{Strings.settings.profile.labelNickname}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: error ? colors.error : colors.border }]}
                            value={nickname}
                            onChangeText={setNickname}
                            placeholder={Strings.settings.profile.placeholderNickname}
                            placeholderTextColor={colors.textSecondary + '80'}
                            maxLength={8}
                        />
                        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            {Strings.settings.profile.hintNickname}
                        </Text>
                    </View>

                    <View variant="transparent" style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{Strings.settings.profile.labelAccount}</Text>
                        <View style={[styles.disabledInput, { backgroundColor: colors.border + '20', borderColor: colors.border }]}>
                            <Text style={{ color: colors.textSecondary }}>{profile?.email || 'Guest Session'}</Text>
                            <FontAwesome name={Strings.settings.icons.lock as any} size={14} color={colors.textSecondary} />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.tint }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>{Strings.common.save}</Text>
                        )}
                    </TouchableOpacity>
                </Card>

                <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                    <Text style={styles.withdrawText}>{Strings.settings.profile.withdraw}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    emailLabel: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    formCard: {
        padding: 24,
        borderRadius: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    disabledInput: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hint: {
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
        opacity: 0.7,
    },
    errorText: {
        fontSize: 12,
        color: '#ff4444',
        marginTop: 4,
        marginLeft: 4,
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    withdrawButton: {
        marginTop: 40,
        alignSelf: 'center',
        padding: 10,
    },
    withdrawText: {
        color: '#ff4444',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
});
