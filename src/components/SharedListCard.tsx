import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Display, TextField } from '@/src/components/ui';
import { partnerById } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { colors, fonts, spacing } from '@/src/theme';
import type { SharedList, SharedListKind } from '@/src/types';

export function SharedListCard({
  list,
  compact = false,
}: {
  list: SharedList;
  compact?: boolean;
}) {
  const { state, toggleListItem, addListItem } = useAppStore();
  const items = state.listItems.filter((item) => item.listId === list.id);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const remaining = items.filter((item) => !item.done).length;

  return (
    <View style={{ gap: 10 }}>
      <View>
        <Display size={compact ? 18 : 22}>{list.title}</Display>
        <Body muted small>
          {remaining === 0
            ? items.length
              ? 'All done'
              : list.kind === 'groceries'
                ? 'Nothing to pick up yet'
                : 'No chores yet'
            : `${remaining} left`}
        </Body>
      </View>
      {items.map((item) => {
        const owner = item.assigneeId ? partnerById(state.couple, item.assigneeId) : null;
        return (
          <Pressable key={item.id} onPress={() => toggleListItem(item.id)} style={styles.row}>
            <View style={[styles.box, item.done && styles.boxDone]}>
              {item.done ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, item.done && styles.textDone]}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.aisle ? `${item.aisle} · ` : ''}
                {owner ? owner.name : 'Either of you'}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {compact ? null : adding ? (
        <View style={{ gap: 8 }}>
          <TextField
            placeholder={placeholderFor(list.kind)}
            value={title}
            onChangeText={setTitle}
          />
          <Button
            label={list.kind === 'groceries' ? 'Add to groceries' : 'Add a chore'}
            variant="secondary"
            disabled={!title.trim()}
            onPress={() => {
              addListItem({
                listId: list.id,
                title: title.trim(),
                aisle: list.kind === 'groceries' ? guessAisle(title) : undefined,
              });
              setTitle('');
              setAdding(false);
            }}
          />
        </View>
      ) : (
        <Pressable onPress={() => setAdding(true)}>
          <Text style={styles.add}>{list.kind === 'groceries' ? 'Add something to pick up' : 'Add a chore'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function placeholderFor(kind: SharedListKind): string {
  return kind === 'groceries' ? 'Peaches, sparkling, the good bread' : 'Charge the camera, take the recycling';
}

function guessAisle(title: string): string | undefined {
  const lower = title.toLowerCase();
  if (/(peach|fruit|herb|salad|veg|tomato)/.test(lower)) return 'Produce';
  if (/(wine|spark|beer|juice|coffee)/.test(lower)) return 'Drinks';
  if (/(bread|pastry|baguette)/.test(lower)) return 'Bakery';
  return 'Other';
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
  meta: {
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
