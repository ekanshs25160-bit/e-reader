'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { BOOKS } from '@/utils/booksData';

const READING_BOOKS = [BOOKS[0], BOOKS[1], BOOKS[2]]; // Piranesi, Little Women, Pride & Prejudice

const HOME_SHELF_SPINES = [
  {
    id: 'piranesi',
    width: 'w-10',
    height: 'h-52',
    bg: 'bg-[#1A2E46]',
    text: 'text-[#E6EFF8]',
    top: '01',
    title: 'PIRANESI',
    maxH: 'max-h-32',
    initials: 'SC',
    initialsColor: 'text-secondary-fixed-dim',
  },
  {
    id: 'jane-eyre',
    width: 'w-10',
    height: 'h-48',
    bg: 'bg-[#4A1924]',
    text: 'text-[#F9E8EC]',
    top: '☆',
    title: 'JANE EYRE',
    maxH: 'max-h-28',
    initials: 'CB',
    initialsColor: 'text-[#E7B5C1]',
  },
  {
    id: 'little-women',
    width: 'w-11',
    height: 'h-54',
    bg: 'bg-[#233829]',
    text: 'text-[#E5EFE7]',
    top: 'VOL. I',
    title: 'LITTLE WOMEN',
    maxH: 'max-h-34',
    initials: 'LMA',
    initialsColor: 'text-[#A5CDB0]',
  },
  {
    id: 'pride-and-prejudice',
    width: 'w-10',
    height: 'h-50',
    bg: 'bg-[#7B4D22]',
    text: 'text-[#FDF4EB]',
    top: 'CLAS.',
    title: 'PRIDE & PREJUDICE',
    maxH: 'max-h-30',
    initials: 'JA',
    initialsColor: 'text-[#F4CA9F]',
  },
  {
    id: 'crime-and-punishment',
    width: 'w-11',
    height: 'h-56',
    bg: 'bg-[#1F2730]',
    text: 'text-[#E0E6ED]',
    top: '1866',
    title: 'CRIME & PUNISHMENT',
    maxH: 'max-h-36',
    initials: 'FD',
    initialsColor: 'text-[#B0C4DB]',
  },
  {
    id: 'secret-garden',
    width: 'w-9',
    height: 'h-46',
    bg: 'bg-[#2B4B48]',
    text: 'text-[#E6F3F2]',
    top: '◇',
    title: 'SECRET GARDEN',
    maxH: 'max-h-26',
    initials: 'FHB',
    initialsColor: 'text-[#96C7C1]',
  },
];

export default function Page() {
  const router = useRouter();
  const { userName, openImportModal } = useTheme();
  const [readingIndex, setReadingIndex] = useState(0);
  const [shelfView, setShelfView] = useState('spine'); // 'spine' | 'grid' | 'list'

  const currentBook = READING_BOOKS[readingIndex];

  const prevBook = () => {
    setReadingIndex((i) => (i - 1 + READING_BOOKS.length) % READING_BOOKS.length);
  };
  const nextBook = () => {
    setReadingIndex((i) => (i + 1) % READING_BOOKS.length);
  };

  return (
    <div className="min-h-dvh bg-surface text-on-surface antialiased selection:bg-secondary-container/40 selection:text-secondary">
      <div className="w-full relative flex-col bg-gradient-to-b from-[#DCE9F5] dark:from-[#1c2438] via-surface-bright to-surface pb-28 md:pb-10">
        <div className="md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-sm dark:shadow-none flex justify-between items-center w-full px-gutter py-space-sm">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 shadow-xs">
              <img
                alt="Flyleaf profile reader"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UM82GOerrlrIjTHN3MQ0coHeRBhe1Xnxz6SbqF7RFCOrdzEQrw0OascZ9JCl8ESF16dK7SzVI6RfEoiagVAts-TGRT__BTx4cJzDY37szTssh_N_uopDZCcPTnF7UI_ErGXSGpdyvq6BPsvEv3-HA76moihGHwcapgFent3mVDcOt_LNSzeY3cb7ws7pqgw8No44XAT4hsjDwFGXIKHm2okxv1coDeJcX-qt1IDWHsQtGkcpWXxcy4XA"
              />
            </div>
            <div className="md:hidden font-headline-md text-headline-md text-primary dark:text-inverse-primary font-medium tracking-tight">
              Flyleaf
            </div>
          </Link>
          <button
            type="button"
            onClick={() => router.push('/library')}
            aria-label="Search Library"
            className="p-2 rounded-full hover:bg-surface-container-high/50 dark:hover:bg-surface-container/20 transition-colors active:scale-95 transition-transform duration-150 flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined text-[22px]" data-icon="search">
              search
            </span>
          </button>
        </div>

        <section className="px-6 md:px-8 pt-4 pb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-medium">
              Still awake, {userName}
            </h1>
            <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <Link href="/library" className="hover:text-primary transition-colors">
                6 books
              </Link>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <Link href="/vocabulary" className="hover:text-primary transition-colors">
                25 notes kept
              </Link>
            </p>
          </div>
          <Link
            href="/settings"
            title="Profile & Settings"
            className="relative w-12 h-12 rounded-full ring-2 ring-surface-container-lowest shadow-md overflow-hidden shrink-0 hover:scale-105 transition-transform"
          >
            <img
              alt="Reader illustrated portrait"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UM82GOerrlrIjTHN3MQ0coHeRBhe1Xnxz6SbqF7RFCOrdzEQrw0OascZ9JCl8ESF16dK7SzVI6RfEoiagVAts-TGRT__BTx4cJzDY37szTssh_N_uopDZCcPTnF7UI_ErGXSGpdyvq6BPsvEv3-HA76moihGHwcapgFent3mVDcOt_LNSzeY3cb7ws7pqgw8No44XAT4hsjDwFGXIKHm2okxv1coDeJcX-qt1IDWHsQtGkcpWXxcy4XA"
            />
          </Link>
        </section>

        <main className="px-5 md:px-8 space-y-4 pt-3 flex-1 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          <section className="lg:col-start-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-4 soft-editorial-shadow border border-black/5 relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-1 right-6 w-3 h-5 bg-[#B87D4B] rounded-b-sm shadow-xs opacity-90"></div>
            <div className="flex items-center justify-between mb-3 text-label-sm font-label-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="tracking-widest font-semibold uppercase">
                  Currently Reading
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm">
                <button
                  type="button"
                  onClick={prevBook}
                  aria-label="Previous book"
                  className="hover:text-primary transition-colors p-0.5 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <span className="tracking-widest text-[11px] font-medium">
                  {readingIndex + 1} / {READING_BOOKS.length}
                </span>
                <button
                  type="button"
                  onClick={nextBook}
                  aria-label="Next book"
                  className="hover:text-primary transition-colors p-0.5 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div
              onClick={() => router.push(`/reader/${currentBook.id}`)}
              className="flex gap-4 items-center cursor-pointer group"
            >
              <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden shadow-md border border-black/10">
                <img
                  alt={`${currentBook.title} cover`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={currentBook.coverUrl}
                />
                <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none"></div>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    {currentBook.author}
                  </span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-primary font-medium truncate leading-tight mb-1 group-hover:underline">
                  {currentBook.title}
                </h2>
                <p className="font-caption text-caption text-on-surface-variant mb-3">
                  {currentBook.pages} pages · local .epub
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                    <span className="text-on-surface font-semibold">
                      {currentBook.progress}% finished
                    </span>
                    <span className="text-on-surface-variant text-[11px]">
                      p. {currentBook.currentPage}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2EBF1] dark:bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${currentBook.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={`/reader/${currentBook.id}`}
              className="mt-4 w-full bg-primary-container text-on-primary py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-150"
            >
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              <span className="font-body-ui-bold text-body-ui-bold text-[14px]">
                Resume Reading
              </span>
            </Link>
          </section>

          <section
            onClick={() => router.push('/stats')}
            className="lg:col-start-1 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-3.5 soft-editorial-shadow border border-black/5 cursor-pointer hover:border-outline-variant/40 transition-all"
          >
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider font-semibold uppercase">
                Your Reading
              </span>
              <span
                aria-label="View Detailed Stats"
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-outline-variant/30 text-center py-1">
              <div className="px-2">
                <div className="font-headline-sm text-headline-sm text-primary font-medium">
                  1h 2m
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
                  This Week
                </div>
              </div>
              <div className="px-2">
                <div className="font-headline-sm text-headline-sm text-primary font-medium flex items-center justify-center gap-1">
                  <span>6</span>
                  <span className="text-[14px]">🔥</span>
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
                  Days Streak
                </div>
              </div>
              <div className="px-2">
                <div className="font-headline-sm text-headline-sm text-primary font-medium">
                  87h 58m
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
                  All Time
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-start-2 lg:row-start-1 lg:row-span-2 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-4 soft-editorial-shadow border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <Link href="/library" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h3 className="font-headline-sm text-headline-sm text-primary font-medium">
                  The Library
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-label-sm font-semibold rounded-full bg-surface-container text-on-surface-variant">
                  6
                </span>
              </Link>
              <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-black/5">
                <button
                  type="button"
                  onClick={() => setShelfView('spine')}
                  aria-label="Spine View"
                  className={`p-1 rounded transition-all flex items-center justify-center ${
                    shelfView === 'spine'
                      ? 'bg-surface-container-lowest shadow-xs text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_column</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShelfView('grid')}
                  aria-label="Grid View"
                  className={`p-1 rounded transition-all flex items-center justify-center ${
                    shelfView === 'grid'
                      ? 'bg-surface-container-lowest shadow-xs text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShelfView('list')}
                  aria-label="List View"
                  className={`p-1 rounded transition-all flex items-center justify-center ${
                    shelfView === 'list'
                      ? 'bg-surface-container-lowest shadow-xs text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    format_list_bulleted
                  </span>
                </button>
              </div>
            </div>

            {shelfView === 'spine' && (
              <div className="relative pt-2 pb-1">
                <div className="flex items-end justify-center gap-2 px-1 h-56">
                  {HOME_SHELF_SPINES.map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/book/${sp.id}`}
                      className={`${sp.width} ${sp.height} ${sp.bg} ${sp.text} rounded-t-sm flex flex-col justify-between items-center py-3.5 px-0.5 cursor-pointer transform hover:-translate-y-2 transition-transform duration-200 shadow-sm relative overflow-hidden group`}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-white/10"></div>
                      <div className="text-[8px] font-label-sm tracking-widest opacity-80">
                        {sp.top}
                      </div>
                      <span
                        className={`vertical-rl font-headline-sm text-[11px] tracking-wider uppercase font-medium spine-emboss transform rotate-180 truncate ${sp.maxH}`}
                      >
                        {sp.title}
                      </span>
                      <span
                        className={`text-[9px] font-label-sm tracking-widest font-bold ${sp.initialsColor}`}
                      >
                        {sp.initials}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="w-full h-3.5 bg-gradient-to-r from-[#DFD9CE] via-[#EAE5DC] to-[#D9D3C7] dark:from-[#262F42] dark:via-[#2F3A52] dark:to-[#222B3C] rounded-sm shelf-depth border-t border-white/60 dark:border-white/10 relative">
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 rounded-b-sm"></div>
                </div>
              </div>
            )}

            {shelfView === 'grid' && (
              <div className="grid grid-cols-3 gap-3 py-1">
                {BOOKS.slice(0, 6).map((b) => (
                  <Link
                    key={b.id}
                    href={`/book/${b.id}`}
                    className="group flex flex-col items-center text-center"
                  >
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-outline-variant/30 bg-surface-container">
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="font-headline-sm text-[12px] text-primary truncate w-full mt-1">
                      {b.shortTitle}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {shelfView === 'list' && (
              <div className="divide-y divide-outline-variant/20 py-1">
                {BOOKS.slice(0, 6).map((b) => (
                  <Link
                    key={b.id}
                    href={`/book/${b.id}`}
                    className="py-2 px-1 flex items-center justify-between hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-headline-sm text-[14px] text-primary truncate">
                        {b.title}
                      </p>
                      <p className="font-caption text-[11px] text-on-surface-variant">
                        {b.author}
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary shrink-0 ml-2">
                      {b.progress}%
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <p className="text-center font-caption text-caption text-on-surface-variant mt-3 tracking-wide">
              <Link href="/library" className="hover:text-primary transition-colors">
                6 books kept · 2,418 pages read
              </Link>
            </p>
          </section>
        </main>

        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40">
          <button
            type="button"
            onClick={openImportModal}
            aria-label="Import EPUB"
            className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-transform duration-150 border border-white/20"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
