import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Display } from '@/src/components/ui';
import { colors, fonts, radii, spacing } from '@/src/theme';

export function LockInMoment({
  visible,
  partnerName,
  onDone,
}: {
  visible: boolean;
  partnerName: string;
  onDone: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.92);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onDone}>
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <View style={styles.burst}>
          <Text style={styles.heart}>♥</Text>
        </View>
        <Display size={34} style={{ textAlign: 'center' }}>
          It’s a date
        </Display>
        <Text style={styles.copy}>Locked in with {partnerName}. The calendar already knows.</Text>
        <Button label="Keep going" variant="gold" onPress={onDone} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 9, 13, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.cardElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  burst: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    fontSize: 28,
    color: colors.gold,
  },
  copy: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
