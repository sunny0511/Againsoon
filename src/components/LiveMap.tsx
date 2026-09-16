import { createElement } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Body, Button } from '@/src/components/ui';
import { embedUrl, mapsUrl } from '@/src/lib/places';
import { colors, radii } from '@/src/theme';
import type { PlaceRef } from '@/src/types';

export function LiveMap({
  place,
  height = 180,
}: {
  place: PlaceRef;
  height?: number;
}) {
  const src = embedUrl(place);

  return (
    <View style={{ gap: 8 }}>
      {Platform.OS === 'web' ? (
        <View style={[styles.frame, { height }]}>
          {createElement('iframe', {
            src,
            title: place.name,
            style: {
              width: '100%',
              height: '100%',
              border: '0',
              borderRadius: 16,
            },
          })}
        </View>
      ) : (
        <Pressable onPress={() => Linking.openURL(mapsUrl(place))} style={[styles.fallback, { height }]}>
          <Body>Open live map</Body>
          <Body muted small>
            {place.label ?? `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`}
          </Body>
        </Pressable>
      )}
      <Button label="Open in Maps" variant="ghost" onPress={() => Linking.openURL(mapsUrl(place))} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.canvasDeep,
  },
  fallback: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.canvasDeep,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 4,
  },
});
