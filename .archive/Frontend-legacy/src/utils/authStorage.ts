import { LoginResponse } from '../types';

const USER_STORAGE_KEY = 'user';
const LOGIN_TIME_STORAGE_KEY = 'loginTime';
const RELAY_PREFIX = 'antigone-auth-relay:';

export const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

type AuthSnapshot = {
  user: LoginResponse;
  loginTime: number;
};

const toBase64 = (value: string): string => {
  try {
    const bytes = new TextEncoder().encode(value);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary);
  } catch {
    return '';
  }
};

const fromBase64 = (value: string): string | null => {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

const isExpired = (loginTime: number): boolean => {
  if (!Number.isFinite(loginTime)) return true;
  return Date.now() - loginTime >= SESSION_DURATION_MS;
};

const clearLocalStorageSnapshot = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(LOGIN_TIME_STORAGE_KEY);
};

const readFromLocalStorage = (): AuthSnapshot | null => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  const storedLoginTime = localStorage.getItem(LOGIN_TIME_STORAGE_KEY);
  if (!storedUser || !storedLoginTime) return null;

  try {
    const parsedUser = JSON.parse(storedUser) as LoginResponse;
    const parsedLoginTime = Number(storedLoginTime);
    if (isExpired(parsedLoginTime)) return null;
    return { user: parsedUser, loginTime: parsedLoginTime };
  } catch {
    return null;
  }
};

const persistToLocalStorage = (snapshot: AuthSnapshot): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(snapshot.user));
  localStorage.setItem(LOGIN_TIME_STORAGE_KEY, String(snapshot.loginTime));
};

const parseRelaySnapshot = (): AuthSnapshot | null => {
  if (!window.name.startsWith(RELAY_PREFIX)) return null;

  const encodedSnapshot = window.name.slice(RELAY_PREFIX.length);
  if (!encodedSnapshot) return null;

  try {
    const decodedSnapshot = fromBase64(encodedSnapshot);
    if (!decodedSnapshot) return null;

    const parsedSnapshot = JSON.parse(decodedSnapshot) as AuthSnapshot;
    if (!parsedSnapshot || !parsedSnapshot.user) return null;
    if (isExpired(Number(parsedSnapshot.loginTime))) return null;

    return {
      user: parsedSnapshot.user,
      loginTime: Number(parsedSnapshot.loginTime),
    };
  } catch {
    return null;
  }
};

const clearRelaySnapshot = (): void => {
  if (window.name.startsWith(RELAY_PREFIX)) {
    window.name = '';
  }
};

const writeRelaySnapshot = (snapshot: AuthSnapshot): void => {
  const encodedSnapshot = toBase64(JSON.stringify(snapshot));
  if (!encodedSnapshot) return;

  window.name = `${RELAY_PREFIX}${encodedSnapshot}`;
};

const consumeRelaySnapshot = (): AuthSnapshot | null => {
  const snapshot = parseRelaySnapshot();
  clearRelaySnapshot();
  return snapshot;
};

const getLatestSnapshot = (): AuthSnapshot | null => {
  const fromStorage = readFromLocalStorage();
  if (fromStorage) return fromStorage;

  const fromRelay = consumeRelaySnapshot();
  if (fromRelay) {
    persistToLocalStorage(fromRelay);
    return fromRelay;
  }

  clearLocalStorageSnapshot();
  return null;
};

export const saveAuthSnapshot = (user: LoginResponse): void => {
  const snapshot: AuthSnapshot = {
    user,
    loginTime: Date.now(),
  };

  persistToLocalStorage(snapshot);
};

export const relayAuthSnapshotForSwitch = (): void => {
  const snapshot = getLatestSnapshot();
  if (!snapshot) return;
  writeRelaySnapshot(snapshot);
};

export const clearAuthSnapshot = (): void => {
  clearLocalStorageSnapshot();
  clearRelaySnapshot();
};

export const getAuthSnapshot = (): AuthSnapshot | null => {
  return getLatestSnapshot();
};
