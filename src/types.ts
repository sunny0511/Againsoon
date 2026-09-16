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

export type PersistedState = {
  version: 2;
  onboardingComplete: boolean;
  draftName: string;
  currentPartnerId: string | null;
  couple: Couple | null;
  meets: Meet[];
  locationSharingByPartnerId: Record<string, boolean>;
};
