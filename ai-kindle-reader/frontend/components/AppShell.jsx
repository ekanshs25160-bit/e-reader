'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';

// One nav for every screen size. `mobile: true` items appear in the bottom bar;
// every item appears in the side rail (tablet) and sidebar (laptop+).
const NAV = [
  { href: '/', label: 'Home', icon: 'home', mobile: true },
  { href: '/library', label: 'Library', icon: 'auto_stories', mobile: true },
  { href: '/browse', label: 'Browse', icon: 'explore', mobile: true },
  { href: '/vocabulary', label: 'Words', icon: 'style', mobile: true },
  { href: '/stats', label: 'Stats', icon: 'query_stats', mobile: true },
  { href: '/settings', label: 'Settings', icon: 'tune', mobile: true },
];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' || pathname === '/home-night' : pathname.startsWith(href);
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { isNight, toggleDayNight, userName } = useTheme();

  return (
    <div className={`min-h-dvh ${isNight ? 'dark bg-[#141824] text-[#F3F1EC]' : 'bg-background text-on-surface'}`}>
      {/* Side rail (md) → full sidebar (lg+) */}
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 z-40 w-20 lg:w-64 flex-col border-r backdrop-blur-md transition-colors ${
          isNight
            ? 'border-white/[0.08] bg-[#181E2C]/90 text-[#F3F1EC]'
            : 'border-outline-variant/40 bg-surface-container-low/80'
        }`}
      >
        <div className="flex h-16 items-center justify-center lg:justify-between lg:px-6">
          <Link
            href="/"
            className={`font-headline-md text-headline-md ${isNight ? 'text-[#F3F1EC]' : 'text-primary'}`}
          >
            <span className="lg:hidden">F</span>
            <span className="hidden lg:inline">Flyleaf</span>
          </Link>
          <button
            type="button"
            onClick={toggleDayNight}
            title={isNight ? 'Switch to Paper Day' : 'Switch to Night Sanctuary'}
            aria-label="Toggle Day/Night Theme"
            className={`hidden lg:flex w-8 h-8 rounded-full items-center justify-center transition-colors ${
              isNight
                ? 'bg-white/10 text-[#D8A868] hover:bg-white/20'
                : 'bg-surface-container-high/70 text-primary hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isNight ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex items-center justify-center gap-3 rounded-xl px-3 py-3 transition-colors lg:justify-start ' +
                  (active
                    ? isNight
                      ? 'bg-[#2B384E] text-[#D8A868] shadow-sm'
                      : 'bg-primary-container text-on-primary shadow-sm'
                    : isNight
                      ? 'text-[#8E9BAE] hover:bg-white/5 hover:text-[#F3F1EC]'
                      : 'text-on-surface-variant hover:bg-surface-container-high/60')
                }
              >
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                <span className="hidden lg:inline font-body-ui-bold text-body-ui-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile at the bottom of sidebar */}
        <div
          className={`border-t p-3 lg:px-4 flex items-center justify-center lg:justify-between gap-2 ${
            isNight ? 'border-white/[0.08]' : 'border-outline-variant/30'
          }`}
        >
          <Link
            href="/settings"
            className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 shadow-xs shrink-0">
              <img
                alt="Flyleaf profile reader"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UM82GOerrlrIjTHN3MQ0coHeRBhe1Xnxz6SbqF7RFCOrdzEQrw0OascZ9JCl8ESF16dK7SzVI6RfEoiagVAts-TGRT__BTx4cJzDY37szTssh_N_uopDZCcPTnF7UI_ErGXSGpdyvq6BPsvEv3-HA76moihGHwcapgFent3mVDcOt_LNSzeY3cb7ws7pqgw8No44XAT4hsjDwFGXIKHm2okxv1coDeJcX-qt1IDWHsQtGkcpWXxcy4XA"
              />
            </div>
            <div className="hidden lg:flex flex-col min-w-0">
              <span className={`font-body-ui-bold text-[13px] truncate ${isNight ? 'text-[#F3F1EC]' : 'text-primary'}`}>
                {userName}
              </span>
              <span className={`font-caption text-[11px] truncate ${isNight ? 'text-[#8E9BAE]' : 'text-on-surface-variant'}`}>
                Reader · Settings
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleDayNight}
            title={isNight ? 'Switch to Paper Day' : 'Switch to Night Sanctuary'}
            aria-label="Toggle Day/Night Theme"
            className={`lg:hidden w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isNight
                ? 'bg-white/10 text-[#D8A868]'
                : 'bg-surface-container-high/70 text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isNight ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </aside>

      {/* Content: full-bleed on phones, centred column on bigger screens */}
      <main className="md:pl-20 lg:pl-64">
        <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">{children}</div>
      </main>

      {/* Bottom bar (phones only) */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div
          className={`pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full border px-2 py-1.5 shadow-lg backdrop-blur-md ${
            isNight
              ? 'border-white/[0.08] bg-[#181E2C]/95 text-[#F3F1EC]'
              : 'border-black/5 bg-surface-container-lowest/90 text-on-surface'
          }`}
        >
          {NAV.filter((n) => n.mobile).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 ' +
                  (active
                    ? isNight
                      ? 'bg-[#2B384E] text-[#D8A868]'
                      : 'bg-primary-container text-on-primary'
                    : isNight
                      ? 'text-[#8E9BAE]'
                      : 'text-on-surface-variant')
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
