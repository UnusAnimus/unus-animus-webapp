import React, { useRef, useState } from 'react';
import type { Language, UserProgress } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Moon, RefreshCw, Sun } from '../components/ui/Icons';
import { t } from '../utils/translations';

type ProfileScreenProps = {
  userProgress: UserProgress;
  language: Language;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onReset: () => void;
};

export function ProfileScreen({
  userProgress,
  language,
  onToggleLanguage,
  onToggleTheme,
  onReset,
}: ProfileScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const levelProgress = Math.min(1, (userProgress.xp % 100) / 100);
  const progressPercent = Math.round(levelProgress * 100);

  const themeLabel =
    userProgress.theme === 'light' ? t(language, 'lightMode') : t(language, 'darkMode');
  const ThemeIcon = userProgress.theme === 'light' ? Sun : Moon;

  const downloadJson = (filename: string, obj: unknown) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Minimal sanity check to avoid nuking storage with wrong file types.
      if (!parsed || typeof parsed !== 'object' || typeof parsed.language !== 'string') {
        throw new Error(language === 'de' ? 'Ungültige Datei.' : 'Invalid file.');
      }

      localStorage.setItem('kybalion_user_progress', JSON.stringify(parsed));
      window.location.reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : undefined;
      setImportError(message || (language === 'de' ? 'Import fehlgeschlagen.' : 'Import failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {t(language, 'profile')}
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">
          {t(language, 'profile')}
        </h1>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t(language, 'level')}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              XP: {userProgress.xp}
            </div>
          </div>
          <div className="rounded-2xl bg-hermetic-accent/15 px-3 py-1 text-sm font-bold text-hermetic-accent">
            {progressPercent}%
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={progressPercent} />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t(language, 'switchLanguage')}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-lg font-bold">{language.toUpperCase()}</div>
            <Button variant="soft" onClick={onToggleLanguage}>
              <RefreshCw className="h-4 w-4" />
              {t(language, 'switchLanguage')}
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t(language, 'switchTheme')}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-lg font-bold">{themeLabel}</div>
            <Button variant="soft" onClick={onToggleTheme}>
              <ThemeIcon className="h-4 w-4" />
              {t(language, 'switchTheme')}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {language === 'de' ? 'Daten zurücksetzen' : 'Reset data'}
        </div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {language === 'de'
            ? 'Setzt lokalen Fortschritt zurück (LocalStorage).'
            : 'Resets local progress (LocalStorage).'}
        </div>
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={() => {
              const ok = window.confirm(
                language === 'de'
                  ? 'Wirklich alles lokal löschen? Das kann nicht rückgängig gemacht werden.'
                  : 'Really delete local data? This cannot be undone.'
              );
              if (!ok) return;
              onReset();
            }}
          >
            {t(language, 'reset')}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {language === 'de' ? 'Daten exportieren / importieren' : 'Export / import data'}
        </div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {language === 'de'
            ? 'Backup als JSON oder Wiederherstellung aus Datei.'
            : 'Backup as JSON or restore from file.'}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="soft"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              downloadJson(`kybalion-path-backup-${today}.json`, userProgress);
            }}
          >
            {language === 'de' ? 'Export (JSON)' : 'Export (JSON)'}
          </Button>

          <Button
            variant="soft"
            onClick={() => {
              setImportError(null);
              fileInputRef.current?.click();
            }}
          >
            {language === 'de' ? 'Import…' : 'Import…'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {importError && (
          <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
            {importError}
          </div>
        )}
      </Card>
    </div>
  );
}
