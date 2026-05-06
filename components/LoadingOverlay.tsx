import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Modal, Text, Animated, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  timeout?: number; // 밀리초 단위 (기본 30초)
  onTimeout?: () => void;
}

/**
 * 전역 로딩 오버레이 컴포넌트
 * - 화면 조작을 차단하고 로딩 상태를 표시
 * - 타임아웃 설정을 통한 무한 로딩 방지
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = '처리 중입니다...', 
  timeout = 30000, 
  onTimeout 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 무한 로딩 방지 타이머
      timer = setTimeout(() => {
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
    } else {
      fadeAnim.setValue(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, timeout, onTimeout]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.container, 
          { 
            backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            opacity: fadeAnim,
            borderColor: colors.border,
            borderWidth: 1
          }
        ]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
            잠시만 기다려 주세요
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  message: {
    marginTop: 20,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
