import { completeChat, parseJsonPayload } from '@/src/lib/llm';
import type { BudgetVibe, DateVibe, WishlistItem } from '@/src/types';

export type AssistTemplate = {
  id: string;
  title: string;
  notes: string;
  location?: string;
  budget: BudgetVibe;
  vibe: DateVibe;
};

export const ASSIST_TEMPLATES: AssistTemplate[] = [
  {
    id: 'tpl_candles',
    title: 'Candlelit dinner in',
    notes: 'Phones in a drawer. One pan, one playlist, the good glasses.',
    location: 'Our kitchen',
    budget: '$',
    vibe: 'cozy',
  },
  {
    id: 'tpl_blanket',
    title: 'Blanket fort + a film you both skipped',
    notes: 'Make it a little ceremonial — snacks plated, lights low.',
    location: 'Home',
    budget: 'free',
    vibe: 'cozy',
  },
  {
    id: 'tpl_hike',
    title: 'Sunrise or golden-hour walk',
    notes: 'No destination. Stop for something warm on the way back.',
    location: 'The loop you like',
    budget: 'free',
    vibe: 'outdoors',
  },
  {
    id: 'tpl_picnic',
    title: 'Pocket picnic',
    notes: 'Fruit, something sparkling, a blanket that has seen things.',
    location: 'A patch of grass',
    budget: '$',
    vibe: 'outdoors',
  },
  {
    id: 'tpl_newspot',
    title: 'A place neither of you has been',
    notes: 'Pick the neighborhood first, wander until a table feels right.',
    budget: '$$',
    vibe: 'foodie',
  },
  {
    id: 'tpl_market',
    title: 'Market haul, then cook it',
    notes: 'Buy whatever looks alive. Figure out dinner together.',
    location: 'Home kitchen',
    budget: '$',
    vibe: 'foodie',
  },
  {
    id: 'tpl_drive',
    title: 'Night drive + dessert',
    notes: 'A long way around for something sweet. Windows down if the air allows.',
    budget: '$',
    vibe: 'surprise',
  },
  {
    id: 'tpl_secret',
    title: 'Let one of you plan the hour',
    notes: 'The other only needs a time and a “wear something you like.”',
    budget: '$',
    vibe: 'surprise',
  },
];

export type AssistSource = 'wishlist' | 'recipe' | 'cloud';

export type AssistSuggestion = {
  id: string;
  title: string;
  notes: string;
  location?: string;
  budget: BudgetVibe;
  vibe: DateVibe;
  source: AssistSource;
  wishlistItemId?: string;
};

export type AssistResult = {
  suggestions: AssistSuggestion[];
  via: 'cloud' | 'on-device';
  model?: string;
};

function scoreItem(
  vibe: DateVibe,
  budget: BudgetVibe,
  itemVibe?: DateVibe,
  itemBudget?: BudgetVibe,
): number {
  let score = 0;
  if (itemVibe === vibe) score += 5;
  if (vibe === 'surprise') score += 1;
  if (itemBudget === budget) score += 3;
  if (budget === '$$' && itemBudget === '$') score += 1;
  if (budget === '$' && itemBudget === 'free') score += 1;
  return score;
}

export function suggestDates(
  wishlist: WishlistItem[],
  vibe: DateVibe,
  budget: BudgetVibe,
): AssistSuggestion[] {
  const fromWishlist: AssistSuggestion[] = wishlist
    .map((item) => ({
      item,
      score: scoreItem(vibe, budget, item.vibe, item.budget) + 2,
    }))
    .filter((entry) => entry.score > 0 || vibe === 'surprise')
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => ({
      id: `wish-${item.id}`,
      title: item.title,
      notes: item.notes ?? '',
      budget: item.budget,
      vibe: item.vibe ?? vibe,
      source: 'wishlist' as const,
      wishlistItemId: item.id,
    }));

  const fromRecipes: AssistSuggestion[] = ASSIST_TEMPLATES.map((item) => ({
    item,
    score: scoreItem(vibe, budget, item.vibe, item.budget),
  }))
    .filter((entry) => entry.score >= 3 || vibe === 'surprise')
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => ({
      id: item.id,
      title: item.title,
      notes: item.notes,
      location: item.location,
      budget: item.budget,
      vibe: item.vibe,
      source: 'recipe' as const,
    }));

  const merged: AssistSuggestion[] = [];
  const seen = new Set<string>();
  for (const suggestion of [...fromWishlist, ...fromRecipes]) {
    const key = suggestion.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(suggestion);
    if (merged.length >= 3) break;
  }

  if (merged.length < 2) {
    for (const item of ASSIST_TEMPLATES) {
      if (merged.length >= 3) break;
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: item.id,
        title: item.title,
        notes: item.notes,
        location: item.location,
        budget: item.budget,
        vibe: item.vibe,
        source: 'recipe',
      });
    }
  }

  return merged.slice(0, 3);
}

const VIBES: DateVibe[] = ['cozy', 'outdoors', 'foodie', 'surprise'];
const BUDGETS: BudgetVibe[] = ['free', '$', '$$'];

export async function suggestDatesAssist(
  wishlist: WishlistItem[],
  vibe: DateVibe,
  budget: BudgetVibe,
  windowLabel: 'weeknight' | 'weekend',
): Promise<AssistResult> {
  const fallback = suggestDates(wishlist, vibe, budget);
  try {
    const cloud = await suggestDatesFromCloud(wishlist, vibe, budget, windowLabel);
    if (cloud.suggestions.length >= 2) return cloud;
  } catch {
    // Local scorer still works if the cloud model is down or blocked.
  }
  return { suggestions: fallback, via: 'on-device' };
}

async function suggestDatesFromCloud(
  wishlist: WishlistItem[],
  vibe: DateVibe,
  budget: BudgetVibe,
  windowLabel: 'weeknight' | 'weekend',
): Promise<AssistResult> {
  const wishLines = wishlist.length
    ? wishlist.map((item) => `- ${item.title}${item.notes ? ` (${item.notes})` : ''} [${item.budget}/${item.vibe ?? 'any'}]`).join('\n')
    : '- (wishlist empty)';

  const { text, model } = await completeChat([
    {
      role: 'system',
      content:
        'You are Againsoon Assist, a couples date-planning helper. Reply with JSON only, no markdown. Shape: {"ideas":[{"title":string,"notes":string,"location":string,"budget":"free"|"$"|"$$","vibe":"cozy"|"outdoors"|"foodie"|"surprise"}]}. Give 2 or 3 specific, warm, doable ideas. Prefer the couple wishlist when it fits. Keep notes to one or two sentences.',
    },
    {
      role: 'user',
      content: `Vibe: ${vibe}. Budget: ${budget}. Window: ${windowLabel}.\nWishlist:\n${wishLines}`,
    },
  ]);

  const parsed = parseJsonPayload<{ ideas?: Array<Record<string, string>> }>(text);
  const ideas = parsed?.ideas ?? [];
  const suggestions: AssistSuggestion[] = [];
  for (const [index, idea] of ideas.entries()) {
    const title = idea.title?.trim();
    if (!title) continue;
    const ideaBudget = BUDGETS.includes(idea.budget as BudgetVibe) ? (idea.budget as BudgetVibe) : budget;
    const ideaVibe = VIBES.includes(idea.vibe as DateVibe) ? (idea.vibe as DateVibe) : vibe;
    const match = wishlist.find((item) => item.title.toLowerCase() === title.toLowerCase());
    const location = idea.location?.trim();
    suggestions.push({
      id: `cloud-${index}-${title.slice(0, 18)}`,
      title,
      notes: idea.notes?.trim() || 'A night that fits the two of you.',
      location: location || undefined,
      budget: ideaBudget,
      vibe: ideaVibe,
      source: match ? 'wishlist' : 'cloud',
      wishlistItemId: match?.id,
    });
    if (suggestions.length >= 3) break;
  }

  return { suggestions, via: 'cloud', model };
}

export const VIBE_COPY: Record<DateVibe, string> = {
  cozy: 'Cozy',
  outdoors: 'Outdoors',
  foodie: 'Foodie',
  surprise: 'Surprise',
};

export const BUDGET_COPY: Record<BudgetVibe, string> = {
  free: 'Free',
  $: '$',
  $$: '$$',
};
