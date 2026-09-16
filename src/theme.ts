import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#10141C',
  canvasDeep: '#0B0E14',
  ink: '#F4EFE6',
  inkMuted: '#B9B3C4',
  inkSoft: '#7F7788',
  accent: '#E8A56A',
  accentDeep: '#F0C08A',
  accentSoft: '#3A2A22',
  sage: '#5FBFB0',
  sageSoft: '#16332F',
  gold: '#E0B25C',
  goldSoft: '#3A2E1C',
  card: '#1A1F2A',
  cardBorder: '#2C3342',
  danger: '#E08A8A',
  dangerSoft: '#3A2228',
  white: '#F4EFE6',
  onAccent: '#141018',
  invert: '#F3EBE3',
  onInvert: '#10141C',
  highlight: '#242A36',
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
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
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
