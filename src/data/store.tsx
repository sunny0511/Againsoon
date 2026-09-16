import * as Linking from 'expo-linking';
import {
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import {
  createRemoteCouple,
  ensureUserProfile,
  joinRemoteCouple,
  leaveRemoteCouple,
  persistCloudState,
  rotateRemoteInvite,
  subscribeCoupleWorkspace,
  subscribeUserProfile,
  toAuthUser,
  workspaceToState,
  type UserProfile,
} from '@/src/data/cloud';
import {
  clearEmailForSignIn,
  clearState,
  loadMode,
  loadState,
  readEmailForSignIn,
  rememberEmailForSignIn,
  saveMode,
  saveState,
} from '@/src/data/persist';
import { localJoin, reducer, type Action } from '@/src/data/reducer';
import { createEmptyState, isDemoCouple } from '@/src/data/seed';
import { getFirebaseAuth } from '@/src/lib/auth';
import { createId, normalizeInviteCode } from '@/src/lib/id';
import { getAuthContinueUrl, isFirebaseConfigured } from '@/src/lib/firebase';
import { errorMessage, installRemoteLogging, log } from '@/src/lib/log';
import type {
  AccentPresetId,
  AuthUser,
  BudgetVibe,
  DateGoalCadence,
  DateVibe,
  KeyDateKind,
  MemoryPhotoKind,
  PersistedState,
  ProposeInput,
  Session,
  SessionKind,
} from '@/src/types';

type ActionResult = { error?: string };

type StoreValue = {
  hydrated: boolean;
  state: PersistedState;
  session: Session;
  setDraftName: (name: string) => void;
  startDemo: () => void;
  createCouple: () => Promise<ActionResult>;
  joinWithCode: (code: string) => Promise<ActionResult>;
  leaveCouple: () => Promise<ActionResult>;
  rotateInviteCode: () => Promise<ActionResult>;
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
  signUpWithEmail: (input: { email: string; password: string; name: string }) => Promise<ActionResult>;
  signInWithEmail: (input: { email: string; password: string }) => Promise<ActionResult>;
  sendMagicLink: (email: string) => Promise<ActionResult>;
  completeMagicLink: (url?: string | null) => Promise<ActionResult>;
  sendPasswordReset: (email: string) => Promise<ActionResult>;
  signOutUser: () => Promise<ActionResult>;
  retrySync: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function magicLinkContinueUrl(): string {
  const fromEnv = getAuthContinueUrl();
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/complete`;
  }
  return Linking.createURL('auth/complete');
}

function kindFor(input: {
  authReady: boolean;
  user: AuthUser | null;
  profile: UserProfile | null;
  mode: 'demo' | 'local' | null;
  couple: PersistedState['couple'];
  forceDemo: boolean;
}): SessionKind {
  if (!input.authReady) return 'boot';
  if (input.user && input.profile?.coupleId) return 'paired';
  if (input.forceDemo) return 'demo';
  if (input.user) return 'unpaired';
  if (input.mode === 'demo' || isDemoCouple(input.couple)) return 'demo';
  if (input.mode === 'local' && input.couple) return 'local';
  return 'signedOut';
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const firebaseConfigured = isFirebaseConfigured();
  const [state, dispatch] = useReducer(reducer, createEmptyState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const [localReady, setLocalReady] = useState(false);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'demo' | 'local' | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [listenNonce, setListenNonce] = useState(0);
  const [forceDemo, setForceDemo] = useState(false);
  const profileRef = useRef<UserProfile | null>(null);
  profileRef.current = profile;

  const hydrated = localReady && authReady;
  const sessionKind = kindFor({
    authReady,
    user,
    profile,
    mode,
    couple: state.couple,
    forceDemo,
  });
  const cloudActive = sessionKind === 'paired' && Boolean(profile?.coupleId);

  const session = useMemo<Session>(
    () => ({
      kind: sessionKind,
      firebaseConfigured,
      authReady,
      user,
      coupleId: profile?.coupleId ?? null,
      syncError,
      syncing,
    }),
    [authReady, firebaseConfigured, profile?.coupleId, sessionKind, syncError, syncing, user],
  );

  useEffect(() => {
    installRemoteLogging();
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadState(), loadMode()]).then(([saved, savedMode]) => {
      if (!active) return;
      if (saved) dispatch({ type: 'HYDRATE', payload: saved });
      setMode(savedMode ?? (isDemoCouple(saved?.couple) ? 'demo' : saved?.couple ? 'local' : null));
      setLocalReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (sessionKind === 'demo' || sessionKind === 'local') {
      saveState(state).catch((error) => log.error(error, 'persist.save'));
      saveMode(sessionKind).catch(() => {});
    }
  }, [hydrated, sessionKind, state]);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const timeout = setTimeout(() => setAuthReady(true), 10000);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          return;
        }
        const ensured = await ensureUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setUser(toAuthUser(ensured));
        setProfile(ensured);
      } catch (error) {
        log.error(error, 'auth.user');
        setSyncError(errorMessage(error, 'Couldn’t load your account.'));
        setUser(
          firebaseUser
            ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName }
            : null,
        );
      } finally {
        clearTimeout(timeout);
        setAuthReady(true);
      }
    });
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [firebaseConfigured]);

  useEffect(() => {
    if (!user?.uid || !firebaseConfigured) return;
    try {
      return subscribeUserProfile(
        user.uid,
        (next) => {
          setProfile(next);
          if (next?.displayName && next.displayName !== stateRef.current.draftName) {
            dispatch({ type: 'SET_DRAFT_NAME', name: next.displayName });
          }
        },
        (error) => {
          log.error(error, 'user.subscribe');
          setSyncError(errorMessage(error, 'Account sync failed.'));
        },
      );
    } catch (error) {
      log.error(error, 'user.subscribe');
      return;
    }
  }, [firebaseConfigured, user?.uid, listenNonce]);

  useEffect(() => {
    if (!cloudActive || !profile?.coupleId || !profile.partnerId) return;
    setSyncing(true);
    try {
      return subscribeCoupleWorkspace(
        profile.coupleId,
        (workspace) => {
          setSyncing(false);
          if (!workspace) {
            setSyncError('This couple is no longer available.');
            return;
          }
          setSyncError(null);
          dispatch({
            type: 'HYDRATE',
            payload: workspaceToState(workspace, profile.partnerId!, profile.displayName || stateRef.current.draftName),
          });
        },
        (error) => {
          setSyncing(false);
          log.error(error, 'couple.subscribe');
          setSyncError(errorMessage(error, 'Live sync paused. Your last action is still on this phone.'));
        },
      );
    } catch (error) {
      setSyncing(false);
      log.error(error, 'couple.subscribe');
      return;
    }
  }, [cloudActive, profile?.coupleId, profile?.partnerId, profile?.displayName, listenNonce]);

  const commit = useCallback((action: Action) => {
    const prev = stateRef.current;
    const next = reducer(prev, action);
    dispatch(action);
    if (sessionKind === 'paired' && profileRef.current?.coupleId) {
      persistCloudState(profileRef.current.coupleId, prev, next).catch((error) => {
        log.error(error, 'cloud.persist');
        setSyncError(errorMessage(error, 'Couldn’t save to the couple space. Retry.'));
      });
    }
    return next;
  }, [sessionKind]);

  const applyFirebaseUser = useCallback(async (firebaseUser: User, name?: string) => {
    if (name?.trim() && firebaseUser.displayName !== name.trim()) {
      try {
        await updateProfile(firebaseUser, { displayName: name.trim() });
      } catch (error) {
        log.warn('Couldn’t update auth display name', { error: errorMessage(error) });
      }
    }
    const ensured = await ensureUserProfile(
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      },
      name,
    );
    setUser(toAuthUser(ensured));
    setProfile(ensured);
    setMode(null);
    setForceDemo(false);
    await saveMode(null);
    if (ensured.displayName) dispatch({ type: 'SET_DRAFT_NAME', name: ensured.displayName });
    if (!ensured.coupleId) dispatch({ type: 'HYDRATE', payload: { ...createEmptyState(), draftName: ensured.displayName } });
  }, []);

  const signUpWithEmail = useCallback(async (input: { email: string; password: string; name: string }) => {
    const auth = getFirebaseAuth();
    if (!auth) return { error: 'Firebase isn’t configured. You can still try the offline demo.' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
      await applyFirebaseUser(cred.user, input.name);
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t create that account.') };
    }
  }, [applyFirebaseUser]);

  const signInWithEmail = useCallback(async (input: { email: string; password: string }) => {
    const auth = getFirebaseAuth();
    if (!auth) return { error: 'Firebase isn’t configured. You can still try the offline demo.' };
    try {
      const cred = await signInWithEmailAndPassword(auth, input.email.trim(), input.password);
      await applyFirebaseUser(cred.user);
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t sign in.') };
    }
  }, [applyFirebaseUser]);

  const sendMagicLink = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return { error: 'Firebase isn’t configured yet.' };
    try {
      const trimmed = email.trim();
      await rememberEmailForSignIn(trimmed);
      await sendSignInLinkToEmail(auth, trimmed, {
        url: magicLinkContinueUrl(),
        handleCodeInApp: true,
        iOS: { bundleId: 'com.againsoon.app' },
        android: { packageName: 'com.againsoon.app', installApp: true },
      });
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t send a sign-in link.') };
    }
  }, []);

  const completeMagicLink = useCallback(async (url?: string | null): Promise<ActionResult> => {
    const auth = getFirebaseAuth();
    if (!auth) return { error: 'Firebase isn’t configured yet.' };
    const href = url ?? (typeof window !== 'undefined' ? window.location.href : null);
    if (!href || !isSignInWithEmailLink(auth, href)) {
      return { error: 'This isn’t a valid sign-in link.' };
    }
    try {
      const stored = await readEmailForSignIn();
      const email = stored ?? (Platform.OS === 'web' ? window.prompt('Confirm the email you used for the link') : null);
      if (!email) return { error: 'Open the link on the same device, or type the email you used.' };
      const cred = await signInWithEmailLink(auth, email.trim(), href);
      await clearEmailForSignIn();
      await applyFirebaseUser(cred.user);
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t finish sign-in from that link.') };
    }
  }, [applyFirebaseUser]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return { error: 'Firebase isn’t configured yet.' };
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t send a reset email.') };
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setProfile(null);
      setMode(null);
      setForceDemo(false);
      setSyncError(null);
      dispatch({ type: 'RESET' });
      await clearState();
      return {};
    } catch (error) {
      return { error: errorMessage(error, 'Couldn’t sign out.') };
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    let active = true;
    async function handle(url: string | null) {
      if (!url || !active) return;
      const auth = getFirebaseAuth();
      if (!auth || !isSignInWithEmailLink(auth, url)) return;
      const result = await completeMagicLink(url);
      if (result.error) setSyncError(result.error);
    }
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => {
      active = false;
      sub.remove();
    };
  }, [completeMagicLink, firebaseConfigured]);

  const createCouple = useCallback(async (): Promise<ActionResult> => {
    const name = stateRef.current.draftName.trim();
    if (!name) return { error: 'Add your first name first.' };
    if (user && firebaseConfigured) {
      const result = await createRemoteCouple({ uid: user.uid, displayName: name });
      if ('error' in result && result.error) return { error: result.error };
      if ('state' in result) {
        setProfile(result.profile);
        setMode(null);
        dispatch({ type: 'HYDRATE', payload: result.state });
      }
      return {};
    }
    commit({ type: 'CREATE_COUPLE' });
    setMode('local');
    return {};
  }, [commit, firebaseConfigured, user]);

  const joinWithCode = useCallback(async (code: string): Promise<ActionResult> => {
    const normalized = normalizeInviteCode(code);
    if (!normalized) return { error: 'Enter an invite code first.' };
    if (sessionKind === 'paired') {
      return { error: 'You’re already in a live couple. Leave it first to join another.' };
    }
    if (user && firebaseConfigured && normalized !== 'DEMO' && normalized !== 'HONEY42') {
      const result = await joinRemoteCouple({
        uid: user.uid,
        displayName: stateRef.current.draftName.trim() || user.displayName || 'You',
        code: normalized,
      });
      if ('error' in result && result.error) return { error: result.error };
      if ('state' in result) {
        setProfile(result.profile);
        setMode(null);
        dispatch({ type: 'HYDRATE', payload: result.state });
      }
      return {};
    }
    const joined = localJoin(stateRef.current, normalized);
    if (joined.error) return { error: joined.error };
    dispatch({ type: 'HYDRATE', payload: joined.next });
    const demo = isDemoCouple(joined.next.couple);
    setMode(demo ? 'demo' : 'local');
    if (demo) setForceDemo(true);
    return {};
  }, [firebaseConfigured, sessionKind, user]);

  const startDemo = useCallback(() => {
    dispatch({ type: 'START_DEMO' });
    setForceDemo(true);
    setMode('demo');
  }, []);

  const leaveCouple = useCallback(async (): Promise<ActionResult> => {
    const couple = stateRef.current.couple;
    if (!couple) return {};
    if (sessionKind === 'paired' && user && firebaseConfigured) {
      const result = await leaveRemoteCouple({ uid: user.uid, couple });
      if (result.error) return result;
      setProfile((current) => (current ? { ...current, coupleId: null, partnerId: null } : current));
      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_DRAFT_NAME', name: user.displayName || stateRef.current.draftName });
      return {};
    }
    dispatch({ type: 'RESET' });
    setMode(null);
    await clearState();
    return {};
  }, [firebaseConfigured, sessionKind, user]);

  const rotateInviteCode = useCallback(async (): Promise<ActionResult> => {
    const couple = stateRef.current.couple;
    if (!couple) return { error: 'No couple to rotate.' };
    if (sessionKind !== 'paired') {
      return { error: 'Invite rotation is for live couples.' };
    }
    const result = await rotateRemoteInvite(couple);
    if ('error' in result && result.error) return { error: result.error };
    if ('inviteCode' in result) {
      dispatch({
        type: 'SET_INVITE',
        inviteCode: result.inviteCode,
        inviteCodeExpiresAt: result.inviteCodeExpiresAt,
      });
    }
    return {};
  }, [sessionKind]);

  const propose = useCallback((input: ProposeInput) => {
    const id = createId('meet');
    commit({ type: 'PROPOSE', id, input });
    return id;
  }, [commit]);

  const retrySync = useCallback(() => {
    setSyncError(null);
    setListenNonce((value) => value + 1);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      state,
      session,
      setDraftName: (name) => dispatch({ type: 'SET_DRAFT_NAME', name }),
      startDemo,
      createCouple,
      joinWithCode,
      leaveCouple,
      rotateInviteCode,
      namePartner: (name) => commit({ type: 'NAME_PARTNER', name }),
      switchPartner: () => {
        if (session.kind === 'demo' || session.kind === 'local') commit({ type: 'SWITCH_PARTNER' });
      },
      propose,
      accept: (meetId) => commit({ type: 'ACCEPT', meetId }),
      counter: (meetId, input) => commit({ type: 'COUNTER', meetId, input }),
      decline: (meetId, note) => commit({ type: 'DECLINE', meetId, note }),
      withdraw: (meetId) => commit({ type: 'WITHDRAW', meetId }),
      cancelConfirmed: (meetId, note) => commit({ type: 'CANCEL_CONFIRMED', meetId, note }),
      setLocationSharing: (enabled) => commit({ type: 'SET_LOCATION_SHARING', enabled }),
      setDateGoal: (cadence) => commit({ type: 'SET_DATE_GOAL', cadence }),
      addWishlistItem: (input) => commit({ type: 'ADD_WISHLIST', id: createId('wish'), ...input }),
      removeWishlistItem: (id) => commit({ type: 'REMOVE_WISHLIST', id }),
      addKeyDate: (input) => commit({ type: 'ADD_KEY_DATE', id: createId('key'), ...input }),
      removeKeyDate: (id) => commit({ type: 'REMOVE_KEY_DATE', id }),
      addMemory: (input) => commit({ type: 'ADD_MEMORY', id: createId('mem'), ...input }),
      removeMemory: (id) => commit({ type: 'REMOVE_MEMORY', id }),
      togglePrep: (id) => commit({ type: 'TOGGLE_PREP', id }),
      addPrep: (meetId, text, assigneeId) => commit({ type: 'ADD_PREP', id: createId('prep'), meetId, text, assigneeId }),
      removePrep: (id) => commit({ type: 'REMOVE_PREP', id }),
      toggleCalendarPrivacy: (calendarId) => commit({ type: 'TOGGLE_CALENDAR_PRIVACY', calendarId }),
      setAccentPreset: (presetId) => commit({ type: 'SET_ACCENT_PRESET', presetId }),
      reset: () => {
        clearState().catch(() => {});
        setMode(null);
        setForceDemo(false);
        dispatch({ type: 'RESET' });
      },
      signUpWithEmail,
      signInWithEmail,
      sendMagicLink,
      completeMagicLink,
      sendPasswordReset,
      signOutUser,
      retrySync,
    }),
    [
      commit,
      completeMagicLink,
      createCouple,
      hydrated,
      joinWithCode,
      leaveCouple,
      propose,
      retrySync,
      rotateInviteCode,
      sendMagicLink,
      sendPasswordReset,
      session,
      signInWithEmail,
      signOutUser,
      signUpWithEmail,
      startDemo,
      state,
    ],
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

export function canSwitchPartner(session: Session): boolean {
  return session.kind === 'demo' || session.kind === 'local';
}

export function isCloudCoupleReady(session: Session, state: PersistedState): boolean {
  if (session.kind !== 'paired') return Boolean(state.couple);
  return Boolean(session.coupleId && state.couple?.id === session.coupleId);
}
