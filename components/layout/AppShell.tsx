import React from 'react';
import { BottomTabs, TabKey } from './BottomTabs';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import type { Language, UserProgress } from '../../types';

type AppShellProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  userProgress: UserProgress;
  language: Language;
  labels: {
    home: string;
    practice: string;
    profile: string;
  };
  children: React.ReactNode;
};

export function AppShell({
  activeTab,
  onTabChange,
  userProgress,
  language,
  labels,
  children
}: AppShellProps) {
  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
      <TopBar userProgress={userProgress} language={language} />

      <div className="mx-auto flex max-w-6xl gap-5">
        <SidebarNav active={activeTab} onChange={onTabChange} labels={labels} />

        <main className="flex-1 px-4 pb-24 pt-6 sm:pb-8">
          {children}
        </main>
      </div>

      <BottomTabs active={activeTab} onChange={onTabChange} labels={labels} />
    </div>
  );
}
