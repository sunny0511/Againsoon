import { nowIso } from '@/src/lib/dates';
import { applyPresetToCouple } from '@/src/lib/accents';
import { createId, normalizeInviteCode } from '@/src/lib/id';
import {
  createCoupleFromName,
  createDemoState,
  createEmptyState,
  defaultPrepForMeet,
  DEMO_INVITE_CODE,
  workspaceForCouple,
} from '@/src/data/seed';
import type {
  AccentPresetId,
  BudgetVibe,
  DateGoalCadence,
  DateVibe,
  KeyDateKind,
  Meet,
  MemoryPhotoKind,
  PersistedState,
  ProposeInput,
} from '@/src/types';

export type Action =
  | { type: 'HYDRATE'; payload: PersistedState }
  | { type: 'SET_DRAFT_NAME'; name: string }
  | { type: 'START_DEMO' }
  | { type: 'CREATE_COUPLE'; uid?: string }
  | { type: 'JOIN_DEMO_AS_PARTNER' }
  | { type: 'SWITCH_TO_PARTNER'; partnerId: string }
  | { type: 'NAME_PARTNER'; name: string }
  | { type: 'SWITCH_PARTNER' }
  | { type: 'PROPOSE'; id: string; input: ProposeInput }
  | { type: 'ACCEPT'; meetId: string }
  | { type: 'COUNTER'; meetId: string; input: ProposeInput }
  | { type: 'DECLINE'; meetId: string; note?: string }
  | { type: 'WITHDRAW'; meetId: string }
  | { type: 'CANCEL_CONFIRMED'; meetId: string; note?: string }
  | { type: 'SET_LOCATION_SHARING'; enabled: boolean }
  | { type: 'SET_DATE_GOAL'; cadence: DateGoalCadence }
  | { type: 'ADD_WISHLIST'; id: string; title: string; notes?: string; budget: BudgetVibe; vibe?: DateVibe }
  | { type: 'REMOVE_WISHLIST'; id: string }
  | { type: 'ADD_KEY_DATE'; id: string; title: string; kind: KeyDateKind; date: string; annual: boolean }
  | { type: 'REMOVE_KEY_DATE'; id: string }
  | { type: 'ADD_MEMORY'; id: string; meetId: string; note: string; photoUri?: string; photoKind?: MemoryPhotoKind }
  | { type: 'REMOVE_MEMORY'; id: string }
  | { type: 'TOGGLE_PREP'; id: string }
  | { type: 'ADD_PREP'; id: string; meetId: string; text: string; assigneeId?: string }
  | { type: 'REMOVE_PREP'; id: string }
  | { type: 'TOGGLE_CALENDAR_PRIVACY'; calendarId: string }
  | { type: 'SET_ACCENT_PRESET'; presetId: AccentPresetId }
  | { type: 'SET_INVITE'; inviteCode: string; inviteCodeExpiresAt: string }
  | { type: 'RESET' };

function requireCurrent(state: PersistedState): string {
  if (!state.currentPartnerId) {
    throw new Error('No current partner');
  }
  return state.currentPartnerId;
}

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function withCoupleWorkspace(state: PersistedState, couple: PersistedState['couple'], currentPartnerId: string): PersistedState {
  const workspace = couple ? workspaceForCouple(couple) : createEmptyState();
  return {
    ...state,
    onboardingComplete: true,
    couple,
    currentPartnerId,
    meets: [],
    locationSharingByPartnerId: {},
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

export function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'SET_DRAFT_NAME':
      return { ...state, draftName: action.name };
    case 'START_DEMO':
      return createDemoState();
    case 'CREATE_COUPLE': {
      const created = createCoupleFromName(state.draftName, action.uid);
      return withCoupleWorkspace(state, created.couple, created.currentPartnerId);
    }
    case 'JOIN_DEMO_AS_PARTNER': {
      const demo = createDemoState();
      return {
        ...demo,
        currentPartnerId: demo.couple?.partners[1].id ?? demo.currentPartnerId,
      };
    }
    case 'SWITCH_TO_PARTNER':
      return { ...state, currentPartnerId: action.partnerId, onboardingComplete: true };
    case 'NAME_PARTNER': {
      if (!state.couple || !state.currentPartnerId) return state;
      const partners: typeof state.couple.partners = [
        state.couple.partners[0].id === state.currentPartnerId
          ? state.couple.partners[0]
          : {
              ...state.couple.partners[0],
              name: action.name.trim() || state.couple.partners[0].name,
              isPlaceholder: false,
            },
        state.couple.partners[1].id === state.currentPartnerId
          ? state.couple.partners[1]
          : {
              ...state.couple.partners[1],
              name: action.name.trim() || state.couple.partners[1].name,
              isPlaceholder: false,
            },
      ];
      return { ...state, couple: { ...state.couple, partners } };
    }
    case 'SWITCH_PARTNER': {
      if (!state.couple || !state.currentPartnerId) return state;
      const other = state.couple.partners.find((partner) => partner.id !== state.currentPartnerId);
      return other ? { ...state, currentPartnerId: other.id } : state;
    }
    case 'PROPOSE': {
      const authorId = requireCurrent(state);
      const meet: Meet = {
        id: action.id,
        status: 'pending',
        createdAt: nowIso(),
        wishlistItemId: action.input.wishlistItemId,
        revisions: [
          {
            id: createId('rev'),
            authorId,
            startsAt: action.input.startsAt,
            endsAt: action.input.endsAt,
            location: trimOptional(action.input.location),
            notes: trimOptional(action.input.notes),
            createdAt: nowIso(),
          },
        ],
      };
      return { ...state, meets: [meet, ...state.meets] };
    }
    case 'ACCEPT': {
      const partnerId = requireCurrent(state);
      const target = state.meets.find((meet) => meet.id === action.meetId);
      const alreadyPrepped = state.datePrep.some((item) => item.meetId === action.meetId);
      return {
        ...state,
        meets: state.meets.map((meet) => {
          if (meet.id !== action.meetId || meet.status !== 'pending') return meet;
          return {
            ...meet,
            status: 'confirmed' as const,
            confirmedAt: nowIso(),
            revisions: [
              ...meet.revisions,
              {
                ...meet.revisions[meet.revisions.length - 1],
                id: createId('rev'),
                authorId: partnerId,
                notes: 'This time works.',
                createdAt: nowIso(),
              },
            ],
          };
        }),
        datePrep:
          target?.status === 'pending' && !alreadyPrepped
            ? [...state.datePrep, ...defaultPrepForMeet(action.meetId)]
            : state.datePrep,
      };
    }
    case 'COUNTER': {
      const authorId = requireCurrent(state);
      return {
        ...state,
        meets: state.meets.map((meet) => {
          if (meet.id !== action.meetId || meet.status !== 'pending') return meet;
          return {
            ...meet,
            revisions: [
              ...meet.revisions,
              {
                id: createId('rev'),
                authorId,
                startsAt: action.input.startsAt,
                endsAt: action.input.endsAt,
                location: trimOptional(action.input.location),
                notes: trimOptional(action.input.notes),
                createdAt: nowIso(),
              },
            ],
          };
        }),
      };
    }
    case 'DECLINE': {
      const partnerId = requireCurrent(state);
      return {
        ...state,
        meets: state.meets.map((meet) => {
          if (meet.id !== action.meetId || meet.status !== 'pending') return meet;
          return {
            ...meet,
            status: 'declined' as const,
            declinedAt: nowIso(),
            declinedById: partnerId,
            declineNote: trimOptional(action.note),
          };
        }),
      };
    }
    case 'WITHDRAW': {
      const partnerId = requireCurrent(state);
      return {
        ...state,
        meets: state.meets.map((meet) => {
          if (meet.id !== action.meetId || meet.status !== 'pending') return meet;
          return {
            ...meet,
            status: 'declined' as const,
            declinedAt: nowIso(),
            declinedById: partnerId,
            withdrawn: true,
            declineNote: 'Withdrawn before they answered.',
          };
        }),
      };
    }
    case 'CANCEL_CONFIRMED': {
      const partnerId = requireCurrent(state);
      return {
        ...state,
        meets: state.meets.map((meet) => {
          if (meet.id !== action.meetId || meet.status !== 'confirmed') return meet;
          return {
            ...meet,
            status: 'declined' as const,
            declinedAt: nowIso(),
            declinedById: partnerId,
            declineNote: trimOptional(action.note) ?? 'This meet was cancelled.',
          };
        }),
      };
    }
    case 'SET_LOCATION_SHARING': {
      if (!state.currentPartnerId) return state;
      return {
        ...state,
        locationSharingByPartnerId: {
          ...state.locationSharingByPartnerId,
          [state.currentPartnerId]: action.enabled,
        },
      };
    }
    case 'SET_DATE_GOAL':
      return { ...state, dateGoal: { cadence: action.cadence } };
    case 'ADD_WISHLIST': {
      const authorId = requireCurrent(state);
      return {
        ...state,
        wishlist: [
          {
            id: action.id,
            title: action.title.trim(),
            notes: trimOptional(action.notes),
            budget: action.budget,
            vibe: action.vibe,
            createdAt: nowIso(),
            createdById: authorId,
          },
          ...state.wishlist,
        ],
      };
    }
    case 'REMOVE_WISHLIST':
      return { ...state, wishlist: state.wishlist.filter((item) => item.id !== action.id) };
    case 'ADD_KEY_DATE':
      return {
        ...state,
        keyDates: [
          ...state.keyDates,
          {
            id: action.id,
            title: action.title.trim(),
            kind: action.kind,
            date: action.date,
            annual: action.annual,
            reminderDaysBefore: action.kind === 'trip' ? [7, 1] : [14, 7, 1],
          },
        ],
      };
    case 'REMOVE_KEY_DATE':
      return { ...state, keyDates: state.keyDates.filter((item) => item.id !== action.id) };
    case 'ADD_MEMORY': {
      const authorId = requireCurrent(state);
      return {
        ...state,
        memories: [
          {
            id: action.id,
            meetId: action.meetId,
            note: action.note.trim(),
            photoUri: action.photoUri,
            photoKind: action.photoKind ?? (action.photoUri ? 'custom' : 'lantern'),
            createdAt: nowIso(),
            authorId,
          },
          ...state.memories,
        ],
      };
    }
    case 'REMOVE_MEMORY':
      return { ...state, memories: state.memories.filter((item) => item.id !== action.id) };
    case 'TOGGLE_PREP':
      return {
        ...state,
        datePrep: state.datePrep.map((item) =>
          item.id === action.id ? { ...item, done: !item.done } : item,
        ),
      };
    case 'ADD_PREP':
      return {
        ...state,
        datePrep: [
          ...state.datePrep,
          {
            id: action.id,
            meetId: action.meetId,
            text: action.text.trim(),
            done: false,
            assigneeId: action.assigneeId,
          },
        ],
      };
    case 'REMOVE_PREP':
      return { ...state, datePrep: state.datePrep.filter((item) => item.id !== action.id) };
    case 'TOGGLE_CALENDAR_PRIVACY':
      return {
        ...state,
        calendars: state.calendars.map((item) =>
          item.id === action.calendarId
            ? { ...item, showDetailsToPartner: !item.showDetailsToPartner }
            : item,
        ),
      };
    case 'SET_ACCENT_PRESET': {
      if (!state.couple) return { ...state, accentPresetId: action.presetId };
      return {
        ...state,
        accentPresetId: action.presetId,
        couple: applyPresetToCouple(state.couple, action.presetId),
      };
    }
    case 'SET_INVITE': {
      if (!state.couple) return state;
      return {
        ...state,
        couple: {
          ...state.couple,
          inviteCode: action.inviteCode,
          inviteCodeExpiresAt: action.inviteCodeExpiresAt,
        },
      };
    }
    case 'RESET':
      return createEmptyState();
    default:
      return state;
  }
}

export function localJoin(state: PersistedState, code: string): { next: PersistedState; error?: string } {
  const normalized = normalizeInviteCode(code);
  if (normalized === DEMO_INVITE_CODE || normalized === 'DEMO') {
    return { next: reducer(state, { type: 'JOIN_DEMO_AS_PARTNER' }) };
  }
  if (state.couple && normalizeInviteCode(state.couple.inviteCode) === normalized) {
    const other = state.couple.partners.find((partner) => partner.id !== state.currentPartnerId);
    if (!other) return { next: state, error: 'That couple is already you.' };
    return { next: reducer(state, { type: 'SWITCH_TO_PARTNER', partnerId: other.id }) };
  }
  return {
    next: state,
    error: 'No couple uses that code on this device. Sign in to join a live couple.',
  };
}
