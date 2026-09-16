import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { MeetCard } from '@/src/components/MeetCard';
import { Body, Button, Card, Display, Label, Pill, Screen, TextField } from '@/src/components/ui';
import { currentPartner, historyMeets, nextKeyOccurrence } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatCountdown } from '@/src/lib/dates';
import { spacing } from '@/src/theme';

const MOODS = ['cozy', 'easy', 'glow', 'adventure'] as const;

export default function TogetherScreen() {
  const router = useRouter();
  const { state, toggleListItem, addListItem, addMemory, addKeyDate } = useAppStore();
  const me = currentPartner(state);
  const history = historyMeets(state.meets);
  const [todo, setTodo] = useState('');
  const [memoryNote, setMemoryNote] = useState('');
  const [mood, setMood] = useState<(typeof MOODS)[number]>('cozy');
  const [keyTitle, setKeyTitle] = useState('');

  if (!state.couple || !me || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const pastTogether = history.filter((meet) => meet.status === 'confirmed');
  const grocery = state.lists.find((list) => list.kind === 'groceries') ?? state.lists[0];
  const todos = state.lists.find((list) => list.kind === 'todos') ?? state.lists[1];

  return (
    <Screen>
      <Display size={32}>Us</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 22 }}>
        Lists, memories, and the dates that matter — the life-together layer Cupla is known for, sitting next to Againsoon’s booking loop.
      </Body>

      <Label>Key dates</Label>
      <View style={{ gap: 10, marginTop: 10, marginBottom: 22 }}>
        {state.keyDates.map((item) => {
          const when = nextKeyOccurrence(item);
          return (
            <Card key={item.id}>
              <Display size={20}>{item.title}</Display>
              <Body muted>
                {formatCountdown(when.toISOString())}
                {item.note ? ` · ${item.note}` : ''}
              </Body>
            </Card>
          );
        })}
        <Card style={{ gap: 10 }}>
          <TextField placeholder="Add a milestone" value={keyTitle} onChangeText={setKeyTitle} />
          <Button
            label="Save as next month, same day"
            variant="ghost"
            disabled={!keyTitle.trim()}
            onPress={() => {
              const d = new Date();
              d.setMonth(d.getMonth() + 1);
              addKeyDate({
                title: keyTitle.trim(),
                month: d.getMonth() + 1,
                day: d.getDate(),
                year: d.getFullYear(),
                recurringYearly: false,
              });
              setKeyTitle('');
            }}
          />
        </Card>
      </View>

      {grocery ? (
        <View style={{ marginBottom: 22 }}>
          <Display size={22}>{grocery.title}</Display>
          <Body muted small style={{ marginBottom: 10 }}>
            Shared shopping for the next meet, grouped like a couple grocery list.
          </Body>
          {state.listItems
            .filter((item) => item.listId === grocery.id)
            .map((item) => (
              <Pressable key={item.id} onPress={() => toggleListItem(item.id)}>
                <Card style={{ marginBottom: 8, opacity: item.done ? 0.55 : 1 }}>
                  <Body>
                    {item.done ? '✓ ' : '○ '}
                    {item.title}
                    {item.aisle ? ` · ${item.aisle}` : ''}
                  </Body>
                </Card>
              </Pressable>
            ))}
        </View>
      ) : null}

      {todos ? (
        <View style={{ marginBottom: 22 }}>
          <Display size={22}>{todos.title}</Display>
          {state.listItems
            .filter((item) => item.listId === todos.id)
            .map((item) => (
              <Pressable key={item.id} onPress={() => toggleListItem(item.id)}>
                <Card style={{ marginBottom: 8, opacity: item.done ? 0.55 : 1 }}>
                  <Body>
                    {item.done ? '✓ ' : '○ '}
                    {item.title}
                  </Body>
                </Card>
              </Pressable>
            ))}
          <Card style={{ gap: 10, marginTop: 6 }}>
            <TextField placeholder="Add a to-do" value={todo} onChangeText={setTodo} />
            <Button
              label="Add for both of you"
              variant="secondary"
              disabled={!todo.trim()}
              onPress={() => {
                addListItem({ listId: todos.id, title: todo.trim() });
                setTodo('');
              }}
            />
          </Card>
        </View>
      ) : null}

      <Display size={22}>Memories</Display>
      <View style={{ gap: 10, marginTop: 10, marginBottom: 22 }}>
        {state.memories.map((memory) => (
          <Card key={memory.id} style={{ gap: 6 }}>
            <Pill label={memory.mood} tone="gold" />
            <Display size={20}>{memory.title}</Display>
            <Body muted>“{memory.note}”</Body>
          </Card>
        ))}
        <Card style={{ gap: spacing.sm }}>
          <Label>Remember a night</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MOODS.map((item) => (
              <Button
                key={item}
                label={item}
                variant={mood === item ? 'primary' : 'ghost'}
                onPress={() => setMood(item)}
              />
            ))}
          </View>
          <TextField placeholder="What do you want to keep?" value={memoryNote} onChangeText={setMemoryNote} multiline />
          <Button
            label="Save memory"
            disabled={!memoryNote.trim()}
            onPress={() => {
              addMemory({
                title: 'A night we keep',
                note: memoryNote.trim(),
                mood,
                authorId: me.id,
              });
              setMemoryNote('');
            }}
          />
        </Card>
      </View>

      <Display size={22}>Past meets</Display>
      <View style={{ gap: 12, marginTop: 10 }}>
        {pastTogether.map((meet) => (
          <MeetCard
            key={meet.id}
            meet={meet}
            couple={state.couple!}
            currentPartnerId={state.currentPartnerId!}
            onPress={() => router.push(`/meet/${meet.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
