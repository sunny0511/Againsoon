import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { Body, Button, Card, Display, Label, Pill, Screen, TextField } from '@/src/components/ui';
import { currentPartner, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatLongDate, formatTime } from '@/src/lib/dates';
import { sparkSuggestions } from '@/src/lib/spark';
import { spacing } from '@/src/theme';

export default function IdeasScreen() {
  const router = useRouter();
  const { state, switchPartner, addWishItem, toggleWishPrivate, removeWishItem } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const sparks = sparkSuggestions(state);
  const listId = state.wishlists[0]?.id ?? 'wish_dates';

  if (!state.couple || !me || !them || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      <DemoSwitcher current={me} other={them} onSwitch={switchPartner} />
      <Display size={32}>Spark & wishlists</Display>
      <Body muted style={{ marginTop: 6, marginBottom: 20 }}>
        Cupla-style ideas, with a twist: Spark only suggests pockets you’re both actually free, then sends a real proposal.
      </Body>

      <Label>Spark found these</Label>
      <View style={{ gap: 12, marginTop: 10, marginBottom: 24 }}>
        {sparks.length === 0 ? (
          <Body muted>No mutual free evenings in the next two weeks. Clear a busy block on Plan.</Body>
        ) : (
          sparks.map((spark) => (
            <Card key={spark.id} style={{ gap: 8 }}>
              {spark.fromWishlist ? <Pill label="From wishlist" tone="gold" /> : <Pill label="Spark pick" tone="accent" />}
              <Display size={22}>{spark.title}</Display>
              <Body muted small>
                {formatLongDate(spark.startsAt)} · {formatTime(spark.startsAt)}
              </Body>
              <Body>{spark.location}</Body>
              <Body muted small>
                {spark.reason}
              </Body>
              <Button
                label={`Propose to ${them.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/propose',
                    params: {
                      startsAt: spark.startsAt,
                      location: spark.location,
                      notes: spark.notes,
                    },
                  })
                }
              />
            </Card>
          ))
        )}
      </View>

      {state.wishlists.map((list) => {
        const items = state.wishlistItems.filter((item) => item.listId === list.id);
        const visible = items.filter((item) => !item.isPrivate || item.savedById === me.id);
        return (
          <View key={list.id} style={{ marginBottom: 22 }}>
            <Display size={22}>
              {list.emoji} {list.title}
            </Display>
            <View style={{ gap: 10, marginTop: 10 }}>
              {visible.map((item) => (
                <Card key={item.id} style={{ gap: 6 }}>
                  <Display size={18}>{item.title}</Display>
                  {item.note ? <Body muted small>{item.note}</Body> : null}
                  <Body muted small>
                    Saved by {item.savedById === me.id ? 'you' : them.name}
                    {item.isPrivate ? ' · private' : ''}
                  </Body>
                  {item.savedById === me.id ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        label={item.isPrivate ? 'Make shared' : 'Keep private'}
                        variant="ghost"
                        onPress={() => toggleWishPrivate(item.id)}
                      />
                      <Button label="Remove" variant="danger" onPress={() => removeWishItem(item.id)} />
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          </View>
        );
      })}

      <Card style={{ gap: spacing.md }}>
        <Display size={20}>Save an idea</Display>
        <TextField placeholder="Night swim, pastry crawl…" value={title} onChangeText={setTitle} />
        <TextField placeholder="A little note" value={note} onChangeText={setNote} />
        <Button
          label="Add to Date nights"
          disabled={!title.trim()}
          variant="secondary"
          onPress={() => {
            addWishItem({
              listId,
              title: title.trim(),
              note: note.trim() || undefined,
              savedById: me.id,
              isPrivate: false,
            });
            setTitle('');
            setNote('');
          }}
        />
      </Card>
    </Screen>
  );
}
