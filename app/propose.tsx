import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { WhenPicker } from '@/src/components/WhenPicker';
import { LiveMap } from '@/src/components/LiveMap';
import { PlacePicker } from '@/src/components/PlacePicker';
import { BackRow, Body, Button, Display, Pill, Screen, TextField } from '@/src/components/ui';
import { latestRevision, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { defaultProposeInput, firstParam } from '@/src/lib/propose';
import type { PlaceRef } from '@/src/types';

export default function ProposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    counterOf?: string | string[];
    startsAt?: string | string[];
    endsAt?: string | string[];
    notes?: string | string[];
    location?: string | string[];
    idea?: string | string[];
    wishlistId?: string | string[];
    source?: string | string[];
  }>();
  const { state, propose, counter } = useAppStore();
  const them = otherPartner(state);
  const counterOf = firstParam(params.counterOf);
  const existing = state.meets.find((meet) => meet.id === counterOf);
  const seed = existing ? latestRevision(existing) : null;
  const source = firstParam(params.source);
  const idea = firstParam(params.idea);
  const prefillNotes = firstParam(params.notes);
  const prefillLocation = firstParam(params.location);
  const wishlistId = firstParam(params.wishlistId);
  const prefillStart = firstParam(params.startsAt);
  const prefillEnd = firstParam(params.endsAt);

  const [when, setWhen] = useState(() =>
    defaultProposeInput(
      seed
        ? { startsAt: seed.startsAt, endsAt: seed.endsAt, location: seed.location, notes: seed.notes }
        : prefillStart
          ? { startsAt: prefillStart, endsAt: prefillEnd }
          : null,
    ),
  );
  const [location, setLocation] = useState(seed?.location ?? prefillLocation ?? '');
  const [place, setPlace] = useState<PlaceRef | undefined>(seed?.place);
  const [notes, setNotes] = useState(seed?.notes ?? prefillNotes ?? '');

  const title = useMemo(() => {
    if (existing) return 'Suggest a different time';
    if (idea) return `Propose: ${idea}`;
    if (source === 'calendar') return 'This window looks open';
    return 'When should we meet?';
  }, [existing, idea, source]);

  function submit() {
    const input = {
      startsAt: when.startsAt,
      endsAt: when.endsAt,
      location,
      place,
      notes,
      wishlistItemId: wishlistId || undefined,
    };
    if (existing) {
      counter(existing.id, input);
      router.replace(`/meet/${existing.id}`);
      return;
    }
    const id = propose(input);
    router.replace(`/meet/${id}`);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackRow label="Close" onPress={() => router.back()} />
        {source === 'calendar' ? <Pill label="From a free window" tone="gold" /> : null}
        {source === 'ideas' ? <Pill label="From Ideas" tone="accent" /> : null}
        <Display size={32} style={{ marginTop: source ? 10 : 0 }}>
          {title}
        </Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          {existing
            ? `Send ${them?.name ?? 'them'} another option. The earlier suggestion stays in the thread.`
            : `${them?.name ?? 'Your person'} will be able to accept, counter, or decline. That’s the Againsoon loop.`}
        </Body>

        <WhenPicker value={when} onChange={setWhen} />

        <View style={{ height: 20 }} />
        <PlacePicker
          value={location}
          place={place}
          onChange={({ text, place: nextPlace }) => {
            setLocation(text);
            setPlace(nextPlace);
          }}
        />
        {place ? (
          <View style={{ marginTop: 12 }}>
            <LiveMap place={place} />
          </View>
        ) : null}
        <View style={{ height: 16 }} />
        <TextField
          label="A little note"
          placeholder="I miss your laugh."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <Button
          label={existing ? `Send counter to ${them?.name ?? 'them'}` : `Send to ${them?.name ?? 'them'}`}
          style={{ marginTop: 24 }}
          onPress={submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
