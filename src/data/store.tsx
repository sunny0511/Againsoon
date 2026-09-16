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
import { createId, normalizeInviteCode } from '@/src/lib/id';
import { clearState, loadState, saveState } from '@/src/data/persist';
import { extrasDefaults } from '@/src/data/persist';
import {
  createCoupleFromName,
  createDemoState,
  createEmptyState,
  DEMO_INVITE_CODE,
} from '@/src/data/seed';
import type {
  BusyBlock,
  KeyDate,
  ListItem,
  Meet,
  Memory,
  PersistedState,
  ProposeInput,
  WishlistItem,
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
  | { type: 'SET_DATE_GOAL'; cadenceDays: 7 | 14 | 30 }
  | { type: 'ADD_BUSY'; block: Omit<BusyBlock, 'id'> }
  | { type: 'REMOVE_BUSY'; id: string }
  | { type: 'ADD_WISH_ITEM'; item: Omit<WishlistItem, 'id' | 'createdAt'> }
  | { type: 'TOGGLE_WISH_PRIVATE'; id: string }
  | { type: 'REMOVE_WISH_ITEM'; id: string }
  | { type: 'ADD_KEY_DATE'; item: Omit<KeyDate, 'id'> }
  | { type: 'ADD_LIST_ITEM'; item: Omit<ListItem, 'id' | 'createdAt' | 'done'> }
  | { type: 'TOGGLE_LIST_ITEM'; id: string }
  | { type: 'ADD_MEMORY'; item: Omit<Memory, 'id' | 'createdAt'> }
  | { type: 'RESET' };

function requireCurrent(state: PersistedState): string {
  if (!state.currentPartnerId) {
    throw new Error('No current partner');
  }
  return state.currentPartnerId;
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
      return {
        ...createEmptyState(),
        ...extrasDefaults(),
        onboardingComplete: true,
        draftName: state.draftName,
        couple: created.couple,
        currentPartnerId: created.currentPartnerId,
      };
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
      return {
        ...createEmptyState(),
        ...extrasDefaults(),
        onboardingComplete: true,
        draftName: state.draftName,
        couple: created.couple,
        currentPartnerId: created.currentPartnerId,
      };
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
      return { ...state, dateGoal: { cadenceDays: action.cadenceDays } };
    case 'ADD_BUSY':
      return {
        ...state,
        busyBlocks: [{ ...action.block, id: createId('busy') }, ...state.busyBlocks],
      };
    case 'REMOVE_BUSY':
      return { ...state, busyBlocks: state.busyBlocks.filter((block) => block.id !== action.id) };
    case 'ADD_WISH_ITEM':
      return {
        ...state,
        wishlistItems: [
          {
            ...action.item,
            id: createId('wi'),
            createdAt: nowIso(),
          },
          ...state.wishlistItems,
        ],
      };
    case 'TOGGLE_WISH_PRIVATE':
      return {
        ...state,
        wishlistItems: state.wishlistItems.map((item) =>
          item.id === action.id ? { ...item, isPrivate: !item.isPrivate } : item,
        ),
      };
    case 'REMOVE_WISH_ITEM':
      return { ...state, wishlistItems: state.wishlistItems.filter((item) => item.id !== action.id) };
    case 'ADD_KEY_DATE':
      return {
        ...state,
        keyDates: [{ ...action.item, id: createId('kd') }, ...state.keyDates],
      };
    case 'ADD_LIST_ITEM':
      return {
        ...state,
        listItems: [
          { ...action.item, id: createId('li'), done: false, createdAt: nowIso() },
          ...state.listItems,
        ],
      };
    case 'TOGGLE_LIST_ITEM':
      return {
        ...state,
        listItems: state.listItems.map((item) =>
          item.id === action.id ? { ...item, done: !item.done } : item,
        ),
      };
    case 'ADD_MEMORY':
      return {
        ...state,
        memories: [
          { ...action.item, id: createId('mem'), createdAt: nowIso() },
          ...state.memories,
        ],
      };
    case 'RESET':
      return createEmptyState();
    default:
      return state;
  }
}

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
  setDateGoal: (cadenceDays: 7 | 14 | 30) => void;
  addBusy: (block: Omit<BusyBlock, 'id'>) => void;
  removeBusy: (id: string) => void;
  addWishItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  toggleWishPrivate: (id: string) => void;
  removeWishItem: (id: string) => void;
  addKeyDate: (item: Omit<KeyDate, 'id'>) => void;
  addListItem: (item: Omit<ListItem, 'id' | 'createdAt' | 'done'>) => void;
  toggleListItem: (id: string) => void;
  addMemory: (item: Omit<Memory, 'id' | 'createdAt'>) => void;
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
      setDateGoal: (cadenceDays) => dispatch({ type: 'SET_DATE_GOAL', cadenceDays }),
      addBusy: (block) => dispatch({ type: 'ADD_BUSY', block }),
      removeBusy: (id) => dispatch({ type: 'REMOVE_BUSY', id }),
      addWishItem: (item) => dispatch({ type: 'ADD_WISH_ITEM', item }),
      toggleWishPrivate: (id) => dispatch({ type: 'TOGGLE_WISH_PRIVATE', id }),
      removeWishItem: (id) => dispatch({ type: 'REMOVE_WISH_ITEM', id }),
      addKeyDate: (item) => dispatch({ type: 'ADD_KEY_DATE', item }),
      addListItem: (item) => dispatch({ type: 'ADD_LIST_ITEM', item }),
      toggleListItem: (id) => dispatch({ type: 'TOGGLE_LIST_ITEM', id }),
      addMemory: (item) => dispatch({ type: 'ADD_MEMORY', item }),
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
