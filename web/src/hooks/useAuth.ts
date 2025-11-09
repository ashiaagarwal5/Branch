import { useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import type { User } from '@branch/shared';

const TOKEN_STORAGE_KEY = 'branch.auth.tokens';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
}

async function exchangeIdToken(idToken: string) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Authentication exchange failed');
  }

  return response.json();
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken, audience: 'web' }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenBundle | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const persistTokens = (bundle: TokenBundle | null) => {
    if (bundle) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(bundle));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setTokens(bundle);
  };

  const scheduleRefresh = (bundle: TokenBundle | null) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!bundle) return;

    const refreshInMs = Math.max(
      bundle.accessTokenExpiresAt - Date.now() - 60_000,
      30_000
    );

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const payload = await refreshAccessToken(bundle.refreshToken);
        const { tokens: refreshedTokens, user } = payload.data ?? payload;

        const nextBundle: TokenBundle = {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          accessTokenExpiresAt:
            Date.now() + refreshedTokens.accessTokenExpiresIn * 1000,
        };

        persistTokens(nextBundle);
        setUser(user);
        scheduleRefresh(nextBundle);
      } catch (error) {
        console.error('Failed to refresh access token', error);
        persistTokens(null);
      }
    }, refreshInMs);
  };

  const syncBackendSession = async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken(true);
    const payload = await exchangeIdToken(idToken);
    const { user: branchUser, tokens: issuedTokens } = payload.data ?? payload;

    const bundle: TokenBundle = {
      accessToken: issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
      accessTokenExpiresAt:
        Date.now() + issuedTokens.accessTokenExpiresIn * 1000,
    };

    persistTokens(bundle);
    scheduleRefresh(bundle);
    setUser(branchUser);
  };

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TokenBundle;
        setTokens(parsed);
        scheduleRefresh(parsed);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          await syncBackendSession(firebaseUser);
        } catch (error) {
          console.error('Failed to sync backend session', error);
          persistTokens(null);
          setUser(null);
        }
      } else {
        persistTokens(null);
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    try {
      if (tokens?.refreshToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Failed to revoke refresh token', error);
    } finally {
      persistTokens(null);
      await firebaseSignOut(auth);
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    accessToken: tokens?.accessToken ?? null,
    signInWithGoogle,
    signOut,
  };
}
