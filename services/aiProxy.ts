import type { Language } from '../types';
import { getAuthToken } from '../utils/authStorage';

export type ReflectionFeedback = {
  score: number;
  feedback: string;
  isPass: boolean;
};

const DEFAULT_PROXY_URL = 'http://localhost:8787';
const ENV_PROXY_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROXY_URL
    ? import.meta.env.VITE_AI_PROXY_URL
    : undefined;

export const evaluateReflectionViaProxy = async (
  prompt: string,
  userAnswer: string,
  language: Language,
  proxyBaseUrl = ENV_PROXY_URL ?? DEFAULT_PROXY_URL
): Promise<ReflectionFeedback> => {
  const url = `${proxyBaseUrl}/api/evaluate-reflection`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let res: Response;
  try {
    const token = getAuthToken();
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, userAnswer, language }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`AI proxy error: ${res.status}`);
  }

  return (await res.json()) as ReflectionFeedback;
};
