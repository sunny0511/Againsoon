import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionBanner } from '@/src/components/SessionBanner';
import {
  Body,
  Button,
  Card,
  Chip,
  Display,
  EmptyState,
  Label,
  LoadingScreen,
  Pill,
  Screen,
  Segmented,
  TextField,
} from '@/src/components/ui';
import { currentPartner, otherPartner, partnerById } from '@/src/data/selectors';
import { isCloudCoupleReady, useAppStore } from '@/src/data/store';
import { BUDGET_COPY, suggestDates, VIBE_COPY } from '@/src/lib/assist';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { BudgetVibe, DateVibe, WishlistItem } from '@/src/types';

export default function IdeasScreen() {
  const router = useRouter();
  const { state, session, addWishlistItem, removeWishlistItem } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [tab, setTab] = useState<'wishlist' | 'assist'>('wishlist');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState<BudgetVibe>('$');
  const [vibe, setVibe] = useState<DateVibe>('cozy');
  const [assistVibe, setAssistVibe] = useState<DateVibe>('cozy');
  const [assistBudget, setAssistBudget] = useState<BudgetVibe>('$');
  const [windowLabel, setWindowLabel] = useState<'weeknight' | 'weekend'>('weeknight');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof suggestDates> | null>(null);

  if (session.kind === 'paired' && !isCloudCoupleReady(session, state)) return <LoadingScreen />;
  if (!state.couple || !me || !them) {
    return <Redirect href="/onboarding" />;
  }

  const ideas = state.wishlist;

  function proposeIdea(item: { title: string; notes?: string; location?: string; wishlistItemId?: string }) {
    router.push({
      pathname: '/propose',
      params: {
        notes: item.notes ?? item.title,
        location: item.location ?? item.title,
        idea: item.title,
        wishlistId: item.wishlistItemId ?? '',
        source: 'ideas',
      },
    });
  }

  return (
    <Screen>
      <SessionBanner />
      <Display size={32}>Date ideas</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 16 }}>
        A shared wishlist, plus a tiny on-device Assist that never leaves this phone.
      </Body>
      <Segmented
        options={[
          { id: 'wishlist', label: 'Wishlist' },
          { id: 'assist', label: 'Assist' },
        ]}
        value={tab}
        onChange={(id) => setTab(id as 'wishlist' | 'assist')}
      />

      {tab === 'wishlist' ? (
        <View style={{ marginTop: 20, gap: spacing.lg }}>
          {ideas.length === 0 ? (
            <EmptyState
              icon="heart-outline"
              title="No ideas yet"
              body="Save the dates you keep meaning to have — then propose one when a window opens."
            />
          ) : (
            <View style={{ gap: 12 }}>
              {ideas.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  author={partnerById(state.couple, item.createdById)?.name}
                  onPropose={() =>
                    proposeIdea({
                      title: item.title,
                      notes: item.notes,
                      location: item.title,
                      wishlistItemId: item.id,
                    })
                  }
                  onRemove={() => removeWishlistItem(item.id)}
                />
              ))}
            </View>
          )}

          <Card style={{ gap: 12 }}>
            <Display size={22}>Add an idea</Display>
            <TextField placeholder="Night market wander" value={title} onChangeText={setTitle} />
            <TextField
              placeholder="A little note — optional"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <Label>Budget vibe</Label>
            <View style={styles.wrap}>
              {(['free', '$', '$$'] as BudgetVibe[]).map((item) => (
                <Chip key={item} label={BUDGET_COPY[item]} active={budget === item} onPress={() => setBudget(item)} />
              ))}
            </View>
            <Label>Vibe</Label>
            <View style={styles.wrap}>
              {(['cozy', 'outdoors', 'foodie', 'surprise'] as DateVibe[]).map((item) => (
                <Chip key={item} label={VIBE_COPY[item]} active={vibe === item} onPress={() => setVibe(item)} />
              ))}
            </View>
            <Button
              label="Save to wishlist"
              disabled={!title.trim()}
              onPress={() => {
                addWishlistItem({ title: title.trim(), notes, budget, vibe });
                setTitle('');
                setNotes('');
              }}
            />
          </Card>
        </View>
      ) : (
        <View style={{ marginTop: 20, gap: spacing.md }}>
          <Card style={{ gap: 8, backgroundColor: colors.goldSoft, borderColor: colors.gold }}>
            <Pill label="On-device Assist" tone="gold" />
            <Body small>
              Not a cloud model. It scores your wishlist and a small recipe book against the vibe and budget you pick.
            </Body>
          </Card>
          <Label>Vibe</Label>
          <View style={styles.wrap}>
            {(['cozy', 'outdoors', 'foodie', 'surprise'] as DateVibe[]).map((item) => (
              <Chip
                key={item}
                label={VIBE_COPY[item]}
                active={assistVibe === item}
                onPress={() => setAssistVibe(item)}
              />
            ))}
          </View>
          <Label>Budget</Label>
          <View style={styles.wrap}>
            {(['free', '$', '$$'] as BudgetVibe[]).map((item) => (
              <Chip
                key={item}
                label={BUDGET_COPY[item]}
                active={assistBudget === item}
                onPress={() => setAssistBudget(item)}
              />
            ))}
          </View>
          <Label>Time window</Label>
          <View style={styles.wrap}>
            <Chip
              label="Weeknight"
              active={windowLabel === 'weeknight'}
              onPress={() => setWindowLabel('weeknight')}
            />
            <Chip
              label="Weekend"
              active={windowLabel === 'weekend'}
              onPress={() => setWindowLabel('weekend')}
            />
          </View>
          <Button
            label="Suggest a few"
            icon="sparkles-outline"
            onPress={() => setSuggestions(suggestDates(state.wishlist, assistVibe, assistBudget))}
          />
          {suggestions ? (
            <View style={{ gap: 12 }}>
              {suggestions.map((item) => (
                <Card key={item.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Display size={22} style={{ flex: 1 }}>
                      {item.title}
                    </Display>
                    <Pill label={item.source === 'wishlist' ? 'Wishlist' : 'Recipe'} tone="gold" />
                  </View>
                  <Body muted small>
                    {item.notes}
                  </Body>
                  <Body muted small>
                    {VIBE_COPY[item.vibe]} · {BUDGET_COPY[item.budget]} · {windowLabel === 'weekend' ? 'weekend' : 'weeknight'}
                  </Body>
                  <Button
                    label="Propose this"
                    variant="secondary"
                    onPress={() =>
                      proposeIdea({
                        title: item.title,
                        notes: item.notes,
                        location: item.location ?? item.title,
                        wishlistItemId: item.wishlistItemId,
                      })
                    }
                  />
                </Card>
              ))}
            </View>
          ) : (
            <Body muted small>
              Pick a vibe and budget, then Assist will offer two or three options you can send in one tap.
            </Body>
          )}
        </View>
      )}
    </Screen>
  );
}

function WishlistCard({
  item,
  author,
  onPropose,
  onRemove,
}: {
  item: WishlistItem;
  author?: string;
  onPropose: () => void;
  onRemove: () => void;
}) {
  return (
    <Card style={{ gap: 8 }}>
      <View style={styles.wishTop}>
        <Display size={22} style={{ flex: 1 }}>
          {item.title}
        </Display>
        <Pill label={BUDGET_COPY[item.budget]} tone="gold" />
      </View>
      {item.notes ? <Body muted>{item.notes}</Body> : null}
      <Body muted small>
        {item.vibe ? `${VIBE_COPY[item.vibe]} · ` : ''}
        {author ? `saved by ${author}` : 'shared idea'}
      </Body>
      <View style={styles.wishActions}>
        <Button label="Propose this" variant="secondary" onPress={onPropose} style={{ flex: 1 }} />
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wishTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  wishActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  remove: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  removeText: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkSoft,
    fontSize: 13,
  },
});
