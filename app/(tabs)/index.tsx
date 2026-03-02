import React, { useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image, Platform, useWindowDimensions, TouchableOpacity, Modal, TextInput, Pressable, View as RNView } from 'react-native';
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

export default function LibraryListScreen() {
  const { libraries, loading, refreshing, refresh, reorderLibraries, deleteLibrary } = useLibraries();
  const { stats, totals, streak } = useStudyStats();
  const { profile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width, height } = useWindowDimensions();
  const { showAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    reorderMode,
    setReorderMode,
    selectedLibraryForMenu,
    setSelectedLibraryForMenu,
    menuPosition,
    handleMoveUp,
    handleMoveDown,
    handleEditLibrary,
    handleDeleteLibrary,
    showLibraryOptions
  } = useLibraryActions(libraries, reorderLibraries, deleteLibrary);

  // 웹과 데스크톱 환경을 위한 그리드 설정
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 768 ? 2 : 1;

  const filteredLibraries = libraries.filter(lib =>
    lib.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const key = `list-${numColumns}-${reorderMode}`;


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
        onPress={reorderMode ? undefined : () => router.push({
          pathname: "/library/[id]",
          params: { id: item.id, title: item.title }
        })}
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
            <FontAwesome name={Strings.home.icons.arrowRight as any} size={18} color={colors.textSecondary} />
          </View>
        </View>

        {reorderMode && (
          <View variant="transparent" style={styles.reorderControls}>
            <TouchableOpacity
              style={[styles.reorderButton, index === 0 && { opacity: 0.3 }]}
              onPress={() => handleMoveUp(index)}
              disabled={index === 0}
            >
              <FontAwesome name={Strings.home.icons.up as any} size={16} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, index === libraries.length - 1 && { opacity: 0.3 }]}
              onPress={() => handleMoveDown(index)}
              disabled={index === libraries.length - 1}
            >
              <FontAwesome name={Strings.home.icons.down as any} size={16} color={colors.tint} />
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
        data={filteredLibraries}
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
              {/* Web Header Space Info Removed */}
              <View variant="transparent" style={[styles.greetingRow, { marginBottom: 10 }]}>
                <View variant="transparent">
                  {/* Web Search Bar Only */}
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
                <View variant="transparent" style={{ flex: 1 }}>
                  <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View variant="transparent">
                      <Text style={styles.sectionTitle}>{Strings.home.sectionTitle}</Text>
                      <View style={[styles.titleUnderline, { backgroundColor: colors.tint }]} />
                    </View>
                  </View>
                </View>

                <View variant="transparent" style={{ flexDirection: 'row', gap: 12, marginLeft: 20 }}>
                  <TouchableOpacity
                    style={[
                      styles.reorderToggle,
                      reorderMode && { backgroundColor: colors.tint + '10', borderColor: colors.tint }
                    ]}
                    onPress={() => setReorderMode(!reorderMode)}
                  >
                    <FontAwesome name="sort" size={14} color={reorderMode ? colors.tint : colors.textSecondary} />
                    <Text style={[styles.reorderToggleText, { color: reorderMode ? colors.tint : colors.textSecondary }]}>
                      {reorderMode ? Strings.home.reorderDone : Strings.home.reorderStart}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.webAddBtn} onPress={() => router.push('/library/create')}>
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
              {/* Mobile Greeting removed */}
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

              <View variant="transparent" style={styles.sectionHeader}>
                <View variant="transparent">
                  <Text style={styles.sectionTitle}>{Strings.home.sectionTitle}</Text>
                  <View style={[styles.titleUnderline, { backgroundColor: colors.tint }]} />
                </View>
                <TouchableOpacity
                  style={[
                    styles.reorderToggle,
                    reorderMode && { backgroundColor: colors.tint + '10', borderColor: colors.tint }
                  ]}
                  onPress={() => setReorderMode(!reorderMode)}
                >
                  <FontAwesome name="sort" size={14} color={reorderMode ? colors.tint : colors.textSecondary} />
                </TouchableOpacity>
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
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>첫 번째 암기장을 만들어 학습을 시작해보세요!</Text>
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
  mobileGreeting: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  mobileSubtext: {
    fontSize: 14,
    marginBottom: 16,
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
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
