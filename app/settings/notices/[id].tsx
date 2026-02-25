import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNotices } from '@/hooks/useNotices';
import { Strings } from '@/constants/Strings';

export default function NoticeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { notice, loading, fetchNoticeById } = useNotices();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    useEffect(() => {
        if (id) fetchNoticeById(id);
    }, [id, fetchNoticeById]);

    const router = useRouter();

    const renderContentWithLinks = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <Text
                        key={index}
                        style={[styles.contentText, styles.linkText, { color: colors.tint }]}
                        onPress={() => router.push({
                            pathname: '/webview',
                            params: { url: part, title: notice?.title || Strings.notices.screenTitle }
                        })}
                    >
                        {part}
                    </Text>
                );
            }
            return <Text key={index} style={styles.contentText}>{part}</Text>;
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (!notice) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textSecondary }}>{Strings.notices.notFound}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: Strings.notices.screenTitle,
                    headerShown: true,
                }}
            />

            <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
                <View variant="transparent" style={styles.header}>
                    {notice.is_important && (
                        <View style={[styles.importantBadge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.importantText}>{Strings.notices.badgeImportant}</Text>
                        </View>
                    )}
                    <Text style={styles.title}>{notice.title}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {Strings.notices.createdAt(new Date(notice.created_at).toLocaleString())}
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View variant="transparent" style={styles.body}>
                    <Text style={styles.contentText}>
                        {renderContentWithLinks(notice.content)}
                    </Text>
                </View>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    importantBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
    },
    importantText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        lineHeight: 30,
    },
    date: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 24,
        opacity: 0.2,
    },
    body: {
        minHeight: 200,
    },
    contentText: {
        fontSize: 16,
        lineHeight: 26,
    },
    linkText: {
        textDecorationLine: 'underline',
    },
});
