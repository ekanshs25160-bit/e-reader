'use client';

import Link from 'next/link';

export const NAV = [
  { href: '/', label: 'Home', icon: 'home', mobile: true },
  { href: '/library', label: 'Library', icon: 'auto_stories', mobile: true },
  { href: '/browse', label: 'Browse', icon: 'explore', mobile: true },
  { href: '/vocabulary', label: 'Words', icon: 'style', mobile: true },
  { href: '/stats', label: 'Stats', icon: 'query_stats', mobile: true },
  { href: '/settings', label: 'Settings', icon: 'tune', mobile: true },
];

export function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

const THEME_LABELS = {
  auto: 'Auto',
  paper: 'Paper',
  sepia: 'Sepia',
  night: 'Night',
  oled: 'OLED',
};

const THEME_ICONS = {
  auto: 'brightness_auto',
  paper: 'light_mode',
  sepia: 'auto_stories',
  night: 'dark_mode',
  oled: 'contrast',
};

export function Sidebar({ pathname, themeMode, cycleTheme, userName }) {
  const currentThemeLabel = THEME_LABELS[themeMode] || 'Auto';
  const currentThemeIcon = THEME_ICONS[themeMode] || 'contrast';

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 lg:w-64 flex-col border-r border-hairline bg-surface transition-colors">
      <div className="flex h-16 items-center justify-center lg:justify-between px-4 lg:px-6 border-b border-hairline">
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <span className="font-serif text-[24px] lg:text-[26px] font-normal text-ink tracking-tight">
            <span className="lg:hidden">F</span>
            <span className="hidden lg:inline">Flyleaf</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${currentThemeLabel} (click to cycle)`}
          aria-label={`Cycle theme. Current theme is ${currentThemeLabel}`}
          className="hidden lg:flex w-9 h-9 rounded-full items-center justify-center text-muted hover:text-ink hover:bg-hairline/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="material-symbols-outlined text-[20px] font-[300]">
            {currentThemeIcon}
          </span>
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 py-4">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center justify-center lg:justify-start gap-3.5 px-4 lg:px-6 py-3 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? 'text-ink font-medium'
                  : 'text-muted hover:text-ink font-normal'
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 inset-y-2 w-[2px] bg-accent rounded-r"
                  aria-hidden="true"
                />
              )}
              <span
                className={`material-symbols-outlined text-[22px] font-[300] transition-colors ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {item.icon}
              </span>
              <span className="hidden lg:inline font-sans text-[14.5px] tracking-normal">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3 lg:px-6 flex items-center justify-center lg:justify-between gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 min-w-0 min-h-[44px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          aria-label="Settings and user profile"
        >
          <div className="w-8 h-8 rounded-full border border-hairline bg-surface text-ink flex items-center justify-center font-serif text-[13px] shrink-0 group-hover:border-ink transition-colors">
            <span>{(userName || 'R').slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="font-sans text-[13.5px] font-medium text-ink truncate">
              {userName || 'Reader'}
            </span>
            <span className="font-sans text-[10.5px] uppercase tracking-[0.12em] text-muted truncate">
              Desk Settings
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${currentThemeLabel} (click to cycle)`}
          aria-label={`Cycle theme. Current theme is ${currentThemeLabel}`}
          className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="material-symbols-outlined text-[18px] font-[300]">
            {currentThemeIcon}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
