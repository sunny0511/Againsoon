import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Display } from '@/src/components/ui';
import { colors, fonts, spacing } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.box}>
        <Display size={28}>This page wandered off.</Display>
        <Text style={styles.body}>Let’s go back to the couple home.</Text>
        <Link href="/" asChild>
          <Button label="Home" onPress={() => {}} />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.canvas,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
});
