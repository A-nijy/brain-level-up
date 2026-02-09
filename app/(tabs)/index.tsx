import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLibraries } from '@/hooks/useLibraries';
import { Library } from '@/types';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function LibraryListScreen() {
  const { libraries, loading, refreshing, refresh, reorderLibraries } = useLibraries();
  const [reorderMode, setReorderMode] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();

  // 웹과 데스크톱 환경을 위한 그리드 설정
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 768 ? 2 : 1;
  const key = `list-${numColumns}-${reorderMode}`; // 컬럼 수가 바뀔 때 리스트 재렌더링 보장

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newLibs = [...libraries];
    [newLibs[index - 1], newLibs[index]] = [newLibs[index], newLibs[index - 1]];
    await reorderLibraries(newLibs);
  };

  const handleMoveDown = async (index: number) => {
    if (index === libraries.length - 1) return;
    const newLibs = [...libraries];
    [newLibs[index + 1], newLibs[index]] = [newLibs[index], newLibs[index + 1]];
    await reorderLibraries(newLibs);
  };

  const renderItem = ({ item, index }: { item: Library; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      style={[
        styles.cardContainer,
        numColumns > 1 && { width: '48%', marginHorizontal: '1%' }
      ]}
    >
      <Card
        style={styles.card}
        onPress={reorderMode ? undefined : () => router.push(`/library/${item.id}`)}
        activeOpacity={reorderMode ? 1 : 0.7}
      >
        <View variant="transparent" style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3389/3389081.png' }}
              style={{ width: 22, height: 22, tintColor: colors.tint }}
            />
          </View>
          <View variant="transparent" style={styles.titleContainer}>
            <Text type="title" style={styles.cardTitle}>{item.title}</Text>
            {item.category && (
              <Text style={[styles.categoryText, { color: colors.tint }]}>{item.category}</Text>
            )}
          </View>
        </View>

        <Text type="subtitle" numberOfLines={2} style={styles.cardDescription}>
          {item.description || '설명이 없습니다.'}
        </Text>

        <View variant="transparent" style={styles.footerRow}>
          <View variant="transparent" style={styles.stat}>
            <FontAwesome name="calendar-o" size={12} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {new Date(item.created_at || Date.now()).toLocaleDateString()}
            </Text>
          </View>
          <FontAwesome name="angle-right" size={18} color={colors.textSecondary} />
        </View>

        {reorderMode && (
          <View variant="transparent" style={styles.reorderControls}>
            <TouchableOpacity
              style={[styles.reorderButton, index === 0 && { opacity: 0.3 }]}
              onPress={() => handleMoveUp(index)}
              disabled={index === 0}
            >
              <FontAwesome name="arrow-up" size={16} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, index === libraries.length - 1 && { opacity: 0.3 }]}
              onPress={() => handleMoveDown(index)}
              disabled={index === libraries.length - 1}
            >
              <FontAwesome name="arrow-down" size={16} color={colors.tint} />
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        key={key}
        data={libraries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          isWeb && width > 1200 && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
        }
        ListHeaderComponent={
          <View variant="transparent" style={styles.headerContainer}>
            <View variant="transparent" style={styles.headerRow}>
              <View variant="transparent">
                <Text style={styles.headerTitle}>나의 암기장</Text>
                <Text style={styles.headerSubtitle}>오늘도 지식을 쌓아보세요!</Text>
              </View>
              {libraries.length > 1 && (
                <TouchableOpacity
                  style={[styles.reorderToggle, reorderMode && { backgroundColor: colors.tint }]}
                  onPress={() => setReorderMode(!reorderMode)}
                >
                  <FontAwesome name="sort" size={16} color={reorderMode ? '#fff' : colors.tint} />
                  <Text style={[styles.reorderToggleText, { color: reorderMode ? '#fff' : colors.tint }]}>
                    {reorderMode ? '완료' : '순서 변경'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          libraries.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="folder-open-o" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyText}>암기장이 비어있습니다.</Text>
              <Text style={styles.emptySubText}>새로운 암기장을 만들어보세요!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 4,
    marginBottom: 24,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: '#64748B',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reorderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    marginTop: 4,
  },
  reorderToggleText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  reorderControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  reorderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
