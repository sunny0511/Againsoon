import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { nowIso } from '@/src/lib/dates';
import { applyPresetToCouple } from '@/src/lib/accents';
import { createId, normalizeInviteCode } from '@/src/lib/id';
import { clearState, loadState, saveState } from '@/src/data/persist';
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

type Action =
  | { type: 'HYDRATE'; payload: PersistedState }
  | { type: 'SET_DRAFT_NAME'; name: string }
  | { type: 'START_DEMO' }
  | { type: 'CREATE_COUPLE' }
  | { type: 'JOIN_WITH_CODE'; code: string }
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

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'SET_DRAFT_NAME':
      return { ...state, draftName: action.name };
    case 'START_DEMO':
      return createDemoState();
    case 'CREATE_COUPLE': {
      const created = createCoupleFromName(state.draftName);
      return withCoupleWorkspace(state, created.couple, created.currentPartnerId);
    }
    case 'JOIN_WITH_CODE': {
      const code = normalizeInviteCode(action.code);
      if (code === DEMO_INVITE_CODE || code === 'DEMO') {
        const demo = createDemoState();
        return {
          ...demo,
          currentPartnerId: demo.couple?.partners[1].id ?? demo.currentPartnerId,
        };
      }
      if (state.couple && normalizeInviteCode(state.couple.inviteCode) === code) {
        const other = state.couple.partners.find((partner) => partner.id !== state.currentPartnerId);
        return other ? { ...state, currentPartnerId: other.id, onboardingComplete: true } : state;
      }
      const created = createCoupleFromName(state.draftName || 'You');
      created.couple.inviteCode = code;
      created.couple.partners[1] = {
        ...created.couple.partners[1],
        name: 'Your person',
        isPlaceholder: true,
      };
      return withCoupleWorkspace(state, created.couple, created.currentPartnerId);
    }
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
    case 'RESET':
      return createEmptyState();
    default:
      return state;
  }
}

type StoreValue = {
  hydrated: boolean;
  state: PersistedState;
  setDraftName: (name: string) => void;
  startDemo: () => void;
  createCouple: () => void;
  joinWithCode: (code: string) => void;
  namePartner: (name: string) => void;
  switchPartner: () => void;
  propose: (input: ProposeInput) => string;
  accept: (meetId: string) => void;
  counter: (meetId: string, input: ProposeInput) => void;
  decline: (meetId: string, note?: string) => void;
  withdraw: (meetId: string) => void;
  cancelConfirmed: (meetId: string, note?: string) => void;
  setLocationSharing: (enabled: boolean) => void;
  setDateGoal: (cadence: DateGoalCadence) => void;
  addWishlistItem: (input: { title: string; notes?: string; budget: BudgetVibe; vibe?: DateVibe }) => void;
  removeWishlistItem: (id: string) => void;
  addKeyDate: (input: { title: string; kind: KeyDateKind; date: string; annual: boolean }) => void;
  removeKeyDate: (id: string) => void;
  addMemory: (input: {
    meetId: string;
    note: string;
    photoUri?: string;
    photoKind?: MemoryPhotoKind;
  }) => void;
  removeMemory: (id: string) => void;
  togglePrep: (id: string) => void;
  addPrep: (meetId: string, text: string, assigneeId?: string) => void;
  removePrep: (id: string) => void;
  toggleCalendarPrivacy: (calendarId: string) => void;
  setAccentPreset: (presetId: AccentPresetId) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createEmptyState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadState().then((saved) => {
      if (!active) return;
      dispatch({ type: 'HYDRATE', payload: saved ?? createEmptyState() });
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state).catch(() => {});
  }, [hydrated, state]);

  const propose = useCallback((input: ProposeInput) => {
    const id = createId('meet');
    dispatch({
      type: 'PROPOSE',
      id,
      input,
    });
    return id;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      state,
      setDraftName: (name) => dispatch({ type: 'SET_DRAFT_NAME', name }),
      startDemo: () => dispatch({ type: 'START_DEMO' }),
      createCouple: () => dispatch({ type: 'CREATE_COUPLE' }),
      joinWithCode: (code) => dispatch({ type: 'JOIN_WITH_CODE', code }),
      namePartner: (name) => dispatch({ type: 'NAME_PARTNER', name }),
      switchPartner: () => dispatch({ type: 'SWITCH_PARTNER' }),
      propose,
      accept: (meetId) => dispatch({ type: 'ACCEPT', meetId }),
      counter: (meetId, input) => dispatch({ type: 'COUNTER', meetId, input }),
      decline: (meetId, note) => dispatch({ type: 'DECLINE', meetId, note }),
      withdraw: (meetId) => dispatch({ type: 'WITHDRAW', meetId }),
      cancelConfirmed: (meetId, note) => dispatch({ type: 'CANCEL_CONFIRMED', meetId, note }),
      setLocationSharing: (enabled) => dispatch({ type: 'SET_LOCATION_SHARING', enabled }),
      setDateGoal: (cadence) => dispatch({ type: 'SET_DATE_GOAL', cadence }),
      addWishlistItem: (input) =>
        dispatch({ type: 'ADD_WISHLIST', id: createId('wish'), ...input }),
      removeWishlistItem: (id) => dispatch({ type: 'REMOVE_WISHLIST', id }),
      addKeyDate: (input) => dispatch({ type: 'ADD_KEY_DATE', id: createId('key'), ...input }),
      removeKeyDate: (id) => dispatch({ type: 'REMOVE_KEY_DATE', id }),
      addMemory: (input) => dispatch({ type: 'ADD_MEMORY', id: createId('mem'), ...input }),
      removeMemory: (id) => dispatch({ type: 'REMOVE_MEMORY', id }),
      togglePrep: (id) => dispatch({ type: 'TOGGLE_PREP', id }),
      addPrep: (meetId, text, assigneeId) =>
        dispatch({ type: 'ADD_PREP', id: createId('prep'), meetId, text, assigneeId }),
      removePrep: (id) => dispatch({ type: 'REMOVE_PREP', id }),
      toggleCalendarPrivacy: (calendarId) => dispatch({ type: 'TOGGLE_CALENDAR_PRIVACY', calendarId }),
      setAccentPreset: (presetId) => dispatch({ type: 'SET_ACCENT_PRESET', presetId }),
      reset: () => {
        clearState().catch(() => {});
        dispatch({ type: 'RESET' });
      },
    }),
    [hydrated, propose, state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return value;
}

export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext);
}
