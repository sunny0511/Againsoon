import type { PlaceRef } from '@/src/types';

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

type OpenMeteoHit = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
};

export function mapsUrl(place: PlaceRef): string {
  return `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`;
}

export function embedUrl(place: PlaceRef): string {
  const pad = 0.012;
  const minLon = place.lon - pad;
  const minLat = place.lat - pad * 0.7;
  const maxLon = place.lon + pad;
  const maxLat = place.lat + pad * 0.7;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${place.lat}%2C${place.lon}`;
}

function labelOf(parts: Array<string | undefined>): string | undefined {
  const cleaned = parts.filter((part): part is string => Boolean(part && part.trim()));
  return cleaned.length ? cleaned.join(', ') : undefined;
}

export async function searchPlaces(query: string): Promise<PlaceRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const photon = await searchPhoton(q);
  if (photon.length) return photon;

  const meteo = await searchOpenMeteo(q);
  if (meteo.length) return meteo;

  return searchNominatim(q);
}

async function searchPhoton(q: string): Promise<PlaceRef[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { features?: PhotonFeature[] };
    const found: PlaceRef[] = [];
    for (const feature of json.features ?? []) {
      const [lon, lat] = feature.geometry?.coordinates ?? [];
      if (typeof lat !== 'number' || typeof lon !== 'number') continue;
      found.push({
        name: feature.properties?.name ?? q,
        lat,
        lon,
        label: labelOf([feature.properties?.street, feature.properties?.city, feature.properties?.state]),
      });
    }
    return found;
  } catch {
    return [];
  }
}

async function searchOpenMeteo(q: string): Promise<PlaceRef[]> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: OpenMeteoHit[] };
    return (json.results ?? []).map((hit) => ({
      name: hit.name,
      lat: hit.latitude,
      lon: hit.longitude,
      label: labelOf([hit.admin1, hit.country]),
    }));
  } catch {
    return [];
  }
}

async function searchNominatim(q: string): Promise<PlaceRef[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Againsoon/1.0 (couple date planning)' },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Array<{ display_name?: string; lat: string; lon: string; name?: string }>;
    return json.map((hit) => ({
      name: hit.name || q,
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      label: hit.display_name,
    }));
  } catch {
    return [];
  }
}
