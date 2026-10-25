'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useTheme } from '@/components/common/ThemeProvider';

export function AppShell({ children }) {
  const pathname = usePathname();
  const { themeMode, cycleTheme, userName } = useTheme();

  return (
    <div className="min-h-dvh bg-background text-ink font-sans antialiased selection:bg-accent/20 selection:text-ink">
      <Sidebar
        pathname={pathname}
        themeMode={themeMode}
        cycleTheme={cycleTheme}
        userName={userName}
      />
      <main className="md:pl-20 lg:pl-64 min-h-dvh">
        {children}
      </main>
      <BottomNav pathname={pathname} />
    </div>
  );
}

export default AppShell;
