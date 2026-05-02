import { Platform, ViewStyle } from 'react-native';

/** Soft elevation tuned for OLED dark and airy light shells */
export function cardShadow(scheme: 'light' | 'dark'): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: scheme === 'dark' ? 6 : 3 };
  }
  return {
    shadowColor: scheme === 'dark' ? '#000000' : '#0f172a',
    shadowOpacity: scheme === 'dark' ? 0.42 : 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  };
}
