import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body } from '@/src/components/ui';
import { partnerById } from '@/src/data/selectors';
import { formatShortDate } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { Couple, Memory, MemoryPhotoKind } from '@/src/types';

const KIND_GRADIENT: Record<MemoryPhotoKind, [string, string]> = {
  river: ['#1E3A36', '#7DB89A'],
  oven: ['#3B2E18', '#E39B7A'],
  lantern: ['#3A2430', '#E2B56A'],
  wine: ['#2A1A24', '#C97B8A'],
  walk: ['#1B2432', '#7A90B8'],
  custom: ['#2A212A', '#E39B7A'],
};

const KIND_LABEL: Record<MemoryPhotoKind, string> = {
  river: 'River light',
  oven: 'The window table',
  lantern: 'Lantern hour',
  wine: 'Late gold',
  walk: 'The long way home',
  custom: 'A still from that night',
};

export function MemoryPhoto({
  memory,
  height = 140,
}: {
  memory: Pick<Memory, 'photoUri' | 'photoKind'>;
  height?: number;
}) {
  const kind = memory.photoKind ?? 'lantern';
  if (memory.photoUri) {
    return <Image source={{ uri: memory.photoUri }} style={[styles.photo, { height }]} />;
  }
  return (
    <LinearGradient colors={KIND_GRADIENT[kind]} style={[styles.photo, { height }]}>
      <Text style={styles.photoLabel}>{KIND_LABEL[kind]}</Text>
    </LinearGradient>
  );
}

export function MemoryCard({
  memory,
  couple,
  when,
  compact,
  onPress,
}: {
  memory: Memory;
  couple: Couple;
  when?: string;
  compact?: boolean;
  onPress?: () => void;
}) {
  const author = partnerById(couple, memory.authorId);
  const inner = (
    <View style={[styles.card, compact && styles.compact]}>
      <MemoryPhoto memory={memory} height={compact ? 92 : 140} />
      <View style={styles.copy}>
        <Body numberOfLines={compact ? 3 : 5} style={styles.note}>
          {memory.note}
        </Body>
        <Text style={styles.meta}>
          {author?.name ?? 'You two'}
          {when ? ` · ${formatShortDate(when)}` : ''}
        </Text>
      </View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.88 }}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  compact: {
    width: 220,
  },
  photo: {
    width: '100%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  photoLabel: {
    fontFamily: fonts.displayMedium,
    color: colors.ink,
    fontSize: 16,
  },
  copy: {
    padding: spacing.md,
    gap: 6,
  },
  note: {
    fontFamily: fonts.body,
  },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
});
