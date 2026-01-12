import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type AuthScreenProps = {
  error?: string | null;
  isWorking?: boolean;
  onSubmitToken: (token: string) => void;
};

export function AuthScreen({ error, isWorking, onSubmitToken }: AuthScreenProps) {
  const [token, setToken] = useState('');

  const wpSsoUrl = useMemo(() => {
    const url =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_WP_SSO_URL
        ? import.meta.env.VITE_WP_SSO_URL
        : undefined;
    if (!url) return null;
    return url;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Members only
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold">Kybalion Path</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Bitte melde dich als Vereinsmitglied an.
          </p>
        </div>

        <Card className="p-5">
          {wpSsoUrl && (
            <div className="mb-4">
              <a
                href={wpSsoUrl}
                className="block rounded-xl bg-hermetic-accent px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:brightness-110"
              >
                Login via WordPress
              </a>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Wenn WordPress dich zurückleitet, kann ein `?token=...` Parameter automatisch
                übernommen werden.
              </div>
              <div className="my-4 h-px bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          )}

          <div className="text-sm font-semibold">JWT Token</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Alternativ kannst du ein JWT (von WordPress) einfügen.
          </div>

          <textarea
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="eyJhbGciOi..."
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-hermetic-accent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            rows={4}
          />

          {error && (
            <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="mt-4">
            <Button
              className="w-full"
              variant="primary"
              disabled={isWorking || token.trim().length < 10}
              onClick={() => onSubmitToken(token.trim())}
            >
              {isWorking ? 'Prüfe…' : 'Anmelden'}
            </Button>
          </div>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Hinweis: API-Keys bleiben serverseitig. Der Token wird lokal (LocalStorage) gespeichert.
          </div>
        </Card>
      </div>
    </div>
  );
}
