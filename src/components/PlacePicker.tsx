import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Label, TextField } from '@/src/components/ui';
import { searchPlaces } from '@/src/lib/places';
import { colors, fonts, radii } from '@/src/theme';
import type { PlaceRef } from '@/src/types';

export function PlacePicker({
  value,
  place,
  onChange,
}: {
  value: string;
  place?: PlaceRef;
  onChange: (next: { text: string; place?: PlaceRef }) => void;
}) {
  const [hits, setHits] = useState<PlaceRef[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || (place && place.name === q)) {
      setHits([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      searchPlaces(q)
        .then((found) => {
          if (active) setHits(found);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 280);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, place]);

  return (
    <View style={{ gap: 8 }}>
      <TextField
        label="Place or activity"
        placeholder="Wine bar, walk, our kitchen…"
        value={value}
        onChangeText={(text) => onChange({ text, place: undefined })}
        hint={place ? place.label ?? 'Pinned on the live map' : 'Search a real place — optional if the time matters more.'}
      />
      {busy ? (
        <Body muted small>
          Searching live maps…
        </Body>
      ) : null}
      {hits.length > 0 ? (
        <View style={styles.hits}>
          {hits.map((hit) => (
            <Pressable
              key={`${hit.lat}-${hit.lon}-${hit.name}`}
              onPress={() => {
                onChange({ text: hit.name, place: hit });
                setHits([]);
              }}
              style={styles.hit}>
              <Text style={styles.hitName}>{hit.name}</Text>
              {hit.label ? <Text style={styles.hitLabel}>{hit.label}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {place ? <Label>Mapped · {place.lat.toFixed(3)}, {place.lon.toFixed(3)}</Label> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hits: {
    gap: 6,
  },
  hit: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  hitName: {
    fontFamily: fonts.bodySemi,
    color: colors.ink,
    fontSize: 14,
  },
  hitLabel: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
});
