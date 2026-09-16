import type { AccentPresetId, Couple } from '@/src/types';
import { ACCENT_PRESETS } from '@/src/theme';

export function presetById(id: AccentPresetId) {
  return ACCENT_PRESETS.find((item) => item.id === id) ?? ACCENT_PRESETS[0];
}

export function applyPresetToCouple(couple: Couple, presetId: AccentPresetId): Couple {
  const preset = presetById(presetId);
  return {
    ...couple,
    usHue: preset.us,
    partners: [
      { ...couple.partners[0], hue: preset.me },
      { ...couple.partners[1], hue: preset.them },
    ],
  };
}

export function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const clamped = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${raw}${clamped}`;
}
