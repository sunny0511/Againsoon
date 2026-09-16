import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#161018',
  canvasDeep: '#0C090D',
  ink: '#F8F1E9',
  inkMuted: '#C9B6AE',
  inkSoft: '#8E7874',
  accent: '#E39B7A',
  accentDeep: '#F4B89A',
  accentSoft: '#3D2826',
  sage: '#7DB89A',
  sageSoft: '#1B322C',
  gold: '#E2B56A',
  goldSoft: '#3B2E18',
  us: '#E2B56A',
  usSoft: '#3B2E18',
  card: '#221A22',
  cardElevated: '#2B222B',
  cardBorder: '#403440',
  danger: '#E09090',
  dangerSoft: '#3A2228',
  white: '#F8F1E9',
  onAccent: '#1A1412',
  invert: '#F3EBE2',
  onInvert: '#1A1412',
  highlight: '#2E242E',
  glow: 'rgba(227, 155, 122, 0.18)',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 32,
  pill: 999,
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export const type = {
  displayXl: 36,
  display: 30,
  title: 22,
  body: 16,
  small: 14,
  caption: 12,
  label: 11,
} as const;

export const shadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 18px 44px rgba(8, 5, 10, 0.42)',
  },
  default: {
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
})!;

export const softShadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 8px 24px rgba(8, 5, 10, 0.22)',
  },
  default: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
})!;

export const phoneMaxWidth = 430;

export const ACCENT_PRESETS: {
  id: 'terracotta-sage' | 'blush-sea' | 'honey-plum' | 'coral-dusk';
  label: string;
  me: string;
  them: string;
  us: string;
}[] = [
  { id: 'terracotta-sage', label: 'Terracotta & sage', me: '#E39B7A', them: '#7DB89A', us: '#E2B56A' },
  { id: 'blush-sea', label: 'Blush & sea', me: '#E8A0B4', them: '#6BA3B8', us: '#D4A06A' },
  { id: 'honey-plum', label: 'Honey & plum', me: '#E0B25C', them: '#9B7BB0', us: '#E39B7A' },
  { id: 'coral-dusk', label: 'Coral & dusk', me: '#E07A6A', them: '#7A90B8', us: '#E2B56A' },
];
