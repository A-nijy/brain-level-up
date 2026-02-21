import React, { useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image, Platform, useWindowDimensions, TouchableOpacity, Alert, ActionSheetIOS, Modal, TextInput, Pressable, View as RNView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLibraries } from '@/hooks/useLibraries';
import { Library } from '@/types';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudyStats } from '@/hooks/useStudyStats';

export default function LibraryListScreen() {
  const { libraries, loading, refreshing, refresh, reorderLibraries, deleteLibrary } = useLibraries();
  const { stats, totals, streak } = useStudyStats();
  const [reorderMode, setReorderMode] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width, height } = useWindowDimensions();

  const [selectedLibraryForMenu, setSelectedLibraryForMenu] = useState<Library | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // 웹과 데스크톱 환경을 위한 그리드 설정
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 768 ? 2 : 1;
  const key = `list-${numColumns}-${reorderMode}`;

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

  const handleEditLibrary = (libraryId: string) => {
    router.push({
      pathname: "/library/edit",
      params: { id: libraryId }
    });
  };

  const handleDeleteLibrary = async (libraryId: string) => {
    try {
      await deleteLibrary(libraryId);
      if (Platform.OS === 'web') window.alert('암기장이 삭제되었습니다.');
      else Alert.alert('성공', '암기장이 삭제되었습니다.');
    } catch (error: any) {
      console.error(error);
      if (Platform.OS === 'web') window.alert(`삭제 실패: ${error.message}`);
      else Alert.alert('오류', error.message);
    }
  };

  const showLibraryOptions = (library: Library, event: any) => {
    if (reorderMode) return;

    if (Platform.OS === 'web') {
      const { pageX, pageY } = event.nativeEvent;
      setMenuPosition({ x: pageX, y: pageY });
      setSelectedLibraryForMenu(library);
    } else if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '수정', '삭제'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: library.title,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEditLibrary(library.id);
          else if (buttonIndex === 2) handleDeleteLibrary(library.id);
        }
      );
    } else {
      Alert.alert(
        '암기장 설정',
        library.title,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제', style: 'destructive', onPress: () => {
              Alert.alert('삭제 확인', '정말 삭제하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '삭제', style: 'destructive', onPress: () => handleDeleteLibrary(library.id) }
              ]);
            }
          },
          { text: '수정', onPress: () => handleEditLibrary(library.id) },
        ]
      );
    }
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
          <View variant="transparent" style={styles.iconContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3389/3389081.png' }}
              style={{ width: 22, height: 22, tintColor: colors.tint }}
            />
          </View>
          <View variant="transparent" style={styles.titleContainer}>
            <Text type="title" style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.category && (
              <Text style={[styles.categoryText, { color: colors.tint }]} numberOfLines={1}>{item.category}</Text>
            )}
          </View>
          {!reorderMode && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={(e) => showLibraryOptions(item, e)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="ellipsis-v" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View variant="transparent" style={styles.cardBody}>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description || '작성된 설명이 없습니다.'}
          </Text>
        </View>

        <View variant="transparent" style={styles.footerRow}>
          <View variant="transparent" style={styles.stat}>
            <FontAwesome name="file-text-o" size={12} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.items_count || 0} 단어</Text>
          </View>
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
          isWeb ? (
            <View variant="transparent" style={styles.webHeaderContainer}>
              <View variant="transparent" style={styles.greetingRow}>
                <View variant="transparent">
                  <Text style={styles.webGreeting}>안녕하세요, {profile?.nickname || profile?.email?.split('@')[0] || '사용자'}님! 👋</Text>
                  <Text style={[styles.webSubtext, { color: colors.textSecondary }]}>오늘도 목표를 달성하고 지식을 쌓아보세요.</Text>
                </View>
              </View>

              <View variant="transparent" style={styles.sectionHeader}>
                <View variant="transparent">
                  <Text style={styles.sectionTitle}>나의 암기장</Text>
                  <View style={[styles.titleUnderline, { backgroundColor: colors.tint }]} />
                </View>
                <View variant="transparent" style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.reorderToggle,
                      reorderMode && { backgroundColor: colors.tint + '10', borderColor: colors.tint }
                    ]}
                    onPress={() => setReorderMode(!reorderMode)}
                  >
                    <FontAwesome name="sort" size={14} color={reorderMode ? colors.tint : colors.textSecondary} />
                    <Text style={[styles.reorderToggleText, { color: reorderMode ? colors.tint : colors.textSecondary }]}>
                      {reorderMode ? '순서 완료' : '순서 변경'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.webAddBtn} onPress={() => router.push('/library/create')}>
                    <LinearGradient
                      colors={[colors.tint, colors.tint + 'CC']}
                      style={styles.webAddBtnGradient}
                    >
                      <FontAwesome name="plus" size={14} color="#fff" />
                      <Text style={styles.webAddBtnText}>새 암기장</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {selectedLibraryForMenu && (
        <Modal
          transparent
          visible={!!selectedLibraryForMenu}
          animationType="fade"
          onRequestClose={() => setSelectedLibraryForMenu(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedLibraryForMenu(null)}
          >
            <RNView
              style={[
                styles.webActionMenu,
                {
                  top: Math.min(menuPosition.y, height - 150),
                  left: Math.min(menuPosition.x - 140, width - 180),
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border
                }
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleEditLibrary(selectedLibraryForMenu.id);
                  setSelectedLibraryForMenu(null);
                }}
              >
                <FontAwesome name="pencil" size={16} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>수정하기</Text>
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (window.confirm('정말 삭제하시겠습니까?')) {
                    handleDeleteLibrary(selectedLibraryForMenu.id);
                  }
                  setSelectedLibraryForMenu(null);
                }}
              >
                <FontAwesome name="trash" size={16} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>삭제하기</Text>
              </TouchableOpacity>
            </RNView>
          </Pressable>
        </Modal>
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
    paddingBottom: 40,
  },
  webHeaderContainer: {
    marginBottom: 32,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  webGreeting: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  webSubtext: {
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  titleUnderline: {
    height: 4,
    width: 40,
    borderRadius: 2,
  },
  webAddBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  webAddBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  webAddBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    height: 180,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 12,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  reorderToggleText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  webActionMenu: {
    position: 'absolute',
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
    opacity: 0.5,
  }
});
