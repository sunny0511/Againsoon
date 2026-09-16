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
};

export type MeetStatus = 'pending' | 'confirmed' | 'declined';

export type MeetRevision = {
  id: string;
  authorId: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
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
};

export type ProposeInput = {
  startsAt: string;
  endsAt?: string;
  location?: string;
  notes?: string;
};

export type DateGoal = {
  cadenceDays: 7 | 14 | 30;
};

export type BusyBlock = {
  id: string;
  partnerId: string;
  startsAt: string;
  endsAt: string;
  title: string;
  visibility: 'details' | 'busy';
};

export type Wishlist = {
  id: string;
  title: string;
  emoji: string;
};

export type WishlistItem = {
  id: string;
  listId: string;
  title: string;
  note?: string;
  savedById: string;
  isPrivate: boolean;
  createdAt: string;
};

export type KeyDate = {
  id: string;
  title: string;
  month: number;
  day: number;
  year?: number;
  recurringYearly: boolean;
  note?: string;
};

export type SharedList = {
  id: string;
  title: string;
  kind: 'groceries' | 'todos' | 'packing';
};

export type ListItem = {
  id: string;
  listId: string;
  title: string;
  done: boolean;
  assigneeId?: string;
  aisle?: string;
  createdAt: string;
};

export type MemoryMood = 'glow' | 'easy' | 'adventure' | 'cozy';

export type Memory = {
  id: string;
  meetId?: string;
  title: string;
  note: string;
  mood: MemoryMood;
  authorId: string;
  createdAt: string;
};

export type PersistedState = {
  version: 3;
  onboardingComplete: boolean;
  draftName: string;
  currentPartnerId: string | null;
  couple: Couple | null;
  meets: Meet[];
  locationSharingByPartnerId: Record<string, boolean>;
  dateGoal: DateGoal;
  busyBlocks: BusyBlock[];
  wishlists: Wishlist[];
  wishlistItems: WishlistItem[];
  keyDates: KeyDate[];
  lists: SharedList[];
  listItems: ListItem[];
  memories: Memory[];
};
