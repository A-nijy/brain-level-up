import { StyleSheet, Alert, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Switch, Modal, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { PushNotificationService, PushNotificationSettings } from '@/services/PushNotificationService';
import { Library, Section } from '@/types';

import { usePushSettings } from '@/hooks/usePushSettings';

import { Strings } from '@/constants/Strings';

export default function SettingsScreen() {
  const { signOut, profile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  const {
    notificationSettings,
    libraries,
    sections,
    loadingSections,
    progress,
    fetchSections,
    saveSettings,
    requestPermissions,
    refresh: refreshSettings
  } = usePushSettings();

  // 화면 진입 시마다 진행도 새로고침
  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  // UI State for Modal
  const [tempSettings, setTempSettings] = useState<PushNotificationSettings | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false);
  const [showSectionList, setShowSectionList] = useState(false);

  useEffect(() => {
    if (tempSettings?.libraryId) {
      fetchSections(tempSettings.libraryId);
    }
  }, [tempSettings?.libraryId, fetchSections]);

  // 진행도 100% 도달 시 알림 설정 자동 비활성화 (가드 강화)
  useEffect(() => {
    if (notificationSettings?.enabled && progress && progress.total > 0 && progress.current >= progress.total) {
      console.warn('🎯 [Settings] Progress 100% detected. Preparing to disable notifications.');

      const updateSettings = async () => {
        // 이미 꺼진 상태라면 중복 호출 방지
        const currentSettings = await PushNotificationService.getSettings();
        if (currentSettings && currentSettings.enabled) {
          console.warn('🎯 [Settings] Disabling notifications now.');
          await saveSettings({ ...currentSettings, enabled: false });
          Alert.alert(Strings.common.info, '모든 단어를 학습하여 알림이 종료되었습니다.');
        } else {
          console.warn('🎯 [Settings] Notifications already disabled. Skipping.');
        }
      };
      updateSettings();
    }
  }, [progress, notificationSettings?.enabled]);

  const handleToggleNotification = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value) {
      let granted = false;
      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        granted = await WebPushService.requestPermission();
      } else {
        granted = await requestPermissions();
      }

      if (!granted) {
        Alert.alert(Strings.pushModal.alerts.permissionNeeded);
        return;
      }
      setTempSettings({ ...notificationSettings, enabled: true });
      setShowNotificationModal(true);
    } else {
      const newSettings = { ...notificationSettings, enabled: false };
      await saveSettings(newSettings);
      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        await WebPushService.saveSettings(newSettings);
      }
    }
  };

  const handleOpenSettings = () => {
    if (!notificationSettings) return;
    setTempSettings({ ...notificationSettings });
    setShowNotificationModal(true);
  };

  const handleUpdateTempSettings = (newSettings: Partial<PushNotificationSettings>) => {
    if (!tempSettings) return;
    setTempSettings({ ...tempSettings, ...newSettings });
  };

  const handleSaveSettings = async () => {
    if (!tempSettings) return;

    if (!tempSettings.libraryId) {
      Alert.alert(Strings.common.info, Strings.pushModal.alerts.selectLibrary);
      return;
    }

    // 최소 10분 유효성 검사
    if (!tempSettings.interval || tempSettings.interval < 10) {
      Alert.alert(Strings.common.info, Strings.pushModal.alerts.intervalTooShort);
      return;
    }

    const finalSettings: PushNotificationSettings = {
      ...tempSettings,
      enabled: true,
      libraryId: tempSettings.libraryId,
      sectionId: tempSettings.sectionId ?? null,
    };

    try {
      await saveSettings(finalSettings);

      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        await WebPushService.saveSettings(finalSettings);
      }

      setShowNotificationModal(false);
    } catch (error: any) {
      Alert.alert(Strings.common.error, error.message);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert(Strings.common.error, error.message);
    }
  };

  const handleThemeChange = () => {
    if (Platform.OS === 'web') {
      const options: ThemeMode[] = ['light', 'dark', 'system'];
      const currentIndex = options.indexOf(themeMode);
      const nextIndex = (currentIndex + 1) % options.length;
      setThemeMode(options[nextIndex]);
    } else {
      Alert.alert(
        Strings.settings.themeTitle,
        Strings.settings.themeSubtitle,
        [
          { text: Strings.settings.themeModes.light, onPress: () => setThemeMode('light') },
          { text: Strings.settings.themeModes.dark, onPress: () => setThemeMode('dark') },
          { text: Strings.settings.themeModes.system, onPress: () => setThemeMode('system') },
          { text: Strings.common.cancel, style: 'cancel' }
        ]
      );
    }
  };

  const getThemeText = (mode: ThemeMode) => {
    switch (mode) {
      case 'light': return Strings.settings.themeModes.light;
      case 'dark': return Strings.settings.themeModes.dark;
      case 'system': return Strings.settings.themeModes.system;
    }
  };

  const isWeb = Platform.OS === 'web' && width > 768;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        isWeb && { maxWidth: 800, alignSelf: 'center', width: '100%', paddingVertical: 40 }
      ]}
    >
      <Animated.View entering={FadeIn.duration(800)} style={styles.profileSection}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.7}
        >
          <FontAwesome name={Strings.settings.icons.userCircle as any} size={80} color={colors.tint} />
          <View variant="transparent" style={styles.editBadge}>
            <FontAwesome name={Strings.settings.icons.pencil as any} size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.email}>{profile?.nickname || Strings.settings.guestName}</Text>
        <Text style={[styles.userIdBadge, { color: colors.textSecondary }]}>
          {Strings.settings.idLabel(profile?.user_id_number || '-----')}
        </Text>
      </Animated.View>

      <View variant="transparent" style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{Strings.settings.sectionAccount}</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/settings/profile')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.user as any} size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuProfile}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/settings/notices')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.bullhorn as any} size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuNotice}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/support/new')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.question as any} size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuSupport}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity style={styles.item} onPress={handleSignOut} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.signOut as any} size={18} color={colors.error} />
              </View>
              <Text style={[styles.itemText, { color: colors.error }]}>{Strings.settings.menuSignOut}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{Strings.settings.sectionApp}</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.item} onPress={handleThemeChange} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={(colorScheme === 'dark' ? Strings.settings.icons.themeMoon : Strings.settings.icons.themeSun) as any} size={18} color={colors.tint} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuTheme}</Text>
            </View>
            <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.valueText, { color: colors.textSecondary, marginRight: 8 }]}>{getThemeText(themeMode)}</Text>
              <FontAwesome name="angle-right" size={18} color={colors.border} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <View variant="transparent" style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="bell-o" size={18} color={colors.tint} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuPush}</Text>
            </View>
            <Switch
              value={notificationSettings?.enabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
            />
          </View>

          {notificationSettings?.enabled && (
            <>
              <TouchableOpacity
                style={[styles.item, { paddingTop: 0 }]}
                onPress={handleOpenSettings}
                activeOpacity={0.7}
              >
                <View variant="transparent" style={[styles.itemLeft, { marginLeft: 48 }]}>
                  <Text style={[styles.valueText, { color: colors.textSecondary }]}>{Strings.settings.menuPushDetail}</Text>
                </View>
                <FontAwesome name={Strings.settings.icons.cog as any} size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {progress && (
                <View variant="transparent" style={[styles.item, { paddingTop: 0 }]}>
                  <View variant="transparent" style={[styles.itemLeft, { marginLeft: 48 }]}>
                    <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                      {Strings.settings.studyProgress}: {progress.current}/{progress.total}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <View variant="transparent" style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.info as any} size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuVersion}</Text>
            </View>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>v1.4.3</Text>
          </View>
        </Card>

        <TouchableOpacity
          style={styles.deleteAccount}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.6}
        >
          <Text style={[styles.deleteText, { color: colors.textSecondary }]}>{Strings.settings.menuAccountManage}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{Strings.pushModal.title}</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name={Strings.settings.icons.close as any} size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {tempSettings ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.step1}</Text>
                <TouchableOpacity
                  style={[styles.selectBox, { borderColor: colors.border }]}
                  onPress={() => setShowLibraryList(true)}
                >
                  <Text style={[styles.selectBoxText, { color: tempSettings?.libraryId ? colors.text : colors.textSecondary }]}>
                    {tempSettings?.libraryId
                      ? libraries.find(l => l.id === tempSettings.libraryId)?.title || Strings.pushModal.librarySelected
                      : Strings.pushModal.libraryPlaceholder}
                  </Text>
                  <FontAwesome name={Strings.settings.icons.down as any} size={12} color={colors.textSecondary} />
                </TouchableOpacity>

                {tempSettings?.libraryId && (
                  <>
                    <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.step2}</Text>
                    <TouchableOpacity
                      style={[styles.selectBox, { borderColor: colors.border }]}
                      onPress={() => !loadingSections && setShowSectionList(true)}
                      disabled={loadingSections}
                    >
                      {loadingSections ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <Text style={[styles.selectBoxText, { color: colors.text }]}>
                          {tempSettings.sectionId === 'all' || !tempSettings.sectionId
                            ? Strings.pushModal.sectionAll
                            : sections.find(s => s.id === tempSettings.sectionId)?.title || Strings.pushModal.sectionSelected}
                        </Text>
                      )}
                      <FontAwesome name={Strings.settings.icons.down as any} size={12} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                )}

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelRange}</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: Strings.pushModal.ranges.all, value: 'all' },
                    { label: Strings.pushModal.ranges.learned, value: 'learned' },
                    { label: Strings.pushModal.ranges.confused, value: 'confused' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.range === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ range: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.range === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelFormat}</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: Strings.pushModal.formats.both, value: 'both' },
                    { label: Strings.pushModal.formats.word_only, value: 'word_only' },
                    { label: Strings.pushModal.formats.meaning_only, value: 'meaning_only' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.format === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ format: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.format === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelOrder}</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: Strings.pushModal.orders.sequential, value: 'sequential' },
                    { label: Strings.pushModal.orders.random, value: 'random' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.order === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ order: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.order === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelInterval}</Text>
                <View style={styles.intervalContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border },
                      tempSettings?.interval > 0 && tempSettings.interval < 10 && { borderColor: colors.error },
                    ]}
                    keyboardType="numeric"
                    value={tempSettings?.interval === 0 ? '' : tempSettings?.interval.toString()}
                    onChangeText={(text) =>
                      handleUpdateTempSettings({ interval: text === '' ? 0 : (parseInt(text) || 0) })
                    }
                  />
                  <Text style={{ marginLeft: 12, color: colors.text, fontWeight: '700' }}>
                    {Strings.pushModal.unitInterval}
                  </Text>
                </View>
                {/* 안내 문구: 항상 표시 힘트 + 10분 미만 시 붉은 경고 문구 */}
                {tempSettings?.interval > 0 && tempSettings.interval < 10 ? (
                  <Text style={[styles.intervalHint, { color: colors.error }]}>
                    ⚠️ {Strings.pushModal.alerts.intervalTooShort}
                  </Text>
                ) : (
                  <Text style={[styles.intervalHint, { color: colors.textSecondary }]}>
                    {Strings.pushModal.hintInterval}
                  </Text>
                )}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>{Strings.pushModal.loading}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.tint }]}
              onPress={handleSaveSettings}
            >
              <Text style={styles.confirmButtonText}>{Strings.pushModal.submit}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLibraryList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLibraryList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLibraryList(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.subModalTitle, { color: colors.text }]}>{Strings.pushModal.libraryPlaceholder}</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {libraries.map((lib) => (
                  <TouchableOpacity
                    key={lib.id}
                    style={[
                      styles.listItem,
                      tempSettings?.libraryId === lib.id && { backgroundColor: `${colors.tint}10` }
                    ]}
                    onPress={() => {
                      handleUpdateTempSettings({ libraryId: lib.id, sectionId: 'all' });
                      setShowLibraryList(false);
                    }}
                  >
                    <Text style={[
                      styles.listItemText,
                      { color: colors.text },
                      tempSettings?.libraryId === lib.id && { color: colors.tint, fontWeight: '800' }
                    ]}>
                      {lib.title}
                    </Text>
                    {tempSettings?.libraryId === lib.id && <FontAwesome name={Strings.settings.icons.check as any} size={14} color={colors.tint} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showSectionList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSectionList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSectionList(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.subModalTitle, { color: colors.text }]}>{Strings.pushModal.step2}</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    (tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && { backgroundColor: `${colors.tint}10` }
                  ]}
                  onPress={() => {
                    handleUpdateTempSettings({ sectionId: 'all' });
                    setShowSectionList(false);
                  }}
                >
                  <Text style={[
                    styles.listItemText,
                    { color: colors.text },
                    (tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && { color: colors.tint, fontWeight: '800' }
                  ]}>
                    {Strings.pushModal.sectionAll}
                  </Text>
                  {(tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && <FontAwesome name={Strings.settings.icons.check as any} size={14} color={colors.tint} />}
                </TouchableOpacity>
                {sections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.listItem,
                      tempSettings?.sectionId === section.id && { backgroundColor: `${colors.tint}10` }
                    ]}
                    onPress={() => {
                      handleUpdateTempSettings({ sectionId: section.id });
                      setShowSectionList(false);
                    }}
                  >
                    <Text style={[
                      styles.listItemText,
                      { color: colors.text },
                      tempSettings?.sectionId === section.id && { color: colors.tint, fontWeight: '800' }
                    ]}>
                      {section.title}
                    </Text>
                    {tempSettings?.sectionId === section.id && <FontAwesome name={Strings.settings.icons.check as any} size={14} color={colors.tint} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  email: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  userIdBadge: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    borderRadius: 24,
    paddingHorizontal: 8,
    marginBottom: 32,
    borderWidth: 1.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAccount: {
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // 더 어둡게 하여 잔상 방지
    justifyContent: 'center', // 중앙 정렬로 변경
    padding: 20,
  },
  modalContent: {
    width: '90%', // 너비 확실히 지정
    alignSelf: 'center',
    maxHeight: '85%',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScroll: {
    // flex: 1 removed to allow content to dictate height
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectBox: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectBoxText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  subModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
  },
  subModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  intervalHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 2,
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});
