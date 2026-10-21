'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';

const LIBRARY_BOOKS = [
  {
    id: 'piranesi',
    title: 'Piranesi',
    displayTitle: 'Piranesi',
    author: 'Susanna Clarke',
    shortAuthor: 'S. Clarke',
    status: 'reading',
    progress: 62,
    year: '2020',
    type: 'image',
    coverUrl:
      'https://lh3.googleusercontent.com/aida/AEtjO1VSEdXtt9lFB_oueobHl9Z9qeoEAekN47imgvUsZLI2-Uff1ZzipCPscb1VohS-FAbNKwsG6DqDS2vZBRI4KqffYxHFMULkx8DZ2Q8VaB5xgdkW4JTsUT8ObDcXEANZEniGr6-CxJ5l08vasNGAdf2X8NOU_nRzW5MKu7ME850sx5odaquTkDIiEtUQWhsNjUK0sBfewJZ14mrM5ZSuj-YNnupHBnCVEOYtmG4tb6JVTledyk6SVqrzBPs',
  },
  {
    id: 'little-women',
    title: 'Little Women',
    displayTitle: 'Little Women',
    author: 'Louisa May Alcott',
    shortAuthor: 'L. Alcott',
    status: 'reading',
    progress: 84,
    year: '1868',
    type: 'green-classic',
  },
  {
    id: 'jane-eyre',
    title: 'Jane Eyre',
    displayTitle: 'Jane Eyre',
    author: 'Charlotte Brontë',
    shortAuthor: 'C. Brontë',
    status: 'finished',
    progress: 100,
    year: '1847',
    type: 'burgundy-done',
  },
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    displayTitle: 'Pride & Prejudice',
    author: 'Jane Austen',
    shortAuthor: 'J. Austen',
    status: 'finished',
    progress: 45,
    year: '1813',
    type: 'parchment',
  },
  {
    id: 'crime-and-punishment',
    title: 'Crime and Punishment',
    displayTitle: 'Crime & Punish...',
    author: 'Fyodor Dostoevsky',
    shortAuthor: 'F. Dostoevsky',
    status: 'to-read',
    progress: 15,
    year: '1866',
    type: 'dark-slate',
  },
  {
    id: 'anne-of-green-gables',
    title: 'Anne of Green Gables',
    displayTitle: 'Anne of Green...',
    author: 'L. M. Montgomery',
    shortAuthor: 'L. Montgomery',
    status: 'finished',
    progress: 100,
    year: '1908',
    type: 'sky-done',
  },
];

export default function Page() {
  const router = useRouter();
  const { openImportModal, showToast } = useTheme();
  const [viewMode, setViewMode] = useState('grid'); // 'spine' | 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reading' | 'finished' | 'to-read'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'progress'

  const filteredBooks = useMemo(() => {
    let list = LIBRARY_BOOKS.filter((b) => {
      if (activeFilter !== 'all' && b.status !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      }
      return true;
    });
    if (sortBy === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => b.progress - a.progress);
    }
    return list;
  }, [activeFilter, searchQuery, sortBy]);

  const cycleSort = () => {
    const next = sortBy === 'recent' ? 'title' : sortBy === 'title' ? 'progress' : 'recent';
    setSortBy(next);
    showToast(`Sorted by ${next === 'recent' ? 'Recent' : next === 'title' ? 'Title (A–Z)' : 'Reading Progress'}`);
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary">
      <div className="w-full bg-background relative flex-col overflow-x-hidden pb-28 md:pb-10">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#dce9f5]/70 dark:from-[#1c2438] via-[#e9f0f6]/40 dark:via-[#161c2d]/70 to-transparent z-0"></div>
        <section className="relative z-10 px-5 md:px-8 pt-3 pb-2">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-normal">
                The Library
              </h2>
              <p className="font-body-ui text-label-md text-on-surface-variant mt-0.5">
                every book you keep ·{' '}
                <span className="font-body-ui-bold text-on-surface">
                  {filteredBooks.length} volumes
                </span>
              </p>
            </div>
            <div className="flex items-center p-1 bg-surface-container-high/70 backdrop-blur-md rounded-full subtle-paper-border shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('spine')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'spine'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Spine Shelf View"
              >
                <span className="material-symbols-outlined text-[17px]">view_column</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Cover Grid View"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  grid_view
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Compact Feed View"
              >
                <span className="material-symbols-outlined text-[17px]">
                  format_list_bulleted
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 md:px-8 py-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[19px]">search</span>
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest/80 backdrop-blur-md subtle-paper-border rounded-xl font-body-ui text-label-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-surface-tint focus:border-surface-tint transition-all shadow-sm"
                placeholder="Search everything... (title, author, quote)"
                type="text"
              />
            </div>
            <button
              type="button"
              onClick={cycleSort}
              className="relative w-9 h-9 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md subtle-paper-border flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 shadow-sm transition-all"
              title={`Sort by ${sortBy}`}
            >
              <span className="material-symbols-outlined text-[19px]">swap_vert</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveFilter((f) =>
                  f === 'all' ? 'reading' : f === 'reading' ? 'finished' : 'all'
                )
              }
              className="relative w-9 h-9 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md subtle-paper-border flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 shadow-sm transition-all"
              title="Filters"
            >
              <span className="material-symbols-outlined text-[19px]">filter_list</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-secondary rounded-full ring-1 ring-surface-container-lowest"></span>
            </button>
          </div>
        </section>

        <section className="relative z-10 mt-2 px-5 md:px-8">
          <div className="flex justify-between items-baseline mb-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <h3 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                Current Shelf
              </h3>
              <span className="font-body-ui text-caption text-on-surface-variant">
                · On The Desk
              </span>
            </div>
            <button
              type="button"
              onClick={cycleSort}
              className="text-caption font-body-ui-bold text-on-surface-variant hover:text-primary transition-colors flex items-center space-x-0.5"
            >
              <span>Arrange</span>
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          </div>

          <div className="relative bg-surface-container-low/70 rounded-2xl p-3 pb-0 subtle-paper-border shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/[0.04] to-transparent pointer-events-none"></div>
            <div className="flex items-end justify-between space-x-1.5 overflow-x-auto no-scrollbar pt-2 pb-1 relative z-10 px-1">
              <Link
                href="/reader/piranesi"
                className="group relative flex-shrink-0 w-11 h-44 rounded-t-[4px] bg-[#223348] text-[#e3e9f0] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-between items-center w-full border-b border-[#e3e9f0]/20 pb-1">
                  <span className="text-[8px] font-caption tracking-widest text-[#97acc8]">01</span>
                  <span className="w-1 h-1 rounded-full bg-[#ffbb84]"></span>
                </div>
                <div className="h-28 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[13px] tracking-widest uppercase font-medium text-white/95">
                    Piranesi
                  </span>
                </div>
                <div className="border-t border-[#e3e9f0]/20 pt-1 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-[#97acc8]">
                    SC
                  </span>
                </div>
              </Link>

              <Link
                href="/reader/jane-eyre"
                className="group relative flex-shrink-0 w-10 h-40 rounded-t-[4px] bg-[#53232b] text-[#f7e6e8] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-center items-center w-full border-b border-amber-200/30 pb-0.5">
                  <span
                    className="material-symbols-outlined text-[10px] text-amber-200/70"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </div>
                <div className="h-24 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[12px] tracking-wide text-amber-100/90 font-medium">
                    Jane Eyre
                  </span>
                </div>
                <div className="border-t border-amber-200/30 pt-0.5 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-amber-200/60">
                    CB
                  </span>
                </div>
              </Link>

              <Link
                href="/reader/little-women"
                className="group relative flex-shrink-0 w-12 h-48 rounded-t-[4px] bg-[#2d4237] text-[#e2ede6] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-between items-center w-full border-b border-emerald-100/20 pb-1">
                  <span className="text-[8px] font-caption text-emerald-200/60">VOL. I</span>
                  <span className="w-1 h-2 bg-amber-400/60 rounded-xs"></span>
                </div>
                <div className="h-32 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[13px] tracking-wider font-medium text-emerald-50">
                    Little Women
                  </span>
                </div>
                <div className="border-t border-emerald-100/20 pt-1 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-emerald-200/60">
                    LMA
                  </span>
                </div>
              </Link>

              <Link
                href="/reader/pride-and-prejudice"
                className="group relative flex-shrink-0 w-10 h-42 rounded-t-[4px] bg-[#8a4e28] text-[#fdece2] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-center items-center w-full border-b border-orange-200/30 pb-0.5">
                  <span className="text-[7px] font-caption tracking-widest text-orange-200/70">
                    CLASSIC
                  </span>
                </div>
                <div className="h-26 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[11px] tracking-wide text-orange-100 font-medium">
                    Pride &amp; Prejudice
                  </span>
                </div>
                <div className="border-t border-orange-200/30 pt-0.5 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-orange-200/60">
                    JA
                  </span>
                </div>
              </Link>

              <Link
                href="/reader/crime-and-punishment"
                className="group relative flex-shrink-0 w-11 h-46 rounded-t-[4px] bg-[#1c232c] text-[#d6dade] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-between items-center w-full border-b border-white/20 pb-1">
                  <span className="text-[8px] font-caption text-zinc-400">1866</span>
                  <span className="w-1.5 h-1.5 border border-amber-300/60 rotate-45"></span>
                </div>
                <div className="h-30 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[12px] tracking-tight font-medium text-zinc-100">
                    Crime &amp; Punishment
                  </span>
                </div>
                <div className="border-t border-white/20 pt-1 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-zinc-400">
                    FD
                  </span>
                </div>
              </Link>

              <Link
                href="/reader/frankenstein"
                className="group relative flex-shrink-0 w-10 h-38 rounded-t-[4px] bg-[#4a5859] text-[#ecefed] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95"
              >
                <div className="flex justify-center items-center w-full border-b border-teal-100/20 pb-0.5">
                  <span className="text-[7px] font-caption text-teal-200/60">GOTHIC</span>
                </div>
                <div className="h-22 flex items-center justify-center">
                  <span className="spine-book font-headline-sm text-[11px] tracking-wide text-teal-50 font-medium">
                    Frankenstein
                  </span>
                </div>
                <div className="border-t border-teal-100/20 pt-0.5 text-center">
                  <span className="font-body-ui-bold text-[8px] tracking-wider text-teal-200/60">
                    MS
                  </span>
                </div>
              </Link>
            </div>
            <div className="h-3.5 -mx-3 bg-gradient-to-r from-[#d8cebe] via-[#e5dccf] to-[#d8cebe] dark:from-[#262F42] dark:via-[#2F3A52] dark:to-[#222B3C] border-t border-[#c5baaa] dark:border-white/10 flex items-center px-4 shadow-sm">
              <div className="w-full h-[1px] bg-white/40 dark:bg-white/10"></div>
            </div>
            <div className="h-2 -mx-3 bg-gradient-to-b from-[#b8ab99]/60 to-[#a39482]/20 dark:from-black/40 dark:to-transparent"></div>
          </div>
        </section>

        <section className="relative z-10 px-5 md:px-8 pt-6">
          <div className="flex flex-col space-y-2.5 mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                All Books
              </h3>
              <span className="font-body-ui text-caption text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                Vault • Local-first
              </span>
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All (6)' },
                { id: 'reading', label: 'Reading (2)' },
                { id: 'finished', label: 'Finished (3)' },
                { id: 'to-read', label: 'To Read (1)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-caption active:scale-95 transition-all ${
                    activeFilter === tab.id
                      ? 'font-body-ui-bold bg-primary text-on-primary shadow-sm'
                      : 'font-body-ui text-on-surface-variant bg-surface-container-lowest/90 subtle-paper-border hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2.5">
              {filteredBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="bg-surface-container-lowest/90 border border-outline-variant/30 rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="min-w-0">
                    <h4 className="font-headline-sm text-[16px] text-primary font-medium truncate">
                      {book.title}
                    </h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {book.author} · {book.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-caption font-label-sm text-primary">
                      {book.progress === 100 ? 'Done' : `${book.progress}%`}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-outline">
                      chevron_right
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 md:gap-x-5 gap-y-5 md:gap-y-7">
              {filteredBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="flex flex-col group cursor-pointer active:scale-95 transition-transform"
                >
                  {book.type === 'image' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-surface-container">
                      <img
                        alt={`Editorial book cover illustration for ${book.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        src={book.coverUrl}
                      />
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#152a41]/85 backdrop-blur-sm text-[9px] font-body-ui text-white">
                        {book.progress}%
                      </div>
                    </div>
                  )}

                  {book.type === 'green-classic' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-[#2c4839] p-2 flex flex-col justify-between border-l-[3px] border-[#1e3428]">
                      <div className="absolute inset-1.5 border border-amber-200/30 rounded pointer-events-none"></div>
                      <div className="text-right z-10">
                        <span className="text-[8px] font-caption text-emerald-200/80 tracking-widest">
                          1868
                        </span>
                      </div>
                      <div className="text-center z-10 px-0.5">
                        <span className="font-headline-md text-[13px] leading-tight text-amber-100 font-medium block">
                          Little Women
                        </span>
                        <span className="text-[8px] font-body-ui text-emerald-100/70 block mt-1">
                          L.M. Alcott
                        </span>
                      </div>
                      <div className="z-10 flex justify-end">
                        <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[9px] font-body-ui text-white">
                          84%
                        </span>
                      </div>
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-white/10 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {book.type === 'burgundy-done' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-[#5e2730] p-2 flex flex-col justify-between border-l-[3px] border-[#3f161d]">
                      <div className="absolute inset-1.5 border border-amber-100/25 rounded pointer-events-none"></div>
                      <div className="z-10 flex justify-between items-center">
                        <span
                          className="material-symbols-outlined text-[13px] text-amber-200/90"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          bookmark
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-body-ui-bold bg-amber-100/90 text-[#5e2730] shadow-sm">
                          Done
                        </span>
                      </div>
                      <div className="text-center z-10 px-0.5">
                        <span className="font-headline-md text-[13px] leading-tight text-amber-50 font-medium block">
                          Jane Eyre
                        </span>
                        <span className="text-[8px] font-body-ui text-amber-200/70 block mt-1">
                          C. Brontë
                        </span>
                      </div>
                      <div className="z-10 text-center">
                        <span className="text-[7px] font-caption text-amber-200/60 uppercase tracking-widest">
                          Complete
                        </span>
                      </div>
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-white/10 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {book.type === 'parchment' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-[#f3ede1] p-2 flex flex-col justify-between border-l-[3px] border-[#dfd4c0]">
                      <div className="absolute inset-1.5 border border-[#855224]/20 rounded pointer-events-none"></div>
                      <div className="text-center pt-1 z-10">
                        <span className="material-symbols-outlined text-[14px] text-secondary/80">
                          local_florist
                        </span>
                      </div>
                      <div className="text-center z-10 px-0.5">
                        <span className="font-headline-md text-[12px] leading-tight text-[#2b1f15] font-semibold block">
                          Pride and Prejudice
                        </span>
                        <span className="text-[8px] font-body-ui text-secondary block mt-1">
                          Jane Austen
                        </span>
                      </div>
                      <div className="z-10 flex justify-end">
                        <span className="px-1.5 py-0.5 rounded bg-secondary/90 text-[9px] font-body-ui text-white">
                          45%
                        </span>
                      </div>
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/15 via-white/20 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {book.type === 'dark-slate' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-[#182029] p-2 flex flex-col justify-between border-l-[3px] border-[#0f141a]">
                      <div className="text-left z-10">
                        <span className="text-[8px] font-caption text-zinc-400/80 tracking-widest">
                          VI. PTS
                        </span>
                      </div>
                      <div className="text-center z-10 px-0.5">
                        <span className="font-headline-md text-[12px] leading-tight text-zinc-100 font-medium block">
                          Crime &amp; Punishment
                        </span>
                        <span className="text-[8px] font-body-ui text-zinc-400 block mt-1">
                          F. Dostoevsky
                        </span>
                      </div>
                      <div className="z-10 flex justify-end">
                        <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-body-ui text-white">
                          15%
                        </span>
                      </div>
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/45 via-white/5 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {book.type === 'sky-done' && (
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden cover-curve-shadow subtle-paper-border bg-[#dce7eb] p-2 flex flex-col justify-between border-l-[3px] border-[#baccd3]">
                      <div className="z-10 flex justify-between items-center">
                        <span className="material-symbols-outlined text-[13px] text-primary/70">
                          yard
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-body-ui-bold bg-primary text-white shadow-sm">
                          Done
                        </span>
                      </div>
                      <div className="text-center z-10 px-0.5">
                        <span className="font-headline-md text-[12px] leading-tight text-[#162935] font-semibold block">
                          Anne of Green Gables
                        </span>
                        <span className="text-[8px] font-body-ui text-primary/70 block mt-1">
                          L.M. Montgomery
                        </span>
                      </div>
                      <div className="z-10 text-center">
                        <span className="text-[7px] font-caption text-primary/60 uppercase tracking-widest">
                          Finished
                        </span>
                      </div>
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/15 via-white/20 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-col">
                    <h4 className="font-headline-sm text-[13px] leading-tight text-on-surface line-clamp-1 group-hover:text-primary">
                      {book.displayTitle}
                    </h4>
                    <p className="font-body-ui text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                      {book.shortAuthor}
                    </p>
                    <div className="w-full h-1 bg-[#E2EBF1] dark:bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          book.progress === 100 ? 'bg-primary w-full' : 'bg-secondary'
                        }`}
                        style={book.progress === 100 ? undefined : { width: `${book.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 mb-4 flex items-center justify-center">
            <Link
              href="/stats"
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-surface-container/60 backdrop-blur-md subtle-paper-border text-on-surface-variant hover:text-primary font-body-ui text-caption shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              <span>6 books kept · 2,418 pages read</span>
            </Link>
          </div>
        </section>

        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40">
          <button
            type="button"
            onClick={openImportModal}
            className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-lg shadow-primary/20 flex items-center justify-center hover:bg-primary active:scale-95 transition-all subtle-paper-border"
            title="Add Book (.epub, .txt)"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
