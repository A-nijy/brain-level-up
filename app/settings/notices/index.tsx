import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { NoticeService } from '@/services/NoticeService';
import { Notice } from '@/types';
import { Stack, useRouter, Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function NoticesScreen() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const fetchNotices = async () => {
        try {
            const data = await NoticeService.getNotices();
            setNotices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotices();
    };

    const renderItem = ({ item, index }: { item: Notice; index: number }) => (
        <Card
            style={[styles.card, styles.noticeItem, item.is_important && { borderColor: colors.tint, borderLeftWidth: 4 }]}
            onPress={() => {
                console.log('[NoticeList] Item pressed:', item.id);
                // 시각적으로 즉각 확인하기 위한 알럿 추가
                Alert.alert('클릭됨', `ID: ${item.id}`);
                router.push(`/settings/notices/${item.id}`);
            }}
        >
            <View variant="transparent" style={styles.cardHeader}>
                <View variant="transparent" style={styles.badgeContainer}>
                    {item.is_important && (
                        <View style={[styles.importantBadge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.importantText}>중요</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.contentPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.content.replace(/<[^>]*>?/gm, '')}
            </Text>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: '공지사항',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={notices}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                    }
                    ListHeaderComponent={
                        <TouchableOpacity
                            onPress={() => Alert.alert('화면 터치 정상', '리스트 상단 테스트 버튼이 클릭되었습니다.')}
                            style={{ padding: 15, backgroundColor: colors.tint + '20', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: colors.tint, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.tint, fontWeight: 'bold' }}>터치 작동 테스트 (여기를 눌러보세요)</Text>
                        </TouchableOpacity>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <FontAwesome name="bullhorn" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                등록된 공지사항이 없습니다.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    noticeItem: {
        marginBottom: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    importantBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    importantText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    contentPreview: {
        fontSize: 14,
        lineHeight: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
});
