import type { Language } from '../types';

export type ReflectionFeedback = {
  score: number;
  feedback: string;
  isPass: boolean;
};

const DEFAULT_PROXY_URL = 'http://localhost:8787';

export const evaluateReflectionViaProxy = async (
  prompt: string,
  userAnswer: string,
  language: Language,
  proxyBaseUrl = DEFAULT_PROXY_URL
): Promise<ReflectionFeedback> => {
  const url = `${proxyBaseUrl}/api/evaluate-reflection`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userAnswer, language }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`AI proxy error: ${res.status}`);
  }

  return (await res.json()) as ReflectionFeedback;
};
