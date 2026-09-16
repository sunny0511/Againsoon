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
import {
  createCoupleFromName,
  createDemoState,
  createEmptyState,
  DEMO_INVITE_CODE,
} from '@/src/data/seed';
import type { Meet, PersistedState, ProposeInput } from '@/src/types';

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
        ...state,
        onboardingComplete: true,
        couple: created.couple,
        currentPartnerId: created.currentPartnerId,
        meets: [],
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
        ...state,
        onboardingComplete: true,
        couple: created.couple,
        currentPartnerId: created.currentPartnerId,
        meets: [],
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
