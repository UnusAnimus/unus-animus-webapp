import type { Language } from '../types';

export type AiProvider = 'openai' | 'gemini' | 'none' | 'offline';

export type AiStatus = {
  ok: boolean;
  provider: AiProvider;
  model: string | null;
};

const DEFAULT_PROXY_URL = 'http://localhost:8787';

export const getAiStatus = async (
  _language: Language,
  proxyBaseUrl = DEFAULT_PROXY_URL
): Promise<AiStatus> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(`${proxyBaseUrl}/info`, { signal: controller.signal });
    if (!res.ok) return { ok: false, provider: 'offline', model: null };

    const data = (await res.json()) as { ok?: boolean; provider?: string; model?: string | null };
    const provider: AiProvider =
      data?.provider === 'openai' || data?.provider === 'gemini' || data?.provider === 'none'
        ? data.provider
        : 'none';

    return { ok: Boolean(data?.ok), provider, model: data?.model ?? null };
  } catch {
    return { ok: false, provider: 'offline', model: null };
  } finally {
    clearTimeout(timeout);
  }
};
