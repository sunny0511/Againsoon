export type Partner = {
  id: string;
  name: string;
  hue: string;
  isPlaceholder?: boolean;
};

export type Couple = {
  id: string;
  inviteCode: string;
  partners: [Partner, Partner];
  usHue: string;
};

export type MeetStatus = 'pending' | 'confirmed' | 'declined';

export type PlaceRef = {
  name: string;
  lat: number;
  lon: number;
  label?: string;
};

export type MeetRevision = {
  id: string;
  authorId: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  place?: PlaceRef;
  notes?: string;
  createdAt: string;
};

export type Meet = {
  id: string;
  status: MeetStatus;
  revisions: MeetRevision[];
  createdAt: string;
  confirmedAt?: string;
  declinedAt?: string;
  declinedById?: string;
  declineNote?: string;
  withdrawn?: boolean;
  wishlistItemId?: string;
};

export type ProposeInput = {
  startsAt: string;
  endsAt?: string;
  location?: string;
  place?: PlaceRef;
  notes?: string;
  wishlistItemId?: string;
};

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'mock';

export type CalendarAccount = {
  id: string;
  partnerId: string;
  name: string;
  provider: CalendarProvider;
  showDetailsToPartner: boolean;
};

export type BusyPattern = {
  id: string;
  calendarId: string;
  title: string;
  weekdays: number[];
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
};

export type DateGoalCadence = 'weekly' | 'biweekly' | 'twiceWeekly' | 'monthly';

export type DateGoal = {
  cadence: DateGoalCadence;
};

export type BudgetVibe = 'free' | '$' | '$$';

export type DateVibe = 'cozy' | 'outdoors' | 'foodie' | 'surprise';

export type WishlistItem = {
  id: string;
  title: string;
  notes?: string;
  budget: BudgetVibe;
  vibe?: DateVibe;
  createdAt: string;
  createdById: string;
};

export type KeyDateKind = 'anniversary' | 'birthday' | 'trip' | 'other';

export type KeyDate = {
  id: string;
  title: string;
  kind: KeyDateKind;
  date: string;
  annual: boolean;
  reminderDaysBefore: number[];
};

export type MemoryPhotoKind = 'river' | 'oven' | 'lantern' | 'wine' | 'walk' | 'custom';

export type Memory = {
  id: string;
  meetId: string;
  note: string;
  photoUri?: string;
  photoKind?: MemoryPhotoKind;
  createdAt: string;
  authorId: string;
};

export type DatePrepItem = {
  id: string;
  meetId: string;
  text: string;
  done: boolean;
  assigneeId?: string;
};

export type SharedListKind = 'groceries' | 'chores';

export type SharedList = {
  id: string;
  kind: SharedListKind;
  title: string;
  meetId?: string;
};

export type SharedListItem = {
  id: string;
  listId: string;
  title: string;
  done: boolean;
  aisle?: string;
  assigneeId?: string;
  createdAt: string;
};

export type AccentPresetId = 'terracotta-sage' | 'blush-sea' | 'honey-plum' | 'coral-dusk';

export type PersistedState = {
  version: 3;
  onboardingComplete: boolean;
  draftName: string;
  currentPartnerId: string | null;
  couple: Couple | null;
  meets: Meet[];
  locationSharingByPartnerId: Record<string, boolean>;
  calendars: CalendarAccount[];
  busyPatterns: BusyPattern[];
  dateGoal: DateGoal;
  wishlist: WishlistItem[];
  keyDates: KeyDate[];
  memories: Memory[];
  datePrep: DatePrepItem[];
  lists: SharedList[];
  listItems: SharedListItem[];
  widgetEnabled: boolean;
  accentPresetId: AccentPresetId;
};
