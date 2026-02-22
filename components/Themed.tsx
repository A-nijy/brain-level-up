/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, TouchableOpacity as DefaultTouchableOpacity, ColorValue, TouchableOpacityProps, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'] & { type?: 'default' | 'title' | 'subtitle' | 'link' };
export type ViewProps = ThemeProps & DefaultView['props'] & { variant?: 'default' | 'card' | 'transparent' };
export type CardProps = ThemeProps & TouchableOpacityProps;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
): string {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName] as string;
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, type = 'default', ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const secondaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'textSecondary');
  const tintColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');

  let textStyle = {};
  switch (type) {
    case 'title':
      textStyle = { fontSize: 20, fontWeight: 'bold', color };
      break;
    case 'subtitle':
      textStyle = { fontSize: 14, color: secondaryColor };
      break;
    case 'link':
      textStyle = { fontSize: 16, color: tintColor };
      break;
    default:
      textStyle = { fontSize: 16, color };
  }

  return <DefaultText style={StyleSheet.flatten([textStyle, style])} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, variant = 'default', ...otherProps } = props;

  let backgroundColor: ColorValue;
  if (variant === 'transparent') {
    backgroundColor = 'transparent';
  } else {
    backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, variant === 'card' ? 'cardBackground' : 'background');
  }

  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  const variantStyles = variant === 'card' ? {
    borderRadius: 16,
    borderWidth: 1,
    borderColor,
  } : {};

  return <DefaultView style={StyleSheet.flatten([{ backgroundColor }, variantStyles, style])} {...otherProps} />;
}

export function Card(props: CardProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <DefaultTouchableOpacity
      style={StyleSheet.flatten([
        {
          backgroundColor,
          borderRadius: 16,
          borderWidth: 1,
          borderColor,
          padding: 16,
        },
        style
      ])}
      activeOpacity={0.7}
      {...otherProps}
    />
  );
}
