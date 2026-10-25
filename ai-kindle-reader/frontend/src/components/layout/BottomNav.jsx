'use client';

import Link from 'next/link';
import { NAV, isActive } from './Sidebar';

export function BottomNav({ pathname }) {
  return (
    <nav
      aria-label="Primary mobile"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {NAV.filter((n) => n.mobile).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={`flex flex-1 flex-col items-center justify-center min-h-[44px] min-w-[44px] relative py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? 'text-ink' : 'text-muted'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] font-[300] transition-colors ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-sans font-medium tracking-wide">
                {item.label}
              </span>
              {active && (
                <span
                  className="w-1 h-1 rounded-full bg-accent mt-0.5"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
