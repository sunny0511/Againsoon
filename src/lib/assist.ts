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

export type AssistSuggestion = {
  id: string;
  title: string;
  notes: string;
  location?: string;
  budget: BudgetVibe;
  vibe: DateVibe;
  source: 'wishlist' | 'recipe';
  wishlistItemId?: string;
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
