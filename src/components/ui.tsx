import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, phoneMaxWidth, radii, shadow, spacing } from '@/src/theme';

export function AppShell({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.shell, style]}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}) {
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        padded && styles.padded,
        { flexGrow: 1 },
      ]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={edges ?? ['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

export function Display({
  children,
  size = 34,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.display, { fontSize: size, lineHeight: size * 1.18 }, style]}>{children}</Text>;
}

export function Body({
  children,
  muted,
  small,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        styles.body,
        muted && { color: colors.inkMuted },
        small && { fontSize: 14, lineHeight: 20 },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'sage' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.accent, fg: colors.white },
    secondary: { bg: colors.accentSoft, fg: colors.accentDeep },
    ghost: { bg: 'transparent', fg: colors.ink },
    sage: { bg: colors.sage, fg: colors.white },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[variant];

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg },
        variant === 'ghost' && styles.ghostButton,
        disabled && { opacity: 0.45 },
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  hint,
  ...props
}: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.inkSoft}
        {...props}
        style={[styles.input, props.multiline && styles.inputMultiline, props.style]}
      />
      {hint ? (
        <Body muted small>
          {hint}
        </Body>
      ) : null}
    </View>
  );
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'sage' | 'gold' | 'danger';
}) {
  const palette = {
    neutral: { bg: colors.canvasDeep, fg: colors.inkMuted },
    accent: { bg: colors.accentSoft, fg: colors.accentDeep },
    sage: { bg: colors.sageSoft, fg: colors.sage },
    gold: { bg: colors.goldSoft, fg: colors.gold },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, hue, size = 42 }: { name: string; hue: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hue },
      ]}>
      <Text style={[styles.avatarLetter, { fontSize: size * 0.42 }]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

export function AvatarStack({
  left,
  right,
}: {
  left: { name: string; hue: string };
  right: { name: string; hue: string };
}) {
  return (
    <View style={styles.avatarStack}>
      <Avatar name={left.name} hue={left.hue} />
      <View style={{ marginLeft: -12 }}>
        <Avatar name={right.name} hue={right.hue} />
      </View>
    </View>
  );
}

export function BackRow({ label, onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
      <Ionicons name="chevron-back" size={20} color={colors.ink} />
      <Text style={styles.backLabel}>{label ?? 'Back'}</Text>
    </Pressable>
  );
}

export function LoadingScreen() {
  return (
    <View style={[styles.shell, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function WarmMark() {
  return (
    <View style={styles.mark}>
      <LinearGradient colors={[colors.accentSoft, colors.goldSoft]} style={[styles.blob, { left: 8 }]} />
      <LinearGradient colors={[colors.sageSoft, colors.accentSoft]} style={[styles.blob, { right: 8, top: 18 }]} />
      <View style={styles.markCenter}>
        <Ionicons name="heart" size={28} color={colors.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.canvasDeep,
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: phoneMaxWidth,
    backgroundColor: colors.canvas,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  display: {
    fontFamily: fonts.display,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    ...shadow,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  button: {
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  buttonLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarLetter: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  backLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  mark: {
    height: 140,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.95,
  },
  markCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadow,
  },
});
