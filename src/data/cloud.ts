import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

import { nowIso } from '@/src/lib/dates';
import { getFirebaseDb } from '@/src/lib/firebase';
import { freshInviteCode, inviteExpiresAt, isInviteExpired } from '@/src/lib/invite';
import { errorMessage, log } from '@/src/lib/log';
import { createCoupleFromName, workspaceForCouple } from '@/src/data/seed';
import type {
  AccentPresetId,
  AuthUser,
  BusyPattern,
  CalendarAccount,
  Couple,
  DateGoal,
  DatePrepItem,
  KeyDate,
  Meet,
  Memory,
  Partner,
  PersistedState,
  WishlistItem,
} from '@/src/types';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string | null;
  coupleId: string | null;
  partnerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoupleWorkspace = {
  couple: Couple;
  meets: Meet[];
  wishlist: WishlistItem[];
  keyDates: KeyDate[];
  memories: Memory[];
  datePrep: DatePrepItem[];
  calendars: CalendarAccount[];
  busyPatterns: BusyPattern[];
  dateGoal: DateGoal;
  accentPresetId: AccentPresetId;
  locationSharingByPartnerId: Record<string, boolean>;
};

export type ActionResult = { error?: string };

const WORKSPACE_KEYS = [
  'meets',
  'wishlist',
  'keyDates',
  'memories',
  'datePrep',
  'calendars',
  'busyPatterns',
] as const;

type WorkspaceKey = (typeof WORKSPACE_KEYS)[number];

function dbOrThrow(): Firestore {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase isn’t configured on this build.');
  return db;
}

function omitUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitUndefinedDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      out[key] = omitUndefinedDeep(entry);
    }
    return out;
  }
  return value;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return omitUndefinedDeep(value) as T;
}

function partnerPayload(partner: Partner): Partner {
  return omitUndefined({
    id: partner.id,
    name: partner.name,
    hue: partner.hue,
    isPlaceholder: partner.isPlaceholder,
    uid: partner.uid,
  });
}

export function toAuthUser(profile: UserProfile): AuthUser {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
  };
}

export function workspaceToState(
  workspace: CoupleWorkspace,
  currentPartnerId: string,
  draftName: string,
): PersistedState {
  return {
    version: 3,
    onboardingComplete: true,
    draftName,
    currentPartnerId,
    couple: workspace.couple,
    meets: workspace.meets,
    locationSharingByPartnerId: workspace.locationSharingByPartnerId,
    calendars: workspace.calendars,
    busyPatterns: workspace.busyPatterns,
    dateGoal: workspace.dateGoal,
    wishlist: workspace.wishlist,
    keyDates: workspace.keyDates,
    memories: workspace.memories,
    datePrep: workspace.datePrep,
    accentPresetId: workspace.accentPresetId,
  };
}

function coupleDoc(couple: Couple, extra: {
  dateGoal: DateGoal;
  accentPresetId: AccentPresetId;
  locationSharingByPartnerId: Record<string, boolean>;
  createdAt?: string;
}) {
  const expiry = couple.inviteCodeExpiresAt
    ? { iso: couple.inviteCodeExpiresAt, ms: Date.parse(couple.inviteCodeExpiresAt) }
    : inviteExpiresAt();
  return omitUndefined({
    inviteCode: couple.inviteCode,
    inviteCodeExpiresAt: expiry.iso,
    expiresAtMs: expiry.ms,
    memberUids: couple.memberUids ?? couple.partners.map((p) => p.uid).filter(Boolean),
    partners: couple.partners.map(partnerPayload),
    usHue: couple.usHue,
    accentPresetId: extra.accentPresetId,
    dateGoal: extra.dateGoal,
    locationSharingByPartnerId: extra.locationSharingByPartnerId,
    createdAt: extra.createdAt,
    updatedAt: nowIso(),
  });
}

export async function ensureUserProfile(
  user: { uid: string; email: string | null; displayName: string | null },
  displayName?: string,
): Promise<UserProfile> {
  const db = dbOrThrow();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const name = displayName?.trim() || user.displayName?.trim() || 'You';
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: name,
      email: user.email,
      coupleId: null,
      partnerId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await setDoc(ref, profile);
    return profile;
  }
  const data = snap.data() as UserProfile;
  const next: UserProfile = {
    ...data,
    uid: user.uid,
    email: user.email ?? data.email ?? null,
    displayName: displayName?.trim() || data.displayName || name,
    updatedAt: nowIso(),
  };
  if (next.displayName !== data.displayName || next.email !== data.email) {
    await setDoc(ref, next, { merge: true });
  }
  return next;
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = dbOrThrow();
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onChange(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (error) => onError(error),
  );
}

async function allocateInviteCode(db: Firestore): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = freshInviteCode();
    const snap = await getDoc(doc(db, 'inviteCodes', code));
    if (!snap.exists()) return code;
  }
  throw new Error('Couldn’t mint a unique invite code. Try again.');
}

export async function createRemoteCouple(input: {
  uid: string;
  displayName: string;
}): Promise<{ state: PersistedState; profile: UserProfile } | { error: string }> {
  try {
    const db = dbOrThrow();
    const created = createCoupleFromName(input.displayName, input.uid);
    created.couple.inviteCode = await allocateInviteCode(db);
    const workspace = workspaceForCouple(created.couple);
    const expiry = inviteExpiresAt();
    created.couple.inviteCodeExpiresAt = expiry.iso;
    created.couple.memberUids = [input.uid];

    const batch = writeBatch(db);
    const coupleRef = doc(db, 'couples', created.couple.id);
    batch.set(
      coupleRef,
        coupleDoc(created.couple, {
          dateGoal: workspace.dateGoal,
          accentPresetId: workspace.accentPresetId,
          locationSharingByPartnerId: {},
          createdAt: nowIso(),
        }),
    );
    batch.set(doc(db, 'inviteCodes', created.couple.inviteCode), {
      coupleId: created.couple.id,
      expiresAtMs: expiry.ms,
      createdAt: nowIso(),
    });
    batch.set(
      doc(db, 'users', input.uid),
      {
        uid: input.uid,
        displayName: input.displayName,
        coupleId: created.couple.id,
        partnerId: created.currentPartnerId,
        updatedAt: nowIso(),
      },
      { merge: true },
    );
    for (const calendar of workspace.calendars) {
      batch.set(doc(db, 'couples', created.couple.id, 'calendars', calendar.id), calendar);
    }
    for (const pattern of workspace.busyPatterns) {
      batch.set(doc(db, 'couples', created.couple.id, 'busyPatterns', pattern.id), pattern);
    }
    await batch.commit();

    const profile: UserProfile = {
      uid: input.uid,
      displayName: input.displayName,
      email: null,
      coupleId: created.couple.id,
      partnerId: created.currentPartnerId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return {
      profile,
      state: workspaceToState(
        {
          couple: created.couple,
          meets: [],
          wishlist: [],
          keyDates: [],
          memories: [],
          datePrep: [],
          calendars: workspace.calendars,
          busyPatterns: workspace.busyPatterns,
          dateGoal: workspace.dateGoal,
          accentPresetId: workspace.accentPresetId,
          locationSharingByPartnerId: {},
        },
        created.currentPartnerId,
        input.displayName,
      ),
    };
  } catch (error) {
    log.error(error, 'cloud.createCouple');
    return { error: errorMessage(error, 'Couldn’t create a couple. Try again.') };
  }
}

export async function joinRemoteCouple(input: {
  uid: string;
  displayName: string;
  code: string;
}): Promise<{ state: PersistedState; profile: UserProfile } | { error: string }> {
  try {
    const db = dbOrThrow();
    const code = input.code;
    const result = await runTransaction(db, async (tx) => {
      const inviteRef = doc(db, 'inviteCodes', code);
      const inviteSnap = await tx.get(inviteRef);
      if (!inviteSnap.exists()) {
        throw new Error('No couple uses that code.');
      }
      const invite = inviteSnap.data() as { coupleId: string; expiresAtMs: number };
      if (isInviteExpired(invite.expiresAtMs)) {
        throw new Error('That invite has expired. Ask them to rotate the code.');
      }
      const coupleRef = doc(db, 'couples', invite.coupleId);
      const coupleSnap = await tx.get(coupleRef);
      if (!coupleSnap.exists()) {
        throw new Error('No couple uses that code.');
      }
      const data = coupleSnap.data() as {
        memberUids: string[];
        partners: Partner[];
        inviteCode: string;
        inviteCodeExpiresAt?: string;
        usHue: string;
        accentPresetId: AccentPresetId;
        dateGoal: DateGoal;
        locationSharingByPartnerId?: Record<string, boolean>;
      };
      if (data.memberUids.includes(input.uid)) {
        const existing = data.partners.find((partner) => partner.uid === input.uid);
        return {
          coupleId: invite.coupleId,
          partnerId: existing?.id ?? data.partners[1]?.id,
          couple: {
            id: invite.coupleId,
            inviteCode: data.inviteCode,
            inviteCodeExpiresAt: data.inviteCodeExpiresAt,
            partners: data.partners as [Partner, Partner],
            usHue: data.usHue,
            memberUids: data.memberUids,
          } satisfies Couple,
        };
      }
      if (data.memberUids.length >= 2) {
        throw new Error('That couple already has two people.');
      }
      const slotIndex = data.partners.findIndex((partner) => partner.isPlaceholder || !partner.uid);
      const index = slotIndex >= 0 ? slotIndex : 1;
      const partners = [...data.partners] as [Partner, Partner];
      partners[index] = {
        ...partners[index],
        name: input.displayName,
        uid: input.uid,
        isPlaceholder: false,
      };
      const memberUids = [...data.memberUids, input.uid];
      tx.update(coupleRef, {
        memberUids,
        partners: partners.map(partnerPayload),
        updatedAt: nowIso(),
      });
      tx.set(
        doc(db, 'users', input.uid),
        {
          uid: input.uid,
          displayName: input.displayName,
          coupleId: invite.coupleId,
          partnerId: partners[index].id,
          updatedAt: nowIso(),
        },
        { merge: true },
      );
      return {
        coupleId: invite.coupleId,
        partnerId: partners[index].id,
        couple: {
          id: invite.coupleId,
          inviteCode: data.inviteCode,
          inviteCodeExpiresAt: data.inviteCodeExpiresAt,
          partners,
          usHue: data.usHue,
          memberUids,
        } satisfies Couple,
      };
    });

    const profile: UserProfile = {
      uid: input.uid,
      displayName: input.displayName,
      email: null,
      coupleId: result.coupleId,
      partnerId: result.partnerId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const workspace = workspaceForCouple(result.couple);
    return {
      profile,
      state: workspaceToState(
        {
          couple: result.couple,
          meets: [],
          wishlist: [],
          keyDates: [],
          memories: [],
          datePrep: [],
          calendars: workspace.calendars,
          busyPatterns: workspace.busyPatterns,
          dateGoal: workspace.dateGoal,
          accentPresetId: workspace.accentPresetId,
          locationSharingByPartnerId: {},
        },
        result.partnerId,
        input.displayName,
      ),
    };
  } catch (error) {
    log.error(error, 'cloud.joinCouple');
    return { error: errorMessage(error, 'Couldn’t join that couple.') };
  }
}

export async function leaveRemoteCouple(input: {
  uid: string;
  couple: Couple;
}): Promise<ActionResult> {
  try {
    const db = dbOrThrow();
    const memberUids = (input.couple.memberUids ?? []).filter((uid) => uid !== input.uid);
    const partners = input.couple.partners.map((partner) =>
      partner.uid === input.uid
        ? { ...partner, uid: undefined, isPlaceholder: true, name: 'Your person' }
        : partner,
    ) as [Partner, Partner];
    const batch = writeBatch(db);
    batch.update(doc(db, 'couples', input.couple.id), {
      memberUids,
      partners: partners.map(partnerPayload),
      updatedAt: nowIso(),
    });
    batch.set(
      doc(db, 'users', input.uid),
      { coupleId: null, partnerId: null, updatedAt: nowIso() },
      { merge: true },
    );
    await batch.commit();
    return {};
  } catch (error) {
    log.error(error, 'cloud.leaveCouple');
    return { error: errorMessage(error, 'Couldn’t leave this couple.') };
  }
}

export async function rotateRemoteInvite(couple: Couple): Promise<{ inviteCode: string; inviteCodeExpiresAt: string } | { error: string }> {
  try {
    const db = dbOrThrow();
    const nextCode = await allocateInviteCode(db);
    const expiry = inviteExpiresAt();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'inviteCodes', couple.inviteCode));
    batch.set(doc(db, 'inviteCodes', nextCode), {
      coupleId: couple.id,
      expiresAtMs: expiry.ms,
      createdAt: nowIso(),
    });
    batch.update(doc(db, 'couples', couple.id), {
      inviteCode: nextCode,
      inviteCodeExpiresAt: expiry.iso,
      expiresAtMs: expiry.ms,
      updatedAt: nowIso(),
    });
    await batch.commit();
    return { inviteCode: nextCode, inviteCodeExpiresAt: expiry.iso };
  } catch (error) {
    log.error(error, 'cloud.rotateInvite');
    return { error: errorMessage(error, 'Couldn’t rotate the invite code.') };
  }
}

function docsToList<T extends { id: string }>(docs: Array<{ id: string; data: () => unknown }>): T[] {
  return docs.map((item) => ({ id: item.id, ...(item.data() as object) }) as T);
}

export function subscribeCoupleWorkspace(
  coupleId: string,
  onChange: (workspace: CoupleWorkspace | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = dbOrThrow();
  const ready: Record<'couple' | WorkspaceKey, boolean> = {
    couple: false,
    meets: false,
    wishlist: false,
    keyDates: false,
    memories: false,
    datePrep: false,
    calendars: false,
    busyPatterns: false,
  };
  const bucket: {
    couple: Couple | null;
    dateGoal: DateGoal;
    accentPresetId: AccentPresetId;
    locationSharingByPartnerId: Record<string, boolean>;
    meets: Meet[];
    wishlist: WishlistItem[];
    keyDates: KeyDate[];
    memories: Memory[];
    datePrep: DatePrepItem[];
    calendars: CalendarAccount[];
    busyPatterns: BusyPattern[];
  } = {
    couple: null,
    dateGoal: { cadence: 'weekly' },
    accentPresetId: 'terracotta-sage',
    locationSharingByPartnerId: {},
    meets: [],
    wishlist: [],
    keyDates: [],
    memories: [],
    datePrep: [],
    calendars: [],
    busyPatterns: [],
  };

  function emit() {
    if (!Object.values(ready).every(Boolean) || !bucket.couple) return;
    onChange({
      couple: bucket.couple,
      meets: bucket.meets,
      wishlist: bucket.wishlist,
      keyDates: bucket.keyDates,
      memories: bucket.memories,
      datePrep: bucket.datePrep,
      calendars: bucket.calendars,
      busyPatterns: bucket.busyPatterns,
      dateGoal: bucket.dateGoal,
      accentPresetId: bucket.accentPresetId,
      locationSharingByPartnerId: bucket.locationSharingByPartnerId,
    });
  }

  const unsubs: Unsubscribe[] = [
    onSnapshot(
      doc(db, 'couples', coupleId),
      (snap) => {
        if (!snap.exists()) {
          onChange(null);
          return;
        }
        const data = snap.data() as {
          inviteCode: string;
          inviteCodeExpiresAt?: string;
          memberUids?: string[];
          partners: [Partner, Partner];
          usHue: string;
          accentPresetId?: AccentPresetId;
          dateGoal?: DateGoal;
          locationSharingByPartnerId?: Record<string, boolean>;
        };
        bucket.couple = {
          id: snap.id,
          inviteCode: data.inviteCode,
          inviteCodeExpiresAt: data.inviteCodeExpiresAt,
          partners: data.partners,
          usHue: data.usHue,
          memberUids: data.memberUids ?? [],
        };
        bucket.dateGoal = data.dateGoal ?? { cadence: 'weekly' };
        bucket.accentPresetId = data.accentPresetId ?? 'terracotta-sage';
        bucket.locationSharingByPartnerId = data.locationSharingByPartnerId ?? {};
        ready.couple = true;
        emit();
      },
      onError,
    ),
  ];

  for (const key of WORKSPACE_KEYS) {
    unsubs.push(
      onSnapshot(
        collection(db, 'couples', coupleId, key),
        (snap) => {
          (bucket[key] as unknown[]) = docsToList(snap.docs);
          ready[key] = true;
          emit();
        },
        onError,
      ),
    );
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

async function setSubdoc(coupleId: string, collectionName: WorkspaceKey, id: string, data: object) {
  const db = dbOrThrow();
  await setDoc(doc(db, 'couples', coupleId, collectionName, id), omitUndefined(data as Record<string, unknown>));
}

async function deleteSubdoc(coupleId: string, collectionName: WorkspaceKey, id: string) {
  const db = dbOrThrow();
  await deleteDoc(doc(db, 'couples', coupleId, collectionName, id));
}

export async function persistCloudState(
  coupleId: string,
  prev: PersistedState,
  next: PersistedState,
): Promise<void> {
  const db = dbOrThrow();
  const writes: Promise<unknown>[] = [];

  const coupleChanged =
    JSON.stringify(prev.couple) !== JSON.stringify(next.couple) ||
    JSON.stringify(prev.dateGoal) !== JSON.stringify(next.dateGoal) ||
    prev.accentPresetId !== next.accentPresetId ||
    JSON.stringify(prev.locationSharingByPartnerId) !== JSON.stringify(next.locationSharingByPartnerId);

  if (coupleChanged && next.couple) {
    writes.push(
      setDoc(
        doc(db, 'couples', coupleId),
        coupleDoc(next.couple, {
          dateGoal: next.dateGoal,
          accentPresetId: next.accentPresetId,
          locationSharingByPartnerId: next.locationSharingByPartnerId,
          createdAt: undefined,
        }),
        { merge: true },
      ),
    );
  }

  function syncCollection<T extends { id: string }>(key: WorkspaceKey, prevItems: T[], nextItems: T[]) {
    const prevIds = new Set(prevItems.map((item) => item.id));
    const nextIds = new Set(nextItems.map((item) => item.id));
    for (const item of nextItems) {
      const before = prevItems.find((row) => row.id === item.id);
      if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
        writes.push(setSubdoc(coupleId, key, item.id, item));
      }
    }
    for (const id of prevIds) {
      if (!nextIds.has(id)) writes.push(deleteSubdoc(coupleId, key, id));
    }
  }

  syncCollection('meets', prev.meets, next.meets);
  syncCollection('wishlist', prev.wishlist, next.wishlist);
  syncCollection('keyDates', prev.keyDates, next.keyDates);
  syncCollection('memories', prev.memories, next.memories);
  syncCollection('datePrep', prev.datePrep, next.datePrep);
  syncCollection('calendars', prev.calendars, next.calendars);
  syncCollection('busyPatterns', prev.busyPatterns, next.busyPatterns);

  await Promise.all(writes);
}
