import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
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

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    credentials: false,
  })
);

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
