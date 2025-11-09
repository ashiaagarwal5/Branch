import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'branchAuth';
const API_BASE =
  process.env.BRANCH_API_BASE_URL ||
  'http://localhost:5001/dann-91ae4/us-central1/api';

interface ExtensionAuthState {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  userId: string;
  deviceId: string;
  user?: {
    displayName?: string;
    photoURL?: string | null;
  };
}

function parseState(raw: any): ExtensionAuthState | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed.userId || !parsed.accessToken || !parsed.refreshToken) {
      return null;
    }
    return parsed as ExtensionAuthState;
  } catch {
    return null;
  }
}

export async function getStoredAuth(): Promise<ExtensionAuthState | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return parseState(result[STORAGE_KEY]);
}

async function persistAuth(state: ExtensionAuthState | null) {
  if (!state) {
    await chrome.storage.local.remove(STORAGE_KEY);
  } else {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  }
}

async function refreshAccessToken(state: ExtensionAuthState) {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: state.refreshToken,
      audience: 'extension',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const payload = await response.json();
  const { tokens } = payload.data ?? payload;

  const nextState: ExtensionAuthState = {
    ...state,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt:
      Date.now() + (tokens.accessTokenExpiresIn || 900) * 1000,
  };

  await persistAuth(nextState);
  return nextState;
}

export async function getAccessToken(): Promise<ExtensionAuthState | null> {
  const current = await getStoredAuth();
  if (!current) return null;

  if (Date.now() < current.accessTokenExpiresAt - 60_000) {
    return current;
  }

  try {
    return await refreshAccessToken(current);
  } catch (error) {
    console.error('Extension token refresh failed', error);
    await persistAuth(null);
    return null;
  }
}

export async function linkExtension(
  setupCode: string,
  deviceName?: string
): Promise<ExtensionAuthState> {
  const deviceId = uuid();
  const response = await fetch(`${API_BASE}/api/auth/extension/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: setupCode,
      deviceId,
      deviceName,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to link extension');
  }

  const payload = await response.json();
  const { tokens, user } = payload.data ?? payload;

  const state: ExtensionAuthState = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt:
      Date.now() + (tokens.accessTokenExpiresIn || 900) * 1000,
    userId: user.id,
    deviceId,
    user: {
      displayName: user.displayName,
      photoURL: user.photoURL ?? null,
    },
  };

  await persistAuth(state);
  return state;
}

export async function logoutExtension() {
  const auth = await getStoredAuth();
  if (auth?.refreshToken) {
    try {
      await fetch(`${API_BASE}/api/auth/extension/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
    } catch (error) {
      console.warn('Failed to revoke extension token', error);
    }
  }

  await persistAuth(null);
}

