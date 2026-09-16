import type { Meet } from '@/src/types';

export const LOCATION_WINDOW_MS = 60 * 60 * 1000;

export type Coords = { latitude: number; longitude: number };

export type ProximitySnapshot = {
  youMeters: number;
  themMeters: number;
  apartMeters: number;
  youMinutes: number;
  themMinutes: number;
  apartMinutes: number;
  youProgress: number;
  themProgress: number;
};

export function locationWindow(meet: Meet): { start: Date; end: Date } | null {
  if (meet.status !== 'confirmed' || meet.revisions.length === 0) return null;
  const revision = meet.revisions[meet.revisions.length - 1];
  const start = new Date(revision.startsAt);
  const end = revision.endsAt ? new Date(revision.endsAt) : addMs(start, 2 * LOCATION_WINDOW_MS);
  return { start: addMs(start, -LOCATION_WINDOW_MS), end };
}

export function isLocationWindowOpen(meet: Meet, now = new Date()): boolean {
  const window = locationWindow(meet);
  if (!window) return false;
  const t = now.getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
}

export function msUntilLocationWindow(meet: Meet, now = new Date()): number | null {
  const window = locationWindow(meet);
  if (!window) return null;
  return window.start.getTime() - now.getTime();
}

export function formatMeters(meters: number): string {
  if (meters < 950) return `${Math.max(20, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

export function proximityForMeet(meet: Meet, now = new Date()): ProximitySnapshot {
  const revision = meet.revisions[meet.revisions.length - 1];
  const start = new Date(revision.startsAt).getTime();
  const remaining = start - now.getTime();
  const t = Math.max(0, Math.min(1, 1 - remaining / LOCATION_WINDOW_MS));
  const youMeters = 80 + 1700 * (1 - t);
  const themMeters = 140 + 2600 * (1 - t);
  const apartMeters = Math.abs(themMeters - youMeters) + 350 * (1 - t);
  return {
    youMeters,
    themMeters,
    apartMeters,
    youMinutes: walkingMinutes(youMeters),
    themMinutes: walkingMinutes(themMeters),
    apartMinutes: walkingMinutes(apartMeters),
    youProgress: 1 - youMeters / 2800,
    themProgress: 1 - themMeters / 2800,
  };
}

export async function requestOwnLocation(): Promise<Coords | null> {
  try {
    const Location = await import('expo-location');
    const existing = await Location.getForegroundPermissionsAsync();
    const status =
      existing.status === 'granted'
        ? existing
        : await Location.requestForegroundPermissionsAsync();
    if (status.status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function haversineMeters(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function proximityFromCoords(you: Coords, them: Coords, venue: Coords): ProximitySnapshot {
  const youMeters = haversineMeters(you, venue);
  const themMeters = haversineMeters(them, venue);
  const apartMeters = haversineMeters(you, them);
  const youProgress = Math.max(0, Math.min(1, 1 - youMeters / 2800));
  const themProgress = Math.max(0, Math.min(1, 1 - themMeters / 2800));
  return {
    youMeters,
    themMeters,
    apartMeters,
    youMinutes: walkingMinutes(youMeters),
    themMinutes: walkingMinutes(themMeters),
    apartMinutes: walkingMinutes(apartMeters),
    youProgress,
    themProgress,
  };
}

export function offsetCoords(origin: Coords, metersEast: number, metersNorth: number): Coords {
  return {
    latitude: origin.latitude + metersNorth / 111_111,
    longitude: origin.longitude + metersEast / (111_111 * Math.cos((origin.latitude * Math.PI) / 180)),
  };
}
