import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, phoneMaxWidth, radii, shadow, softShadow, spacing } from '@/src/theme';

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
      contentContainerStyle={[styles.scrollContent, padded && styles.padded, { flexGrow: 1 }]}
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
  size = 32,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[styles.display, { fontSize: size, lineHeight: size * 1.16 }, style]}>{children}</Text>
  );
}

export function Body({
  children,
  muted,
  small,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
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
  flush,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  flush?: boolean;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, flush && styles.cardFlush, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, flush && styles.cardFlush, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'sage' | 'danger' | 'gold';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.accentSoft, fg: colors.accentDeep },
    ghost: { bg: 'transparent', fg: colors.ink },
    sage: { bg: colors.sage, fg: colors.onAccent },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    gold: { bg: colors.gold, fg: colors.onAccent },
  }[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg },
        variant === 'ghost' && styles.ghostButton,
        isDisabled && { opacity: 0.45 },
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={palette.fg} />
      ) : null}
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorBanner}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.errorTitle}>Couldn’t sync</Text>
        <Body small style={{ color: colors.danger }}>
          {message}
        </Body>
      </View>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={styles.errorRetry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
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
  color,
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'sage' | 'gold' | 'danger' | 'us' | 'me' | 'them';
  color?: string;
}) {
  const palette = {
    neutral: { bg: colors.canvasDeep, fg: colors.inkMuted },
    accent: { bg: colors.accentSoft, fg: colors.accentDeep },
    sage: { bg: colors.sageSoft, fg: colors.sage },
    gold: { bg: colors.goldSoft, fg: colors.gold },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    us: { bg: colors.usSoft, fg: colors.us },
    me: { bg: colors.accentSoft, fg: colors.accentDeep },
    them: { bg: colors.sageSoft, fg: colors.sage },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: color ? `${color}33` : palette.bg }]}>
      <Text style={[styles.pillText, { color: color ?? palette.fg }]}>{label}</Text>
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
      <Text style={[styles.avatarLetter, { fontSize: size * 0.42 }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
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

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Body muted small>
          {description}
        </Body>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.cardBorder, true: colors.accent }}
        thumbColor={value ? colors.invert : colors.inkMuted}
        ios_backgroundColor={colors.cardBorder}
      />
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

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Label>{title}</Label>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.gold} />
      </View>
      <Display size={22}>{title}</Display>
      <Body muted small style={{ textAlign: 'center' }}>
        {body}
      </Body>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} style={{ alignSelf: 'stretch' }} />
      ) : null}
    </View>
  );
}

export function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(Math.max(0.06, Math.min(1, ratio)) * 100)}%`, backgroundColor: color ?? colors.gold },
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.invert, borderColor: colors.invert },
        !active && color ? { borderColor: color } : null,
      ]}>
      <Text style={[styles.chipLabel, active && { color: colors.onInvert }]}>{label}</Text>
    </Pressable>
  );
}

export function ColorDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

export function Legend({
  me,
  them,
  us,
  meLabel,
  themLabel,
}: {
  me: string;
  them: string;
  us: string;
  meLabel: string;
  themLabel: string;
}) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <ColorDot color={me} />
        <Text style={styles.legendText}>{meLabel}</Text>
      </View>
      <View style={styles.legendItem}>
        <ColorDot color={them} />
        <Text style={styles.legendText}>{themLabel}</Text>
      </View>
      <View style={styles.legendItem}>
        <ColorDot color={us} />
        <Text style={styles.legendText}>Us</Text>
      </View>
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
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
    paddingBottom: 108,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  display: {
    fontFamily: fonts.display,
    color: colors.ink,
    letterSpacing: -0.7,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.1,
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
  cardFlush: {
    ...softShadow,
  },
  pressed: {
    opacity: 0.86,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionAction: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.accentDeep,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.canvasDeep,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: radii.pill,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.canvasDeep,
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.cardElevated,
  },
  segmentLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkSoft,
  },
  segmentLabelActive: {
    color: colors.ink,
    fontFamily: fonts.bodySemi,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.danger,
  },
  errorRetry: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.accentDeep,
  },
});
