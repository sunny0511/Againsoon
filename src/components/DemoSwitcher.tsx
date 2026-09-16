import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/ui';
import { colors, fonts, radii } from '@/src/theme';
import type { Partner } from '@/src/types';

export function DemoSwitcher({
  current,
  other,
  onSwitch,
}: {
  current: Partner;
  other: Partner;
  onSwitch: () => void;
}) {
  return (
    <Pressable onPress={onSwitch} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}>
      <Avatar name={current.name} hue={current.hue} size={28} />
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>Demo · viewing as {current.name}</Text>
        <Text style={styles.action}>Switch to {other.name} to answer</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
  },
  action: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
});
