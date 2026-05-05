import { StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Switch, Modal, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { PushNotificationService } from '@/services/PushNotificationService';
import { NotificationSettings, NotificationRange } from '@/services/NotificationCommonService';
import * as Google from 'expo-auth-session/providers/google';
import { BackupService } from '@/services/BackupService';
import Constants from 'expo-constants';

import { usePushSettings } from '@/hooks/usePushSettings';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

/**
 * [Local-Only] 설정 페이지
 * 서버 의존적인 계정/프로필 섹션을 제거하고 백업 및 데이터 관리 중심으로 재구성됨
 */
export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const { showAlert } = useAlert();

  const {
    notificationSettings,
    libraries,
    sections,
    loadingSections,
    progress,
    fetchSections,
    saveSettings,
    requestPermissions,
    checkAndRequestBatteryOptimization,
    refresh: refreshSettings
  } = usePushSettings();

  // --- Google Drive Backup Setup ---
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const token = await BackupService.getAccessToken(request, response, promptAsync);
      if (!token) {
        showAlert({ title: Strings.common.warning, message: Strings.backup.loginRequired });
        return;
      }

      await BackupService.backup(token);
      showAlert({ title: Strings.common.success, message: Strings.backup.backupSuccess });
    } catch (error: any) {
      showAlert({ title: Strings.common.error, message: error.message });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    try {
      showAlert({
        title: Strings.backup.title,
        message: Strings.backup.confirmRestore,
        buttons: [
          {
            text: Strings.common.confirm,
            onPress: async () => {
              setIsRestoring(true);
              try {
                const token = await BackupService.getAccessToken(request, response, promptAsync);
                if (!token) {
                  showAlert({ title: Strings.common.warning, message: Strings.backup.loginRequired });
                  return;
                }

                await BackupService.restore(token);
                showAlert({ 
                  title: Strings.common.success, 
                  message: Strings.backup.restoreSuccess,
                });
              } catch (error: any) {
                showAlert({ title: Strings.common.error, message: error.message });
              } finally {
                setIsRestoring(false);
              }
            }
          },
          { text: Strings.common.cancel, style: 'cancel' }
        ]
      });
    } catch (error: any) {
      showAlert({ title: Strings.common.error, message: error.message });
    }
  };
  // ---------------------------------

  // 화면 진입 시마다 진행도 새로고침
  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  // UI State for Notification Modal
  const [tempSettings, setTempSettings] = useState<NotificationSettings | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false);
  const [showSectionList, setShowSectionList] = useState(false);

  useEffect(() => {
    if (tempSettings?.libraryId) {
      fetchSections(tempSettings.libraryId);
    }
  }, [tempSettings?.libraryId, fetchSections]);

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
        showAlert({ title: Strings.common.warning, message: Strings.pushModal.alerts.permissionNeeded });
        return;
      }

      const isOptimizationBypassed = await checkAndRequestBatteryOptimization();
      if (!isOptimizationBypassed) {
         showAlert({ 
           title: Strings.common.info, 
           message: '지연 없는 정확한 단어 알림을 위해 배터리 최적화를 "제한 없음"으로 설정해주세요.' 
         });
         return;
      }

      const initialRanges = notificationSettings.ranges?.length ? notificationSettings.ranges : (['all'] as NotificationRange[]);
      setTempSettings({ ...notificationSettings, enabled: true, ranges: initialRanges });
      setShowNotificationModal(true);
    } else {
      const newSettings = { ...notificationSettings, enabled: false };
      await saveSettings(newSettings);
    }
  };

  const handleOpenSettings = () => {
    if (!notificationSettings) return;
    const initialRanges = notificationSettings.ranges?.length ? notificationSettings.ranges : (['all'] as NotificationRange[]);
    setTempSettings({ ...notificationSettings, ranges: initialRanges });
    setShowNotificationModal(true);
  };

  const handleSaveSettings = async () => {
    if (!tempSettings) return;

    if (!tempSettings.libraryId) {
      showAlert({ title: Strings.common.info, message: Strings.pushModal.alerts.selectLibrary });
      return;
    }

    if (!tempSettings.interval || tempSettings.interval < 5) {
      showAlert({ title: Strings.common.info, message: Strings.pushModal.alerts.intervalTooShort });
      return;
    }

    const finalSettings: NotificationSettings = {
      ...tempSettings,
      enabled: true,
      libraryId: tempSettings.libraryId,
      sectionId: tempSettings.sectionId ?? null,
    };

    try {
      await saveSettings(finalSettings);
      setShowNotificationModal(false);
    } catch (error: any) {
      showAlert({ title: Strings.common.error, message: error.message });
    }
  };

  const handleThemeChange = () => {
    if (Platform.OS === 'web') {
      const options: ThemeMode[] = ['light', 'dark', 'system'];
      const currentIndex = options.indexOf(themeMode);
      const nextIndex = (currentIndex + 1) % options.length;
      setThemeMode(options[nextIndex]);
    } else {
      showAlert({
        title: Strings.settings.themeTitle,
        message: Strings.settings.themeSubtitle,
        buttons: [
          { text: Strings.settings.themeModes.light, onPress: () => setThemeMode('light') },
          { text: Strings.settings.themeModes.dark, onPress: () => setThemeMode('dark') },
          { text: Strings.settings.themeModes.system, onPress: () => setThemeMode('system') },
          { text: Strings.common.cancel, style: 'cancel' }
        ]
      });
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
        styles.scrollContent,
        isWeb && { maxWidth: 800, alignSelf: 'center', width: '100%', paddingVertical: 40 }
      ]}
    >
      <View variant="transparent" style={styles.headerSpacer} />

      <View variant="transparent" style={styles.content}>
        {/* 백업 및 데이터 섹션 */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>백업 및 데이터 관리</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.item} 
            onPress={handleBackup} 
            disabled={isBackingUp}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                {isBackingUp ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <FontAwesome name="cloud-upload" size={18} color={colors.tint} />
                )}
              </View>
              <Text style={styles.itemText}>{Strings.backup.btnBackup}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity 
            style={styles.item} 
            onPress={handleRestore} 
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                {isRestoring ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <FontAwesome name="cloud-download" size={18} color={colors.tint} />
                )}
              </View>
              <Text style={styles.itemText}>{Strings.backup.btnRestore}</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>
        </Card>

        {/* 앱 환경 설정 섹션 */}
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
            </>
          )}
        </Card>

        {/* 정보 섹션 */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>앱 정보</Text>
        <Card style={styles.menuCard}>
          <View variant="transparent" style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={Strings.settings.icons.info as any} size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>{Strings.settings.menuVersion}</Text>
            </View>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </Card>

        <View variant="transparent" style={{ height: 40 }} />
      </View>

      {/* 알림 설정 모달 (기존 코드 유지) */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{Strings.pushModal.title}</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name={Strings.settings.icons.close as any} size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {tempSettings ? (
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.step1}</Text>
                <TouchableOpacity style={[styles.selectBox, { borderColor: colors.border }]} onPress={() => setShowLibraryList(true)}>
                  <Text style={[styles.selectBoxText, { color: tempSettings?.libraryId ? colors.text : colors.textSecondary }]}>
                    {tempSettings?.libraryId ? libraries.find(l => l.id === tempSettings.libraryId)?.title || Strings.pushModal.librarySelected : Strings.pushModal.libraryPlaceholder}
                  </Text>
                  <FontAwesome name={Strings.settings.icons.down as any} size={12} color={colors.textSecondary} />
                </TouchableOpacity>

                {tempSettings?.libraryId && (
                  <>
                    <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.step2}</Text>
                    <TouchableOpacity style={[styles.selectBox, { borderColor: colors.border }]} onPress={() => !loadingSections && setShowSectionList(true)} disabled={loadingSections}>
                      {loadingSections ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <Text style={[styles.selectBoxText, { color: colors.text }]}>
                          {tempSettings.sectionId === 'all' || !tempSettings.sectionId ? Strings.pushModal.sectionAll : sections.find(s => s.id === tempSettings.sectionId)?.title || Strings.pushModal.sectionSelected}
                        </Text>
                      )}
                      <FontAwesome name={Strings.settings.icons.down as any} size={12} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                )}

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelRange}</Text>
                <View style={styles.chipContainer}>
                  {[{ label: Strings.pushModal.ranges.all, value: 'all' }, { label: Strings.pushModal.ranges.learned, value: 'learned' }, { label: Strings.pushModal.ranges.confused, value: 'confused' }, { label: Strings.pushModal.ranges.undecided, value: 'undecided' }].map((opt) => {
                    const isSelected = tempSettings?.ranges?.includes(opt.value as any);
                    return (
                      <TouchableOpacity key={opt.value} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }, isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }]} onPress={() => {
                        let newRanges: NotificationRange[] = [...(tempSettings.ranges || [])];
                        const value = opt.value as NotificationRange;
                        if (value === 'all') newRanges = ['all'];
                        else {
                          newRanges = newRanges.filter(r => r !== 'all');
                          if (newRanges.includes(value)) {
                            newRanges = newRanges.filter(r => r !== value);
                            if (newRanges.length === 0) newRanges = ['all'];
                          } else newRanges.push(value);
                        }
                        setTempSettings({ ...tempSettings, ranges: newRanges });
                      }}>
                        <Text style={[styles.chipText, { color: colors.text }, isSelected && { color: '#fff' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.modalLabel, { color: colors.text }]}>{Strings.pushModal.labelInterval}</Text>
                <View style={styles.intervalContainer}>
                  <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} keyboardType="numeric" value={tempSettings?.interval === 0 ? '' : tempSettings?.interval.toString()} onChangeText={(text) => setTempSettings({ ...tempSettings, interval: text === '' ? 0 : (parseInt(text) || 0) })} />
                  <Text style={{ marginLeft: 12, color: colors.text, fontWeight: '700' }}>{Strings.pushModal.unitInterval}</Text>
                </View>
              </ScrollView>
            ) : <ActivityIndicator size="large" color={colors.tint} />}

            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.tint }]} onPress={handleSaveSettings}>
              <Text style={styles.confirmButtonText}>{Strings.pushModal.submit}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 하위 선택 모달 (기존 코드 유지) */}
      <Modal visible={showLibraryList} transparent={true} animationType="fade" onRequestClose={() => setShowLibraryList(false)}>
        <TouchableWithoutFeedback onPress={() => setShowLibraryList(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.subModalTitle, { color: colors.text }]}>{Strings.pushModal.libraryPlaceholder}</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {libraries.map((lib) => (
                  <TouchableOpacity key={lib.id} style={[styles.listItem, tempSettings?.libraryId === lib.id ? { backgroundColor: `${colors.tint}20` } : { backgroundColor: colors.background }]} onPress={() => { setTempSettings({ ...tempSettings!, libraryId: lib.id, sectionId: 'all' }); setShowLibraryList(false); }}>
                    <Text style={[styles.listItemText, { color: colors.text }, tempSettings?.libraryId === lib.id && { color: colors.tint, fontWeight: '800' }]}>{lib.title}</Text>
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
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerSpacer: { height: 40 },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, marginLeft: 8, marginTop: 24, opacity: 0.8 },
  menuCard: { borderRadius: 24, padding: 4, overflow: 'hidden', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, height: 64 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemText: { fontSize: 16, fontWeight: '600' },
  valueText: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalScroll: { flex: 1 },
  modalLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
  selectBox: { height: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectBoxText: { fontSize: 15, fontWeight: '600' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: '700' },
  intervalContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, height: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontWeight: 'bold' },
  confirmButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  subModalContent: { width: '100%', borderRadius: 24, padding: 20, borderWidth: 1 },
  subModalTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  listItem: { padding: 16, borderRadius: 12, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemText: { fontSize: 15, fontWeight: '600' },
});
