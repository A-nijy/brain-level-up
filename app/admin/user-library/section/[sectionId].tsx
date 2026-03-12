import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AdminService } from '@/services/AdminService';
import { Item } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export default function AdminUserLibrarySectionScreen() {
    const { sectionId: sid, libraryId: lid, title: paramTitle, isLoneItems } = useLocalSearchParams<{ 
        sectionId: string; 
        libraryId?: string;
        title?: string;
        isLoneItems?: string;
    }>();
    
    const sectionId = (Array.isArray(sid) ? sid[0] : sid) as string;
    const libraryId = (Array.isArray(lid) ? lid[0] : lid) as string;
    
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();
    const router = useRouter();

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function loadItems() {
            try {
                let data: Item[] = [];
                // 관리자 전용 서비스로 데이터 조회
                if (isLoneItems === 'true' && libraryId) {
                    data = await AdminService.getUserLibraryItemsWithoutSection(libraryId);
                } else if (sectionId && sectionId !== 'null_section') {
                    data = await AdminService.getUserLibraryItems(sectionId);
                }
                
                if (isMounted) {
                    setItems(data);
                }
            } catch (error: any) {
                if (isMounted) {
                    console.error(`[AdminUserLibrarySection] Load error for sid[${sectionId}], lid[${libraryId}]:`, error);
                    showAlert({ title: Strings.common.error, message: `데이터를 불러오지 못했습니다. (ID: ${sectionId || libraryId})` });
                    router.back();
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadItems();
        return () => { isMounted = false; };
    }, [sectionId, libraryId, isLoneItems]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'learned': return colors.success;
            case 'confused': return '#F59E0B';
            default: return colors.textSecondary;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'learned': return Strings.librarySection.statusModal.learned;
            case 'confused': return Strings.librarySection.statusModal.confused;
            default: return Strings.librarySection.statusModal.undecided;
        }
    };

    const renderItem = ({ item, index }: { item: Item, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 40).duration(400)} style={styles.cardWrapper}>
            <Card style={styles.itemCard}>
                <View variant="transparent" style={styles.itemHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.study_status) + '15' }]}>
                        <FontAwesome
                            name={item.study_status === 'learned' ? 'check-circle' : item.study_status === 'confused' ? 'question-circle' : 'circle-o'}
                            size={12}
                            color={getStatusColor(item.study_status)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(item.study_status) }]}>
                            {getStatusText(item.study_status)}
                        </Text>
                    </View>
                    <View variant="transparent" style={styles.stats}>
                        <Text style={[styles.statText, { color: colors.success }]}>{item.success_count}맞춤</Text>
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>|</Text>
                        <Text style={[styles.statText, { color: Colors.light.error }]}>{item.fail_count}틀림</Text>
                    </View>
                </View>

                <View variant="transparent" style={styles.qaContainer}>
                    <View variant="transparent" style={styles.qBox}>
                        <Text style={[styles.qLabel, { color: colors.tint }]}>Q</Text>
                        <Text style={styles.qText}>{item.question}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View variant="transparent" style={styles.aBox}>
                        <Text style={[styles.aLabel, { color: colors.success }]}>A</Text>
                        <Text style={styles.aText}>{item.answer}</Text>
                    </View>
                </View>

                {item.memo && (
                    <View style={[styles.memoBox, { backgroundColor: colors.cardBackground }]}>
                        <FontAwesome name="sticky-note-o" size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
                        <Text style={[styles.memoText, { color: colors.textSecondary }]}>{item.memo}</Text>
                    </View>
                )}
            </Card>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerTitle: paramTitle || Strings.librarySection.title }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: Platform.OS === 'web' ? 24 : 0 }]}>
            <Stack.Screen
                options={{
                    headerTitle: paramTitle || '문제 목록 (읽기 전용)',
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        <Text style={styles.subHeaderTitle}>내부 단어/문제 목록 (총 {items.length}개)</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View variant="transparent" style={styles.emptyContainer}>
                        <FontAwesome name="list-alt" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            등록된 문제가 없습니다.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listHeader: { paddingHorizontal: 4, paddingBottom: 24, marginTop: 12 },
    subHeaderTitle: { fontSize: 14, fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 },
    listContent: { padding: 20, paddingBottom: 100 },
    cardWrapper: { marginBottom: 16 },
    itemCard: { padding: 20, borderRadius: 24, borderWidth: 1.5, overflow: 'hidden' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', marginBottom: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statText: { fontSize: 12, fontWeight: '600' },
    qaContainer: { gap: 16 },
    qBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    qLabel: { fontSize: 18, fontWeight: '900', marginTop: 2 },
    qText: { flex: 1, fontSize: 18, fontWeight: '800', lineHeight: 28 },
    divider: { height: 1, opacity: 0.5, marginVertical: 4 },
    aBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    aLabel: { fontSize: 18, fontWeight: '900', marginTop: 2 },
    aText: { flex: 1, fontSize: 16, fontWeight: '600', lineHeight: 24 },
    memoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20, padding: 16, borderRadius: 16 },
    memoText: { flex: 1, fontSize: 14, lineHeight: 20 },
    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 32 },
});
