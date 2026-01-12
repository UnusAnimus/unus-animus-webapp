import type { AuthUser } from '../types';

const TOKEN_KEY = 'kybalion_auth_token';
const USER_KEY = 'kybalion_auth_user';

export const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? token : null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
};

export const getCachedAuthUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setCachedAuthUser = (user: AuthUser) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};
