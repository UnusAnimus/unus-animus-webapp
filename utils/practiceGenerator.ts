import { Course, Exercise, ExerciseType, Language, Lesson, UserProgress } from '../types';

type Rng = () => number;

export const getPracticeSeed = (progress: UserProgress): string => {
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const lessonIds = [
    progress.currentLessonId,
    ...Object.keys(progress.completedLessons || {}),
  ].filter(Boolean);

  lessonIds.sort();
  const lessonDigest = toHex(fnv1a32(lessonIds.join(',')));

  return `${dayKey}|xp:${progress.xp}|lessons:${lessonDigest}`;
};

export const generateLocalPracticeExercises = (
  course: Course,
  progress: UserProgress,
  language: Language,
  count: number
): Exercise[] => {
  const safeCount = Math.max(0, Math.floor(count || 0));
  if (safeCount === 0) return [];

  const eligibleLessons = getEligibleLessons(course, progress);
  const eligibleLessonIds = eligibleLessons.map(l => l.id).sort();

  const seed = [
    getPracticeSeed(progress),
    `course:${course.id}`,
    `lang:${language}`,
    `eligible:${toHex(fnv1a32(eligibleLessonIds.join(',')))}`,
  ].join('|');

  const rng = mulberry32(fnv1a32(seed));

  const lessonsShuffled = shuffle(eligibleLessons, rng);

  const clonedOriginals: Exercise[] = [];
  for (const lesson of lessonsShuffled) {
    for (const ex of lesson.exercises || []) {
      clonedOriginals.push(cloneExercise(ex, rng, `orig:${lesson.id}`));
    }
  }

  const derived: Exercise[] = [];
  for (const lesson of lessonsShuffled) {
    derived.push(...deriveLessonExercises(lesson, language, rng, seed));
  }

  const preferredTypes = new Set<ExerciseType>([
    ExerciseType.MULTIPLE_CHOICE,
    ExerciseType.TRUE_FALSE,
    ExerciseType.CLOZE,
    ExerciseType.SCENARIO,
  ]);

  const preferred = clonedOriginals.filter(e => preferredTypes.has(e.type));
  const others = clonedOriginals.filter(e => !preferredTypes.has(e.type));

  // Practice MVP: keep reflection out of practice by default, and avoid types
  // that PracticeRunner doesn't render (e.g., SORTING).
  const supportedTypes = new Set<ExerciseType>([
    ExerciseType.MULTIPLE_CHOICE,
    ExerciseType.TRUE_FALSE,
    ExerciseType.CLOZE,
    ExerciseType.SCENARIO,
  ]);

  const practiceStats = progress.practiceStats || {};
  const now = Date.now();
  const cooldownMs = 30 * 60 * 1000; // 30 minutes

  const candidates = [...derived, ...preferred, ...others]
    .filter(ex => supportedTypes.has(ex.type))
    .map(ex => ({ ex, score: scoreForPractice(ex, practiceStats, now) }));

  // Sort by score (higher first) with a small seeded jitter.
  const pool = candidates.sort((a, b) => b.score - a.score + (rng() - 0.5) * 0.25).map(x => x.ex);

  const picked: Exercise[] = [];
  const seen = new Set<string>();

  for (const ex of pool) {
    const baseId = getBaseExerciseId(ex.id);
    const stats = practiceStats[baseId];
    if (stats?.lastSeenAt) {
      const last = Date.parse(stats.lastSeenAt);
      if (Number.isFinite(last) && now - last < cooldownMs && pool.length > safeCount * 2) {
        continue;
      }
    }

    const key = `${ex.type}::${normalizeWs(ex.prompt)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(ex);
    if (picked.length >= safeCount) break;
  }

  // Fallback: if pool is too small, re-clone with extra salt.
  if (picked.length < safeCount && clonedOriginals.length > 0) {
    let i = 0;
    while (picked.length < safeCount && i < safeCount * 10) {
      const base = clonedOriginals[Math.floor(rng() * clonedOriginals.length)];
      const extra = cloneExercise(base, rng, `repeat:${i}`);
      const key = `${extra.type}::${normalizeWs(extra.prompt)}::${extra.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        picked.push(extra);
      }
      i++;
    }
  }

  return picked.slice(0, safeCount);
};

const getBaseExerciseId = (id: string): string => {
  const marker = '__practice__';
  const idx = id.indexOf(marker);
  if (idx >= 0) return id.slice(0, idx);
  return id;
};

const scoreForPractice = (
  exercise: Exercise,
  statsMap: NonNullable<UserProgress['practiceStats']>,
  nowMs: number
): number => {
  const baseId = getBaseExerciseId(exercise.id);
  const stats = statsMap[baseId];

  // Default priority is slightly positive to allow unseen items to float up.
  let score = 1.0;

  if (!stats) {
    // New content should appear more often early on.
    score += 2.5;
    return score;
  }

  // Wrong answers => increase frequency
  score += (stats.wrongCount || 0) * 2.0;
  // Correct streak => decrease frequency
  score -= (stats.correctStreak || 0) * 1.25;

  // Older => slightly higher priority
  if (stats.lastSeenAt) {
    const last = Date.parse(stats.lastSeenAt);
    if (Number.isFinite(last)) {
      const hours = Math.max(0, (nowMs - last) / (1000 * 60 * 60));
      score += Math.min(3.0, hours / 12);
    }
  }

  return score;
};

/* -------------------------- internals -------------------------- */

const getEligibleLessons = (course: Course, progress: UserProgress): Lesson[] => {
  const orderedUnits = (course.units || []).slice().sort((a, b) => a.order - b.order);
  const allLessons = orderedUnits.flatMap(u => u.lessons || []);

  const completed = new Set(Object.keys(progress.completedLessons || {}));
  const eligibleIds = new Set<string>([progress.currentLessonId, ...completed].filter(Boolean));

  const eligible = allLessons.filter(l => eligibleIds.has(l.id));
  return eligible.length > 0 ? eligible : allLessons;
};

const cloneExercise = (ex: Exercise, rng: Rng, salt: string): Exercise => {
  const cloned: Exercise = {
    ...ex,
    id: `${ex.id}__practice__${toHex(fnv1a32(`${salt}|${ex.id}|${ex.prompt}`))}`,
    options: ex.options ? ex.options.slice() : undefined,
  };

  if (cloned.options && cloned.options.length > 1) {
    cloned.options = shuffle(cloned.options, rng);
  }

  return cloned;
};

const deriveLessonExercises = (
  lesson: Lesson,
  lang: Language,
  rng: Rng,
  seed: string
): Exercise[] => {
  const lessonText = collectLessonText(lesson);
  if (!lessonText) return [];

  const sentences = splitSentences(lessonText)
    .map(s => s.trim())
    .filter(s => s.length >= 25 && s.length <= 220);

  if (sentences.length === 0) return [];

  const lessonKeywords = extractKeywords(lessonText, lang);
  const maxPerLesson = 3;

  const derived: Exercise[] = [];
  const baseSalt = `${seed}|lesson:${lesson.id}`;

  // TRUE_FALSE
  {
    const s = pickOne(sentences, rng);
    const tf = makeTrueFalse(s, lang, baseSalt, rng);
    if (tf) derived.push(tf);
  }

  // CLOZE
  {
    const s = pickOne(sentences, rng);
    const cloze = makeCloze(s, lessonKeywords, lang, baseSalt, rng);
    if (cloze) derived.push(cloze);
  }

  // MULTIPLE_CHOICE
  {
    const s = pickOne(sentences, rng);
    const mc = makeMultipleChoice(s, lessonKeywords, lang, baseSalt, rng);
    if (mc) derived.push(mc);
  }

  const seen = new Set<string>();
  const unique = derived.filter(ex => {
    const key = `${ex.type}::${normalizeWs(ex.prompt)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, maxPerLesson);
};

const collectLessonText = (lesson: Lesson): string => {
  const parts: Array<string | undefined> = [
    lesson.description,
    lesson.introText,
    lesson.interpretation,
    lesson.quote?.text,
  ];
  return normalizeWs(parts.filter(Boolean).join(' '));
};

const makeTrueFalse = (
  sentence: string,
  lang: Language,
  salt: string,
  rng: Rng
): Exercise | null => {
  const cleaned = normalizeWs(sentence).replace(/^[-–•]\s*/, '');
  if (cleaned.length < 20) return null;

  const wantNegated = rng() < 0.45;
  const { statement, answer, explanation } = negateHeuristically(cleaned, lang, wantNegated);

  const prompt = lang === 'de' ? `Wahr oder Falsch: ${statement}` : `True or False: ${statement}`;
  const options = lang === 'de' ? ['Wahr', 'Falsch'] : ['True', 'False'];

  return {
    id: `derived_tf__${toHex(fnv1a32(`${salt}|tf|${prompt}`))}`,
    type: ExerciseType.TRUE_FALSE,
    prompt,
    options,
    correctAnswer: answer,
    explanation,
    points: 10,
  };
};

const makeCloze = (
  sentence: string,
  lessonKeywords: string[],
  lang: Language,
  salt: string,
  rng: Rng
): Exercise | null => {
  const cleaned = normalizeWs(sentence);
  if (cleaned.length < 25) return null;

  const localKeywords = extractKeywords(cleaned, lang);
  const candidates = uniqueStrings([...localKeywords, ...lessonKeywords]).filter(
    w => w.length >= 5
  );

  const chosen = candidates.length > 0 ? pickOne(candidates, rng) : null;
  if (!chosen) return null;

  const blanked = replaceFirstWordCaseInsensitive(cleaned, chosen, '_____');
  if (blanked === cleaned) return null;

  const prompt =
    lang === 'de' ? `Setze das fehlende Wort ein: ${blanked}` : `Fill in the blank: ${blanked}`;

  const distractors = uniqueStrings(
    shuffle(
      uniqueStrings([...lessonKeywords, ...fallbackDistractors(lang)]).filter(w => w !== chosen),
      rng
    )
  ).slice(0, 3);

  const options = shuffle(uniqueStrings([chosen, ...distractors]), rng);
  if (options.length < 2) return null;

  return {
    id: `derived_cloze__${toHex(fnv1a32(`${salt}|cloze|${prompt}|${chosen}`))}`,
    type: ExerciseType.CLOZE,
    prompt,
    options,
    correctAnswer: chosen,
    explanation:
      lang === 'de'
        ? 'Hinweis: Das Wort stammt aus dem Einführungstext/der Deutung der Lektion.'
        : 'Hint: The missing word is taken from the lesson’s intro/interpretation.',
    points: 10,
  };
};

const makeMultipleChoice = (
  sentence: string,
  lessonKeywords: string[],
  lang: Language,
  salt: string,
  rng: Rng
): Exercise | null => {
  const cleaned = normalizeWs(sentence);
  if (cleaned.length < 25) return null;

  const def = parseDefinition(cleaned, lang);
  if (!def) return null;

  const subject = truncate(def.subject, 60);
  const correct = truncate(def.definition, 90);

  if (subject.length < 3 || correct.length < 3) return null;

  const prompt =
    lang === 'de'
      ? `Laut der Lektion: Was trifft am ehesten auf „${subject}“ zu?`
      : `According to the lesson, what best describes "${subject}"?`;

  const distractors = uniqueStrings(
    shuffle(
      uniqueStrings([...lessonKeywords, ...fallbackDistractors(lang)]).filter(w => w !== correct),
      rng
    )
  )
    .map(w => truncate(w, 90))
    .filter(w => w.length >= 3 && w !== correct)
    .slice(0, 3);

  const options = shuffle(uniqueStrings([correct, ...distractors]), rng);
  if (options.length < 2) return null;

  return {
    id: `derived_mc__${toHex(fnv1a32(`${salt}|mc|${prompt}|${correct}`))}`,
    type: ExerciseType.MULTIPLE_CHOICE,
    prompt,
    options,
    correctAnswer: correct,
    explanation:
      lang === 'de'
        ? 'Abgeleitet aus einem Satz im Einführungstext/der Deutung.'
        : 'Derived from a sentence in the intro/interpretation.',
    points: 10,
  };
};

const parseDefinition = (
  sentence: string,
  lang: Language
): { subject: string; definition: string } | null => {
  const s = sentence.replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

  const patterns =
    lang === 'de'
      ? [/(.+?)\s+(ist|bedeutet|steht für)\s+(.+?)(?:[.!?]|$)/i]
      : [/(.+?)\s+(is|means|refers to)\s+(.+?)(?:[.!?]|$)/i];

  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;

    const rawSubject = normalizeWs(stripQuotes(m[1] || '')).replace(
      /^(this|that|dies|das)\s+/i,
      ''
    );
    let rawDef = normalizeWs(stripQuotes(m[3] || ''));

    rawDef = rawDef.split(/[;:]/)[0].trim();
    rawDef = rawDef.replace(/^that\s+/i, '');

    if (rawSubject.length < 3 || rawDef.length < 3) continue;
    if (rawSubject.length > 80) continue;

    const subject = rawSubject.split(' ').slice(0, 8).join(' ').trim();
    const definition = rawDef.trim();

    return { subject, definition };
  }

  return null;
};

const negateHeuristically = (
  sentence: string,
  lang: Language,
  negated: boolean
): { statement: string; answer: boolean; explanation: string } => {
  const base = sentence.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');

  if (!negated) {
    return {
      statement: `${base}.`,
      answer: true,
      explanation:
        lang === 'de'
          ? 'Diese Aussage ist direkt aus dem Lektionstext abgeleitet.'
          : 'This statement is directly derived from the lesson text.',
    };
  }

  const replaced =
    lang === 'de'
      ? base.replace(/\sist\s/i, ' ist nicht ').replace(/\ssind\s/i, ' sind nicht ')
      : base.replace(/\sis\s/i, ' is not ').replace(/\sare\s/i, ' are not ');

  const statement = replaced === base ? `NOT: ${base}.` : `${replaced}.`;

  return {
    statement,
    answer: false,
    explanation:
      lang === 'de' ? `Im Text heißt es sinngemäß: „${base}.“` : `The lesson implies: "${base}."`,
  };
};

/* -------------------------- text utils -------------------------- */

const splitSentences = (text: string): string[] => {
  const cleaned = normalizeWs(text);
  if (!cleaned) return [];
  return cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
};

const extractKeywords = (text: string, lang: Language): string[] => {
  const stop = stopwords(lang);
  const words = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß]+/g) ?? []).map(w => w.trim()).filter(Boolean);

  const candidates = words
    .map(w => w.toLowerCase())
    .filter(w => w.length >= 5)
    .filter(w => !stop.has(w))
    .filter(w => !/^\d+$/.test(w));

  return uniqueStrings(candidates).slice(0, 40);
};

const stopwords = (lang: Language): Set<string> => {
  const common = [
    'the',
    'and',
    'that',
    'this',
    'with',
    'from',
    'your',
    'you',
    'are',
    'for',
    'not',
    'eine',
    'einer',
    'eines',
    'und',
    'dass',
    'dies',
    'diese',
    'dieser',
    'mit',
    'aus',
    'dein',
    'deine',
    'deiner',
    'deines',
    'nicht',
    'oder',
    'wie',
    'sich',
    'sind',
    'ist',
    'einem',
    'einen',
    'also',
    'wir',
    'uns',
    'ihr',
    'sie',
    'der',
    'die',
    'das',
    'den',
    'dem',
    'des',
    'ein',
  ];

  const extras =
    lang === 'de'
      ? ['auch', 'nur', 'mehr', 'weniger', 'kann', 'können', 'muss', 'musst', 'soll', 'sollte']
      : ['also', 'only', 'more', 'less', 'can', 'could', 'must', 'should', 'will', 'would'];

  return new Set([...common, ...extras]);
};

const replaceFirstWordCaseInsensitive = (
  text: string,
  word: string,
  replacement: string
): string => {
  const escaped = escapeRegExp(word);
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return text.replace(re, replacement);
};

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripQuotes = (s: string): string => s.replace(/^"+|"+$/g, '').trim();

const truncate = (s: string, maxLen: number): string => {
  const t = s.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
};

const normalizeWs = (s: string): string => s.replace(/\s+/g, ' ').trim();

const uniqueStrings = (arr: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const k = x.trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
};

const fallbackDistractors = (lang: Language): string[] => {
  return lang === 'de'
    ? [
        'Bewusstsein',
        'Realität',
        'Gedanke',
        'Geist',
        'Muster',
        'Erfahrung',
        'Prinzip',
        'Ursache',
        'Wirkung',
      ]
    : [
        'consciousness',
        'reality',
        'thought',
        'mind',
        'pattern',
        'experience',
        'principle',
        'cause',
        'effect',
      ];
};

/* -------------------------- rng utils -------------------------- */

const fnv1a32 = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const toHex = (n: number): string => n.toString(16).padStart(8, '0');

const mulberry32 = (seed: number): Rng => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T>(items: T[], rng: Rng): T[] => {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const pickOne = <T>(items: T[], rng: Rng): T => {
  return items[Math.floor(rng() * items.length)];
};
