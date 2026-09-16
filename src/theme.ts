export const colors = {
  canvas: '#F4EBE3',
  canvasDeep: '#E9DCD0',
  ink: '#2A1F1A',
  inkMuted: '#6F5F56',
  inkSoft: '#A3948C',
  accent: '#C45D42',
  accentDeep: '#A34832',
  accentSoft: '#F3D5CB',
  sage: '#4F6F62',
  sageSoft: '#D7E4DC',
  gold: '#C9954A',
  goldSoft: '#F3E4C8',
  card: '#FFF9F4',
  cardBorder: '#EADFD4',
  danger: '#9B3A3A',
  dangerSoft: '#F3D4D0',
  white: '#FFFFFF',
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

export const shadow = {
  shadowColor: '#2A1F1A',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const phoneMaxWidth = 430;
