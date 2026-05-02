import { useMemo } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { useFlavorTheme } from '../hooks/useFlavorTheme';

export function useFlavorStackScreenOptions(): NativeStackNavigationOptions {
  const { colors, resolvedScheme } = useFlavorTheme();

  return useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.primary,
      headerTitleStyle: {
        fontWeight: '700',
        color: colors.text,
        fontSize: 17,
      },
      headerShadowVisible: false,
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: colors.background },
      ...(Platform.OS === 'ios'
        ? {
            headerLargeTitleShadowVisible: false,
            headerBlurEffect: resolvedScheme === 'dark' ? 'dark' : 'light',
          }
        : {}),
    }),
    [colors.background, colors.primary, colors.text, resolvedScheme]
  );
}
