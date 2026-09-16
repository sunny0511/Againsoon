import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, ErrorBanner } from '@/src/components/ui';
import { currentPartner, otherPartner } from '@/src/data/selectors';
import { canSwitchPartner, useAppStore } from '@/src/data/store';
import { colors, fonts, radii } from '@/src/theme';

export function SessionBanner() {
  const { state, session, switchPartner, retrySync } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);

  return (
    <View>
      {session.syncError ? <ErrorBanner message={session.syncError} onRetry={retrySync} /> : null}
      {session.kind === 'demo' && me && them ? (
        <Pressable onPress={switchPartner} style={({ pressed }) => [styles.banner, styles.demo, pressed && { opacity: 0.85 }]}>
          <Avatar name={me.name} hue={me.hue} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Offline demo · viewing as {me.name}</Text>
            <Text style={styles.action}>Not synced. Switch to {them.name} to answer on this phone.</Text>
          </View>
          <View style={[styles.swatch, { backgroundColor: me.hue }]} />
        </Pressable>
      ) : null}
      {session.kind === 'local' && me && them ? (
        <View style={[styles.banner, styles.local]}>
          <Avatar name={me.name} hue={me.hue} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>This device only</Text>
            <Text style={styles.action}>
              {canSwitchPartner(session)
                ? `Local couple with ${them.name}. Sign in to pair across two phones.`
                : 'Local couple — not live-synced.'}
            </Text>
          </View>
        </View>
      ) : null}
      {session.kind === 'paired' && me && them ? (
        <View style={[styles.banner, styles.live]}>
          <Avatar name={me.name} hue={me.hue} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Live with {them.name}</Text>
            <Text style={styles.action}>
              {session.syncing ? 'Syncing…' : session.user?.email ? `Signed in as ${session.user.email}` : 'Realtime couple space'}
            </Text>
          </View>
          <View style={[styles.dot, session.syncError ? styles.dotWarn : styles.dotOk]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  demo: {
    backgroundColor: colors.accentSoft,
  },
  local: {
    backgroundColor: colors.goldSoft,
  },
  live: {
    backgroundColor: colors.sageSoft,
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
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOk: {
    backgroundColor: colors.sage,
  },
  dotWarn: {
    backgroundColor: colors.danger,
  },
});

