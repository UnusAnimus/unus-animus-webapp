import type { AuthUser } from '../types';

type VerifyResponse = { ok: true; user: AuthUser; exp?: number } | { ok: false; error: string };

const DEFAULT_API_BASE_URL = 'http://localhost:8787';

const getApiBaseUrl = (): string => {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROXY_URL
      ? import.meta.env.VITE_AI_PROXY_URL
      : undefined;
  return envUrl ?? DEFAULT_API_BASE_URL;
};

export const verifyAuthToken = async (token: string): Promise<{ user: AuthUser; exp?: number }> => {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  const data = (await res.json().catch(() => null)) as VerifyResponse | null;

  if (!res.ok || !data || data.ok !== true) {
    const error = data && 'error' in data ? data.error : `auth_verify_failed_${res.status}`;
    throw new Error(error);
  }

  return { user: data.user, exp: data.exp };
};
