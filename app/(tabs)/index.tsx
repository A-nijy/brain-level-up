import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, RefreshControl, ActivityIndicator, Image, Platform, useWindowDimensions, TouchableOpacity, Modal, TextInput, View as RNView } from 'react-native';
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
import { useAlert } from '@/contexts/AlertContext';
import { useLibraryActions } from '@/hooks/useLibraryActions';

import { Strings } from '@/constants/Strings';
import { Tabs } from 'expo-router';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

/**
 * [Local-Only] 홈 화면 (나의 암기장 리스트)
 * 광고 및 서버 동기화 로직이 모두 제거된 로컬 전용 버전
 */
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export default function LibraryListScreen() {
  const { libraries, loading, refreshing, refresh, reorderLibraries, deleteLibrary } = useLibraries();
  const { profile, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const { showAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useUnreadNotifications();
  
  const {
    reorderMode,
    setReorderMode,
    selectedLibraryForMenu,
    setSelectedLibraryForMenu,
    handleEditLibrary,
    handleDeleteLibrary,
    handleCreateLibrary,
    showLibraryOptions,
  } = useLibraryActions(libraries, reorderLibraries, deleteLibrary, profile, user?.id);

  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 768 ? 2 : 1;

  // [Optimization] 검색 필터링 결과 메모이제이션
  const filteredLibraries = useMemo(() => 
    libraries.filter(lib => lib.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [libraries, searchQuery]
  );

  const key = `list-${numColumns}-${reorderMode}`;

  // [Optimization] 개별 아이템 컴포넌트 메모이제이션
  const LibraryItem = React.memo(({ item, drag, isActive, colors, reorderMode, numColumns, router, showLibraryOptions }: any) => (
    <ScaleDecorator>
      <Animated.View
        entering={FadeInUp.delay(100)}
        style={[
          styles.cardContainer,
          numColumns > 1 && { width: '48%', marginHorizontal: '1%' },
          isActive && { opacity: 0.9, elevation: 10, shadowOpacity: 0.3 }
        ]}
      >
        <Card
          style={[
              styles.card, 
              isActive && { backgroundColor: colors.tint + '10', borderColor: colors.tint }
          ]}
          onPress={reorderMode ? undefined : () => router.push({
            pathname: "/library/[id]",
            params: { id: item.id, title: item.title }
          })}
          onLongPress={reorderMode ? drag : undefined}
          delayLongPress={100}
          activeOpacity={reorderMode ? 1 : 0.7}
        >
          <View variant="transparent" style={styles.cardHeader}>
            <View variant="transparent" style={styles.iconContainer}>
              <Image
                source={{ uri: Strings.home.images.libraryDefault }}
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
                <FontAwesome name={Strings.home.icons.more as any} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {reorderMode && (
              <View variant="transparent" style={{ padding: 10 }}>
                 <FontAwesome name="bars" size={16} color={colors.border} />
              </View>
            )}
          </View>

          <View variant="transparent" style={styles.footerRow}>
            <View variant="transparent" style={styles.stat}>
              <FontAwesome name={Strings.home.icons.items as any} size={12} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.items_count || 0} {Strings.common.unitWord}</Text>
            </View>
            <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View variant="transparent" style={styles.stat}>
                <FontAwesome name={Strings.home.icons.date as any} size={12} color={colors.textSecondary} />
                <Text style={styles.statText}>
                  {new Date(item.created_at || Date.now()).toLocaleDateString()}
                </Text>
              </View>
              {!reorderMode && <FontAwesome name={Strings.home.icons.arrowRight as any} size={18} color={colors.textSecondary} />}
            </View>
          </View>
        </Card>
      </Animated.View>
    </ScaleDecorator>
  ));

  const renderItem = React.useCallback((params: RenderItemParams<Library>) => (
    <LibraryItem 
      {...params} 
      colors={colors} 
      reorderMode={reorderMode} 
      numColumns={numColumns}
      router={router}
      showLibraryOptions={showLibraryOptions}
    />
  ), [colors, reorderMode, numColumns, router, showLibraryOptions]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: 6 }}>
                <View variant="transparent" style={{ position: 'relative' }}>
                  <FontAwesome
                    name="bell-o"
                    size={20}
                    color={colors.text}
                  />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: colors.error,
                      borderRadius: 10,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 4
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReorderMode(!reorderMode)}
                style={{ padding: 6, marginHorizontal: 12 }}
              >
                <FontAwesome
                  name={Strings.common.icons.sort as any}
                  size={20}
                  color={reorderMode ? colors.tint : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCreateLibrary} style={{ padding: 6 }}>
                <FontAwesome
                  name="plus"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <DraggableFlatList
        key={key}
        data={filteredLibraries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        onDragEnd={({ data }) => reorderLibraries(data)}
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
              <View variant="transparent" style={[styles.greetingRow, { marginBottom: 10 }]}>
                <View variant="transparent">
                  <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 400 }]}>
                    <FontAwesome name="search" size={14} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder={Strings.home.searchPlaceholder}
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <View variant="transparent" style={styles.sectionHeader}>
                <View variant="transparent" style={{ flex: 1 }} />
                <View variant="transparent" style={{ flexDirection: 'row', gap: 12, marginLeft: 20 }}>
                  <TouchableOpacity style={styles.webAddBtn} onPress={handleCreateLibrary}>
                    <LinearGradient
                      colors={[colors.tint, colors.tint + 'CC']}
                      style={styles.webAddBtnGradient}
                    >
                      <FontAwesome name={Strings.common.icons.add as any} size={14} color="#fff" />
                      <Text style={styles.webAddBtnText}>{Strings.home.newLibrary}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View variant="transparent" style={styles.mobileHeaderContainer}>
              <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginBottom: 20 }]}>
                <FontAwesome name="search" size={14} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={Strings.home.searchPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="search" size={48} color={colors.textSecondary} style={{ opacity: 0.2, marginBottom: 20 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>검색 결과가 없습니다</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>'{searchQuery}'와 일치하는 암기장을 찾을 수 없습니다.</Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: colors.border, marginTop: 10 }]}
                onPress={() => setSearchQuery('')}
              >
                <Text style={[styles.emptyAddBtnText, { color: colors.text }]}>검색 초기화</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.emptyLogo}
                resizeMode="contain"
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{Strings.home.sectionTitle}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{Strings.home.emptyPrompt}</Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/library/create')}
              >
                <FontAwesome name={Strings.common.icons.add as any} size={14} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.emptyAddBtnText}>{Strings.home.newLibrary}</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {selectedLibraryForMenu && (
        <Modal
          transparent
          visible={!!selectedLibraryForMenu}
          animationType="fade"
          onRequestClose={() => setSelectedLibraryForMenu(null)}
        >
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]}
            onPress={() => setSelectedLibraryForMenu(null)}
            activeOpacity={1}
          >
            <View
              style={[
                styles.webActionMenu,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  alignSelf: 'center',
                  top: '40%'
                }
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleEditLibrary(selectedLibraryForMenu.id, selectedLibraryForMenu.title);
                  setSelectedLibraryForMenu(null);
                }}
              >
                <FontAwesome name="pencil" size={16} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{Strings.home.editAction}</Text>
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  showAlert({
                    title: Strings.common.deleteConfirmTitle,
                    message: Strings.common.deleteConfirmMsg,
                    buttons: [
                      { text: Strings.common.cancel, style: 'cancel' },
                      {
                        text: Strings.common.delete,
                        style: 'destructive',
                        onPress: () => handleDeleteLibrary(selectedLibraryForMenu.id)
                      }
                    ]
                  });
                  setSelectedLibraryForMenu(null);
                }}
              >
                <FontAwesome name="trash" size={16} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>{Strings.home.deleteAction}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  mobileHeaderContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  webAddBtn: {
    borderRadius: 14,
    overflow: 'hidden',
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
  reorderControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
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
  },
  webActionMenu: {
    position: 'absolute',
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyLogo: {
    width: 160,
    height: 160,
    marginBottom: 24,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    opacity: 0.7,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
