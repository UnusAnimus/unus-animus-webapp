<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TzCsvN5_ddHchQ2Ts5UPbh97as1FIGOV

## Run Locally

**Prerequisites:** Node.js (LTS recommended, e.g. Node 20)

1. Install dependencies:
   `npm install`
2. (Optional) Set AI keys in `.env.local` (see `.env.example`).
   - `OPENAI_API_KEY` (preferred if set)
   - `OPENAI_MODEL` (default: `gpt-4o-mini`)
   - `GEMINI_API_KEY` (fallback)
3. Run the app (web + AI proxy):
   `npm run dev:full`

This starts:

- Web (Vite): http://localhost:3000/
- AI proxy (Express): http://localhost:8787/health

### Scripts

- `npm run dev`: frontend only (Vite)
- `npm run dev:full`: frontend + AI proxy (recommended for local dev)
- `npm run build`: production build (outputs `dist/`)
- `npm run preview`: preview the production build
- `npm run typecheck`: TypeScript typecheck (no emit)
- `npm run lint`: ESLint
- `npm run format`: Prettier write
- `npm run format:check`: Prettier check

## Environment variables

This repo intentionally keeps API keys **server-side** (AI proxy). Do **not** put secrets into Vite `VITE_*` vars.

### AI proxy (Node / Express)

Defined via `.env.local` or host environment variables.

- `OPENAI_API_KEY`: if set, proxy uses OpenAI
- `OPENAI_MODEL`: OpenAI model name (default `gpt-4o-mini`)
- `GEMINI_API_KEY`: fallback if no OpenAI key is set
- `PORT`: proxy port (default `8787`)

### WordPress JWT SSO (members-only)

If you configure WordPress JWT env vars, the app becomes **members-only** and the backend will require a valid token.

- `WP_JWT_SECRET`: HMAC secret for HS256 tokens (server-side)
- `WP_JWT_PUBLIC_KEY`: public key PEM for RS256 tokens (server-side)
- `WP_JWT_ISSUER`: optional JWT issuer check
- `WP_JWT_AUDIENCE`: optional JWT audience check
- `FRONTEND_ORIGINS`: comma-separated list of allowed frontend origins for CORS (localhost is always allowed in dev)

### Frontend (Vite)

- `VITE_AI_PROXY_URL`: optional base URL for the AI proxy.
  - Default: `http://localhost:8787`
  - Example (production): `https://api.example.com`

- `VITE_WP_SSO_URL`: optional URL to start the WordPress SSO flow.
  - Expected behavior: redirects back to the app with `?token=...` (JWT)

### Windows: start script

If you're on Windows, you can use the included PowerShell script:

```powershell
./start-dev.ps1
```

If PowerShell blocks script execution, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

### Troubleshooting

- **`npm run dev:full` exits with code 1**: run it again to see the full error output; common causes are missing dependencies (`npm install`) or an unsupported Node.js version.
- **`ERR_CONNECTION_REFUSED` when opening `http://localhost:3000/`**: the dev server is not running (or crashed). Start it with `npm run dev:full` and confirm port `3000` is free.
- **If `localhost` still fails on Windows**: try `http://127.0.0.1:3000/` (IPv4). You can also use `./start-dev.ps1`, which starts Vite with a host setting that works with `localhost`.
- **Port 3000 already in use**: this project is configured to use port `3000` (see `vite.config.ts`). Stop the process using the port, or change `server.port` in `vite.config.ts`.
- **Blank page when opened via XAMPP/Apache**: Apache cannot run TypeScript/React source files directly. Use the dev server (`npm run dev:full`) or build and serve `dist/` (see below).

## Using XAMPP / Apache (http://localhost/kybalion-path/)

This project is a Vite + React + TypeScript app. Apache cannot execute `.tsx`/TypeScript directly, so opening the project folder via XAMPP will typically show a blank page and console errors (modules not loading / wrong MIME type / syntax errors).

### Recommended: Dev mode (fastest)

1. Install Node.js (LTS) so `node`/`npm` are available.
2. In this folder run:
   - `npm install`
   - `npm run dev:full`
3. Open: `http://localhost:3000/` (see `vite.config.ts`).

### Production build under Apache

1. Build:
   - `npm install`
   - `npm run build`
2. Configure Apache to serve the built output folder `dist/`.

For example, create an Apache alias so the URL stays `http://localhost/kybalion-path/`:

`Alias /kybalion-path "c:/xampp/htdocs/kybalion-path/dist"`

Also make sure the corresponding `<Directory ...>` block allows access.

### Apache <Directory> example (for XAMPP)

```apache
Alias /kybalion-path "c:/xampp/htdocs/kybalion-path/dist"

<Directory "c:/xampp/htdocs/kybalion-path/dist">
   Options Indexes FollowSymLinks
   AllowOverride All
   Require all granted
</Directory>

## Production / Deploy notes

### Option A: Static frontend only (no AI features)

Build and serve the contents of `dist/` from any static host.

### Option B: Static frontend + AI proxy

You need two deployments:

1) Frontend: build with Vite and serve `dist/`.
- Configure the frontend to point to your proxy by setting `VITE_AI_PROXY_URL` at build time.

2) AI proxy: run `node server/index.mjs` on a server.
- Provide `OPENAI_API_KEY` or `GEMINI_API_KEY` via environment variables.
- Put it behind a reverse proxy (nginx/Apache) and expose `/health` for simple monitoring.

```
