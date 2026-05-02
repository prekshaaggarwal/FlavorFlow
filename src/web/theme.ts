export type ThemeName = 'dark' | 'light' | 'festive-diwali' | 'festive-xmas';

export type ThemePalette = {
  background: string;
  bgGradient: [string, string];
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  primary: string;
  primaryMuted: string;
  primarySoft: string;
  accent: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderStrong: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  chip: string;
  scrim: string;
  veg: string;
  nonVeg: string;
};

export const palettes: Record<ThemeName, ThemePalette> = {
  dark: {
    background: '#000000',
    bgGradient: ['#0B0B0F', '#000000'],
    surface: '#0A0A0A',
    surfaceElevated: '#121218',
    surfaceHover: '#1A1A22',
    primary: '#FF8A3D',
    primaryMuted: '#E85D04',
    primarySoft: 'rgba(255,138,61,0.18)',
    accent: '#A855F7',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#1E293B',
    borderStrong: '#334155',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    overlay: 'rgba(248, 250, 252, 0.08)',
    chip: 'rgba(255, 138, 61, 0.16)',
    scrim: 'rgba(0,0,0,0.6)',
    veg: '#22C55E',
    nonVeg: '#EF4444',
  },
  light: {
    background: '#F7F7FB',
    bgGradient: ['#FFF8F3', '#F7F7FB'],
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    primary: '#E85D04',
    primaryMuted: '#F48C06',
    primarySoft: 'rgba(232,93,4,0.10)',
    accent: '#7C3AED',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    overlay: 'rgba(15, 23, 42, 0.06)',
    chip: 'rgba(232, 93, 4, 0.10)',
    scrim: 'rgba(15,23,42,0.45)',
    veg: '#16A34A',
    nonVeg: '#DC2626',
  },
  'festive-diwali': {
    background: '#1A0B14',
    bgGradient: ['#3B0F1F', '#1A0B14'],
    surface: '#1E0E18',
    surfaceElevated: '#2A1422',
    surfaceHover: '#3A1B2D',
    primary: '#F59E0B',
    primaryMuted: '#D97706',
    primarySoft: 'rgba(245,158,11,0.20)',
    accent: '#EC4899',
    text: '#FEF3C7',
    textSecondary: '#FCD34D',
    textTertiary: '#FBBF24',
    border: '#4C1D24',
    borderStrong: '#7C2D12',
    success: '#22C55E',
    warning: '#FCD34D',
    danger: '#EF4444',
    overlay: 'rgba(254, 243, 199, 0.08)',
    chip: 'rgba(245,158,11,0.18)',
    scrim: 'rgba(20,5,12,0.6)',
    veg: '#84CC16',
    nonVeg: '#F87171',
  },
  'festive-xmas': {
    background: '#0A1F14',
    bgGradient: ['#0F2A1B', '#0A1F14'],
    surface: '#0E261A',
    surfaceElevated: '#163322',
    surfaceHover: '#1E4530',
    primary: '#DC2626',
    primaryMuted: '#B91C1C',
    primarySoft: 'rgba(220,38,38,0.20)',
    accent: '#FCD34D',
    text: '#ECFCCB',
    textSecondary: '#86EFAC',
    textTertiary: '#4ADE80',
    border: '#14532D',
    borderStrong: '#166534',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    overlay: 'rgba(236, 252, 203, 0.07)',
    chip: 'rgba(220,38,38,0.18)',
    scrim: 'rgba(5,15,10,0.6)',
    veg: '#84CC16',
    nonVeg: '#F87171',
  },
};

export const themeLabels: Record<ThemeName, string> = {
  dark: 'OLED Dark',
  light: 'Daylight',
  'festive-diwali': 'Diwali Glow',
  'festive-xmas': 'Christmas Pine',
};
