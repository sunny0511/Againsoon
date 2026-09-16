import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { WhenPicker } from '@/src/components/WhenPicker';
import { BackRow, Body, Button, Display, Screen, TextField } from '@/src/components/ui';
import { latestRevision, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { defaultProposeInput } from '@/src/lib/propose';

export default function ProposeScreen() {
  const router = useRouter();
  const { counterOf, location: locParam, notes: notesParam, startsAt } = useLocalSearchParams<{
    counterOf?: string;
    location?: string;
    notes?: string;
    startsAt?: string;
  }>();
  const { state, propose, counter } = useAppStore();
  const them = otherPartner(state);
  const existing = state.meets.find((meet) => meet.id === counterOf);
  const seed = existing ? latestRevision(existing) : null;

  const paramSeed =
    startsAt || locParam || notesParam
      ? {
          startsAt: typeof startsAt === 'string' ? startsAt : undefined,
          location: typeof locParam === 'string' ? locParam : undefined,
          notes: typeof notesParam === 'string' ? notesParam : undefined,
        }
      : null;

  const [when, setWhen] = useState(() =>
    defaultProposeInput(
      seed
        ? { startsAt: seed.startsAt, endsAt: seed.endsAt, location: seed.location, notes: seed.notes }
        : paramSeed?.startsAt
          ? { startsAt: paramSeed.startsAt, location: paramSeed.location, notes: paramSeed.notes }
          : null,
    ),
  );
  const [location, setLocation] = useState(seed?.location ?? paramSeed?.location ?? '');
  const [notes, setNotes] = useState(seed?.notes ?? paramSeed?.notes ?? '');

  const title = useMemo(
    () => (existing ? 'Suggest a different time' : 'When should we meet?'),
    [existing],
  );

  function submit() {
    const input = {
      startsAt: when.startsAt,
      endsAt: when.endsAt,
      location,
      notes,
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
        <Display size={32}>{title}</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          {existing
            ? `Send ${them?.name ?? 'them'} another option. The earlier suggestion stays in the thread.`
            : `${them?.name ?? 'Your person'} will be able to accept, counter, or decline.`}
        </Body>

        <WhenPicker value={when} onChange={setWhen} />

        <View style={{ height: 20 }} />
        <TextField
          label="Place or activity"
          placeholder="Wine bar, walk, our kitchen…"
          value={location}
          onChangeText={setLocation}
          hint="Optional. Leave it open if the time matters more."
        />
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
