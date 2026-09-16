import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#17121C',
  canvasDeep: '#100D14',
  ink: '#F6EFE8',
  inkMuted: '#C4B4C0',
  inkSoft: '#8B7A88',
  accent: '#E08A6A',
  accentDeep: '#F0A790',
  accentSoft: '#3A2430',
  sage: '#7CBA9F',
  sageSoft: '#1E322C',
  gold: '#E0B25C',
  goldSoft: '#3A2E1C',
  card: '#231B28',
  cardBorder: '#3C3244',
  danger: '#E08A8A',
  dangerSoft: '#3A2228',
  white: '#F6EFE8',
  onAccent: '#1A141F',
  invert: '#F3EBE3',
  onInvert: '#1A141F',
  highlight: '#2F2434',
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
  lg: 28,
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

export const shadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
  },
  default: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
})!;

export const phoneMaxWidth = 430;
