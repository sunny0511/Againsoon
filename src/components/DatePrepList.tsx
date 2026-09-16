import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, TextField } from '@/src/components/ui';
import { partnerById } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { colors, fonts, spacing } from '@/src/theme';

export function DatePrepList({ meetId }: { meetId: string }) {
  const { state, togglePrep, addPrep } = useAppStore();
  const items = state.datePrep.filter((item) => item.meetId === meetId);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  return (
    <View style={{ gap: 10 }}>
      {items.length === 0 ? (
        <Body muted small>
          A tiny list for this date — who books, what to bring.
        </Body>
      ) : (
        items.map((item) => {
          const owner = item.assigneeId ? partnerById(state.couple, item.assigneeId) : null;
          return (
            <Pressable
              key={item.id}
              onPress={() => togglePrep(item.id)}
              style={styles.row}>
              <View style={[styles.box, item.done && styles.boxDone]}>
                {item.done ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, item.done && styles.textDone]}>{item.text}</Text>
                {owner ? (
                  <Text style={styles.who}>{owner.name}</Text>
                ) : (
                  <Text style={styles.who}>Either of you</Text>
                )}
              </View>
            </Pressable>
          );
        })
      )}
      {adding ? (
        <View style={{ gap: 8 }}>
          <TextField
            placeholder="Bring the good blanket"
            value={text}
            onChangeText={setText}
          />
          <Button
            label="Add to prep"
            variant="secondary"
            disabled={!text.trim()}
            onPress={() => {
              addPrep(meetId, text.trim(), state.currentPartnerId ?? undefined);
              setText('');
              setAdding(false);
            }}
          />
        </View>
      ) : (
        <Pressable onPress={() => setAdding(true)}>
          <Text style={styles.add}>Add a prep note</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.canvasDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxDone: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  check: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  textDone: {
    color: colors.inkSoft,
    textDecorationLine: 'line-through',
  },
  who: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  add: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.accentDeep,
    paddingVertical: spacing.xs,
  },
});
