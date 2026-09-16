import { useRouter } from 'expo-router';
import { useState } from 'react';

import { BackRow, Body, Button, Display, Screen, TextField } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';

export default function NameScreen() {
  const router = useRouter();
  const { state, setDraftName } = useAppStore();
  const [name, setName] = useState(state.draftName);

  return (
    <Screen>
        <BackRow onPress={() => router.back()} />
        <Display size={32}>What should we call you?</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          Just a first name is perfect. Your person will see this when you suggest a time.
        </Body>
        <TextField
          autoFocus
          placeholder="Maya"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setDraftName(value);
          }}
        />
        <Button
          label="Continue"
          disabled={!name.trim()}
          style={{ marginTop: 20 }}
          onPress={() => {
            setDraftName(name.trim());
            router.push('/onboarding/pair');
          }}
        />
    </Screen>
  );
}
