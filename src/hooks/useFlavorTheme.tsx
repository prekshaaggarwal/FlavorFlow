import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import { darkColors, lightColors, ThemeColors } from '../theme/colors';

const STORAGE_KEY = 'flavorflow:theme';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeCtx = {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  colors: ThemeColors;
  setPreference: (p: ThemePreference) => Promise<void>;
};

const FlavorThemeContext = createContext<ThemeCtx | null>(null);

function resolve(system: ColorSchemeName, pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return system === 'dark' ? 'dark' : 'light';
  return pref;
}

export function FlavorThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPrefState] = useState<ThemePreference>('dark');
  const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (
        stored === 'light' ||
        stored === 'dark' ||
        stored === 'system'
      ) {
        setPrefState(stored);
      }
    });
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPrefState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const resolvedScheme = resolve(system ?? 'light', preference);
  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      colors,
      setPreference,
    }),
    [preference, resolvedScheme, colors, setPreference]
  );

  return (
    <FlavorThemeContext.Provider value={value}>
      {children}
    </FlavorThemeContext.Provider>
  );
}

export function useFlavorTheme() {
  const ctx = useContext(FlavorThemeContext);
  if (!ctx) throw new Error('useFlavorTheme must be used within FlavorThemeProvider');
  return ctx;
}
