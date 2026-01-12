import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { createPublicKey } from 'node:crypto';
import dotenv from 'dotenv';
import { jwtVerify } from 'jose';
import { GoogleGenAI, Type } from '@google/genai';

// Load env vars from project root. Keep keys out of the frontend bundle.
try {
  const root = process.cwd();
  const envLocal = path.join(root, '.env.local');
  const env = path.join(root, '.env');
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
  if (fs.existsSync(env)) dotenv.config({ path: env });
} catch {
  // Non-fatal: env vars may be provided via the shell/host instead.
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Auth (WordPress JWT)
const WP_JWT_SECRET = process.env.WP_JWT_SECRET;
const WP_JWT_PUBLIC_KEY = process.env.WP_JWT_PUBLIC_KEY;
const WP_JWT_ISSUER = process.env.WP_JWT_ISSUER;
const WP_JWT_AUDIENCE = process.env.WP_JWT_AUDIENCE;

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: '1mb' }));
const isAllowedOrigin = origin => {
  if (!origin) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
  if (FRONTEND_ORIGINS.includes(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: false,
  })
);

const parseBearerToken = req => {
  const header = req.headers?.authorization;
  if (typeof header === 'string') {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }
  if (req.body?.token && typeof req.body.token === 'string') return req.body.token.trim();
  return null;
};

const normalizeRoles = rawRoles => {
  const list = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
  const roles = new Set();
  for (const r of list) {
    if (!r) continue;
    const v = String(r).toLowerCase();
    if (v.includes('admin') || v === 'administrator') roles.add('admin');
    if (v.includes('editor') || v.includes('redaktion')) roles.add('editor');
    if (v.includes('member') || v === 'subscriber' || v.includes('mitglied')) roles.add('member');
  }
  return Array.from(roles);
};

const verifyWordpressJwt = async token => {
  if (!token) throw new Error('missing_token');

  let key;
  let algorithms;

  if (WP_JWT_PUBLIC_KEY) {
    key = createPublicKey(WP_JWT_PUBLIC_KEY);
    algorithms = ['RS256', 'RS384', 'RS512'];
  } else if (WP_JWT_SECRET) {
    key = new TextEncoder().encode(WP_JWT_SECRET);
    algorithms = ['HS256', 'HS384', 'HS512'];
  } else {
    throw new Error('missing_jwt_key');
  }

  const { payload } = await jwtVerify(token, key, {
    algorithms,
    issuer: WP_JWT_ISSUER || undefined,
    audience: WP_JWT_AUDIENCE || undefined,
  });

  const rawRoles = payload.roles ?? payload.role ?? payload.wp_roles ?? payload.user_roles;
  const roles = normalizeRoles(rawRoles);

  const wpUserId =
    String(payload.sub ?? payload.wp_user_id ?? payload.user_id ?? payload.id ?? '').trim() || null;
  if (!wpUserId) throw new Error('missing_user');

  const email = payload.email ?? payload.user_email;
  const name = payload.name ?? payload.user_display_name ?? payload.display_name;

  return {
    wpUserId,
    email: typeof email === 'string' ? email : undefined,
    name: typeof name === 'string' ? name : undefined,
    roles,
    exp: typeof payload.exp === 'number' ? payload.exp : undefined,
  };
};

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/info', (_req, res) => {
  const provider = OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : 'none';
  res.json({
    ok: true,
    provider,
    model:
      provider === 'openai'
        ? OPENAI_MODEL
        : provider === 'gemini'
          ? 'gemini-3-flash-preview'
          : null,
  });
});

// --- AUTH ---

app.post('/auth/verify', async (req, res) => {
  const token = parseBearerToken(req);

  if (!token) {
    return res.status(400).json({ ok: false, error: 'missing_token' });
  }

  try {
    const user = await verifyWordpressJwt(token);
    const allowed =
      user.roles.includes('member') ||
      user.roles.includes('admin') ||
      user.roles.includes('editor');
    if (!allowed) {
      return res
        .status(403)
        .json({ ok: false, error: 'not_a_member', user: { ...user, roles: user.roles } });
    }

    return res.json({
      ok: true,
      user: { wpUserId: user.wpUserId, email: user.email, name: user.name, roles: user.roles },
      exp: user.exp,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_token';
    const status = msg === 'missing_jwt_key' ? 500 : msg === 'missing_token' ? 400 : 401;
    return res.status(status).json({ ok: false, error: msg });
  }
});

const SYSTEM_INSTRUCTION_BASE = `
You are a calm, Hermetic tutor. You are assisting a student in a self-responsibility course.
Your goal is to evaluate their reflection answers based on:
1. Relevance to the prompt.
2. Depth of thought (not just surface level).
3. Self-responsibility (avoiding victim mentality).

You are NOT a therapist. You are a philosopher guide.
If the answer is dangerous (self-harm), flag it immediately.
Be brief.
`;

const getSystemInstruction = lang => {
  const langInstruction = lang === 'de' ? 'Answer in German (Du-form).' : 'Answer in English.';
  return `${SYSTEM_INSTRUCTION_BASE}\n${langInstruction}`;
};

const callOpenAI = async ({ prompt, userAnswer, language }) => {
  const system = getSystemInstruction(language);
  const input = `Prompt: "${prompt}"\nUser Answer: "${userAnswer}"\n\nEvaluate this answer. Return ONLY JSON with keys: score (0-100), feedback (1-2 sentences), isPass (boolean).`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
      instructions: system,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  // Try to extract text output from Responses API
  const outputText =
    data?.output_text ||
    data?.output
      ?.flatMap(o => o?.content || [])
      .map(c => c?.text)
      .filter(Boolean)
      .join('') ||
    '';

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    // Sometimes models wrap JSON in fences; strip common wrappers.
    const cleaned = String(outputText)
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  }

  return {
    score: Number(parsed?.score) || 0,
    feedback:
      parsed?.feedback ||
      (language === 'de' ? 'Keine Bewertung möglich.' : 'Evaluation not available.'),
    isPass: parsed?.isPass ?? false,
  };
};

const simulateEvaluation = (text, language) => {
  const length = String(text || '').trim().length;
  if (length < 10) {
    return {
      score: 20,
      feedback:
        language === 'de'
          ? 'Das war etwas kurz. Kannst du das etwas genauer ausführen?'
          : 'That was a bit short. Can you elaborate?',
      isPass: false,
    };
  }

  return {
    score: 85,
    feedback:
      language === 'de'
        ? 'Guter Gedanke. Wichtig ist, die Verantwortung im Inneren zu erkennen.'
        : 'Good thought. The key is to recognize responsibility within.',
    isPass: true,
  };
};

app.post('/api/evaluate-reflection', async (req, res) => {
  // If JWT auth is configured, require a valid member token.
  const authConfigured = Boolean(WP_JWT_SECRET || WP_JWT_PUBLIC_KEY);
  if (authConfigured) {
    const token = parseBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'missing_token' });
    }
    try {
      const user = await verifyWordpressJwt(token);
      const allowed =
        user.roles.includes('member') ||
        user.roles.includes('admin') ||
        user.roles.includes('editor');
      if (!allowed) {
        return res.status(403).json({ error: 'not_a_member' });
      }
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  }

  const { prompt, userAnswer, language } = req.body || {};

  if (!prompt || !userAnswer || !language) {
    return res.status(400).json({ error: 'Missing prompt/userAnswer/language' });
  }

  try {
    if (OPENAI_API_KEY) {
      return res.json(await callOpenAI({ prompt, userAnswer, language }));
    }

    if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Prompt: "${prompt}"\nUser Answer: "${userAnswer}"\n\nEvaluate this answer.`,
        config: {
          systemInstruction: getSystemInstruction(language),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              feedback: {
                type: Type.STRING,
                description: `Constructive feedback in ${language === 'de' ? 'German' : 'English'}`,
              },
              isPass: {
                type: Type.BOOLEAN,
                description: 'True if the answer is acceptable/relevant',
              },
            },
            required: ['score', 'feedback', 'isPass'],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      return res.json({
        score: result.score || 0,
        feedback:
          result.feedback ||
          (language === 'de' ? 'Keine Bewertung möglich.' : 'Evaluation not available.'),
        isPass: result.isPass ?? false,
      });
    }

    return res.json(simulateEvaluation(userAnswer, language));
  } catch (e) {
    console.error('AI proxy error:', e);
    return res.json(simulateEvaluation(userAnswer, language));
  }
});

app.listen(PORT, () => {
  console.log(`[ai-proxy] listening on http://localhost:${PORT}`);
  const provider = OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : 'none';
  console.log(`[ai-proxy] provider: ${provider} (simulation if none)`);
});
