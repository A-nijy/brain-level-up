import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AdminService } from '@/services/AdminService';
import { Section } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export default function AdminUserLibraryScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const router = useRouter();
    // 파라미터가 배열로 들어올 경우를 대비하여 첫 번째 값만 사용
    const libraryId = (Array.isArray(id) ? id[0] : id) as string;
    
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    const [library, setLibrary] = useState<any>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            if (!libraryId) return;
            try {
                // 관리자용 서비스 호출
                const [libData, secData, loneItems] = await Promise.all([
                    AdminService.getLibraryById(libraryId),
                    AdminService.getUserLibrarySections(libraryId),
                    AdminService.getUserLibraryItemsWithoutSection(libraryId)
                ]);
                
                if (isMounted) {
                    setLibrary(libData);
                    
                    // 섹션이 없는데 개별 아이템이 있는 경우 가상 섹션 추가
                    let finalSections = [...secData];
                    if (loneItems && loneItems.length > 0) {
                        const virtualSection: Section = {
                            id: 'null_section',
                            library_id: libraryId,
                            title: '미분류 및 기본 섹션',
                            display_order: -1,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        finalSections = [virtualSection, ...finalSections];
                    }
                    
                    setSections(finalSections);
                }
            } catch (error: any) {
                if (isMounted) {
                    console.error(`[AdminUserLibrary] Load error for ID [${libraryId}]:`, error);
                    showAlert({ title: Strings.common.error, message: `데이터를 불러오지 못했습니다. (ID: ${libraryId})` });
                    router.back();
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        
        loadData();
        return () => { isMounted = false; };
    }, [libraryId]);

    const renderItem = ({ item, index }: { item: Section, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 40).duration(400)} style={styles.cardWrapper}>
            <Card 
                style={styles.sectionCard}
                onPress={() => router.push({
                    pathname: "/admin/user-library/section/[sectionId]" as any,
                    params: { 
                        sectionId: item.id, 
                        libraryId, 
                        title: item.title,
                        isLoneItems: item.id === 'null_section' ? 'true' : 'false'
                    }
                })}
            >
                <View variant="transparent" style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                    <Text style={[styles.sectionDate, { color: colors.textSecondary }]}>
                        {item.id === 'null_section' ? '전체 라이브러리 직접 소속' : new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View variant="transparent" style={styles.rightAction}>
                    <FontAwesome name="chevron-right" size={16} color={colors.border} />
                </View>
            </Card>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerTitle: paramTitle || Strings.libraryDetail.title }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: Platform.OS === 'web' ? 24 : 0 }]}>
            <Stack.Screen
                options={{
                    headerTitle: library?.title || paramTitle || '암기장 뷰어 (읽기 전용)',
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                data={sections}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        {library?.description && (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {library.description}
                            </Text>
                        )}
                        <Text style={styles.subHeaderTitle}>내부 섹션/챕터 목록 (총 {sections.length}개)</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View variant="transparent" style={styles.emptyContainer}>
                        <FontAwesome name="folder-open-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            등록된 섹션이나 단어가 없습니다.
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
    descriptionText: { fontSize: 16, lineHeight: 24, fontWeight: '500', marginBottom: 20 },
    subHeaderTitle: { fontSize: 14, fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 },
    listContent: { padding: 20, paddingBottom: 100 },
    cardWrapper: { marginBottom: 12 },
    sectionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderRadius: 24, borderWidth: 1.5 },
    sectionInfo: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    sectionDate: { fontSize: 13, fontWeight: '600' },
    rightAction: { paddingLeft: 16 },
    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 32 },
});
