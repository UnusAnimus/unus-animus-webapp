# Kybalion Path — Milestones & Checklists

This file is the working checklist for the project.

## Milestone 0 — „produktionsfähig bauen“ (1–2 Tage)

**Goal:** Anyone can run/build this project reproducibly on any machine/server (no “works on my machine”).

### Repo hygiene

- [ ] Ensure `node_modules/` is not committed (should never be tracked).
- [ ] Ensure `dist/` is not committed (build artifacts stay out of git).
- [ ] Keep `.env.example` in git, keep real secrets out of git.

### Quality baseline

- [ ] Add `npm run typecheck` (no emit).
- [ ] Add ESLint baseline config and `npm run lint`.
- [ ] Add Prettier config and `npm run format` + `npm run format:check`.

### CI

- [ ] Add GitHub Actions CI to run `npm ci`, `npm run typecheck`, `npm run build` on every push/PR to `main`.

### Documentation

- [ ] README: Local start steps.
- [ ] README: ENV variables table (what they do + where they’re used).
- [ ] README: Production/deploy notes (static frontend vs Node proxy).

### Acceptance criteria

- [ ] Fresh clone + `npm ci` + `npm run typecheck` succeeds.
- [ ] Fresh clone + `npm run build` succeeds.
- [ ] No secrets in git history.

## Milestone 1 — Mitgliederzugang (WordPress → WebApp) (3–7 Tage)

**Goal:** Members-only access backed by WordPress membership status.

- [ ] Decide auth strategy: WordPress JWT SSO.
- [ ] WordPress: endpoint/plugin issues JWT for active members only.
- [ ] Backend: `POST /auth/verify` verifies JWT and returns user profile + roles.
- [ ] Frontend: login/SSO flow + route/screen guard.
- [ ] Logout + token refresh.
- [ ] Roles at minimum: `member`, `admin`.

### Env checklist

- [ ] Set `WP_JWT_SECRET` (HS256) **or** `WP_JWT_PUBLIC_KEY` (RS256) on the server.
- [ ] Optionally set `WP_JWT_ISSUER` / `WP_JWT_AUDIENCE` to harden verification.
- [ ] Set `FRONTEND_ORIGINS` in production (CORS).
- [ ] (Frontend) Set `VITE_WP_SSO_URL` to start SSO login.

### Acceptance criteria

- [ ] Without token: app shows login screen (no content screens).
- [ ] With valid member token: app loads normally.
- [ ] With non-member token: access denied.

## Milestone 2 — Progress & Gamification server-side (1–2 Wochen)

- [ ] Choose DB (Supabase/Neon/Postgres).
- [ ] Tables: `users`, `progress`, `streaks`, `attempts`.
- [ ] API: load/save progress (replace local-only storage).
- [ ] Define streak rules.
- [ ] Today screen uses real goals.

## Milestone 3 — Content system (1–3 Wochen)

- [ ] Content model: Werk → Traktat → Abschnitt → Lernkarte.
- [ ] Each card: original, explanation, quiz, reflection, practice.
- [ ] Import pipeline (manual first).
- [ ] Minimal admin/editor area.
- [ ] Versioning + sources.

## Milestone 4 — KI „perfekt, aber gezügelt“ (1 Woche)

- [ ] AI proxy requires auth.
- [ ] Rate limit per user.
- [ ] Minimal logging (privacy-friendly).
- [ ] Standardize AI output JSON: `score`, `feedback`, `next_step`, `risk_flags`.
- [ ] Prompt guardrails.
- [ ] Store reflections (journal).

## Milestone 5 — Design & UX (1–2 Wochen fokussiert)

- [ ] Design system: typography, spacing, components, states.
- [ ] Onboarding: goal → 5-min rhythm → first lesson → reward.
- [ ] Motivation loop: Daily quest + XP + badge + next step.
- [ ] Accessibility basics.

## Milestone 6 — Deployment & Operations (3–5 Tage)

- [ ] Hosting plan (frontend / backend / DB).
- [ ] Domain + SSL.
- [ ] ENV management (keys server-side only).
- [ ] Monitoring (healthcheck + error logging).

## “Top 10” first actions

- [ ] Repo private + `.gitignore` correct + no `node_modules/dist` in git.
- [ ] CI: build + typecheck.
- [ ] Auth plan: WordPress → JWT.
- [ ] Frontend login guard.
- [ ] DB schema: users/progress/streaks.
- [ ] Replace LocalStorage-only progress.
- [ ] Lock content model.
- [ ] Minimal admin for content.
- [ ] Secure AI endpoint + rate limit.
- [ ] Onboarding + daily quest as product core.
