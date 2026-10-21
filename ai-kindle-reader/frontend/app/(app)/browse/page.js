'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';

const TOPICS = [
  'All Classics',
  'Philosophy',
  'Gothic Fiction',
  'Russian Lit',
  'Sci-Fi & Fantasy',
  'Poetry',
  'Essays',
];

const TRENDING_SPINES = [
  {
    id: 'crime-and-punishment',
    height: 'h-44 sm:h-48',
    bg: 'bg-[#1a2b3c]',
    topType: 'text',
    top: 'VIII',
    topColor: 'text-[#e0b878]',
    title: 'Crime and Punishment',
    titleColor: 'text-surface',
    maxH: 'max-h-28',
    author: 'Dostoevsky',
    authorColor: 'text-white/70',
  },
  {
    id: 'frankenstein',
    height: 'h-40 sm:h-44',
    bg: 'bg-[#3a4d3f]',
    topType: 'icon',
    top: 'spa',
    topColor: 'text-[#a8c3af]',
    title: 'Frankenstein',
    titleColor: 'text-[#e6ede7]',
    maxH: 'max-h-24',
    author: 'M. Shelley',
    authorColor: 'text-[#a8c3af]',
  },
  {
    id: 'odyssey',
    height: 'h-48 sm:h-52',
    bg: 'bg-[#8a4229]',
    topType: 'text-serif',
    top: 'Ω',
    topColor: 'text-[#ffd6b8]',
    title: 'The Odyssey',
    titleColor: 'text-[#fff0e6]',
    maxH: 'max-h-32',
    author: 'Homer',
    authorColor: 'text-[#ffd6b8]',
  },
  {
    id: 'meditations',
    height: 'h-42 sm:h-46',
    bg: 'bg-[#7d5628]',
    topType: 'icon',
    top: 'star',
    topColor: 'text-[#ffe09e]',
    title: 'Meditations',
    titleColor: 'text-[#fff4df]',
    maxH: 'max-h-26',
    author: 'Aurelius',
    authorColor: 'text-[#ffe09e]',
  },
  {
    id: 'moby-dick',
    height: 'h-46 sm:h-50',
    bg: 'bg-[#22454a]',
    topType: 'icon',
    top: 'sailing',
    topColor: 'text-[#84bcc4]',
    title: 'Moby Dick',
    titleColor: 'text-[#e0f1f3]',
    maxH: 'max-h-30',
    author: 'Melville',
    authorColor: 'text-[#84bcc4]',
  },
  {
    id: 'dracula',
    height: 'h-44 sm:h-48',
    bg: 'bg-[#4a1c24]',
    topType: 'icon',
    top: 'cruelty_free',
    topColor: 'text-[#e89ca9]',
    title: 'Dracula',
    titleColor: 'text-[#fbecee]',
    maxH: 'max-h-28',
    author: 'B. Stoker',
    authorColor: 'text-[#e89ca9]',
  },
];

const CATALOG_BOOKS = [
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    rating: '4.8',
    meta: '1813 · 351 pages · EPUB · 420 KB',
    topic: 'All Classics',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAeACwBV0M2iT0v1zMj6buRFY5ZzSPUL-cfzJLJgK_Uta9spP87zbWIpy4uMhPqUcMFPn3ASsRwGI1If2w3Ntyumc-QfkvNkymPhRG9wfFtsFpOALQatW0FlQOH-pSeXwELteBRsQigzrkVplrhq3tUpAK6rjpllLI7LC0vxvf4wvByslFEIJxQYhPSNF_SkgPfrvLz1DtiStrlzlq-itqfxw7dSUDI1WOQ7aR8oxw6OEbG1U_xE5qk',
    initialSaved: false,
  },
  {
    id: 'dorian-gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    rating: '4.7',
    meta: '1890 · 248 pages · EPUB · 310 KB',
    topic: 'Gothic Fiction',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYg_CxVcloFU6wMNS-QWRRsAyH6-DLuhRB6Krz5yE_SyyhnAT060lDSvC3nEMsMWA4iiiuyVtwTBCjz4JymUwrWk4SPNLeBbn61LjBUp2-FbTEaDWsfmx6JJBIy9QP2Emj7-GwvzyNNFly3v0rrkzq_BNccU29iNYdeBZaZk0TVEux2EFVqZM-p2dqbBxPwZvNrzUOWzCx_QrFRBy5MbcIKRrMAz9PZOPdwGxm0FJcyVnYFeRh9QgV',
    initialSaved: false,
  },
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    rating: '4.9',
    meta: '1818 · 280 pages · EPUB · 380 KB',
    topic: 'Gothic Fiction',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4nGhbUOmTVk70lnz7gGwEaXKEwmzoL1qx_Z8adzDe_JdsE6Pbo20KLCyfOHlEpAY0kd4kUyiTAoz4hjbQCGytFaHYyeSbT6PrjeOUFm6j36HOPuLJcqP7GPEK-M3xsT8Wh6W2uzDFSfNJw-VglMg8whbqtaEV_IhAGafnVXE_MK6IeaBSWJ6Wx2Y3IrGsaVYi46xHzDUpqL0mx51UQTfRzZ07kUZ_FnGqUXkNVSCegZC4RWQEDUyh',
    initialSaved: true,
  },
  {
    id: 'metamorphosis',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    rating: '4.6',
    meta: '1915 · 96 pages · EPUB · 185 KB',
    topic: 'Philosophy',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdgPnoRxpgsaGzblwytZKK1_p6To8xDDG4Rlxs2xosRM4hSIx-uBL6NhZtjR_fIQ41bEyUKTbeaZ5Pv5W0DKWZzEuvB365Aus8GBtE5WJIgMbnH_Dquc2fFHaC7yK7BAsVXsWWx1g07kzlgUgyAAZXBx5LZR2_BiIAXlsvYC4aAO8iKJ-r89X0KeAXW-acmVNJqT8HZwOyBKhXgAMGFJvTFStdIIgop6f2AzJbsyTMjypdJyLYSEx2',
    initialSaved: false,
  },
  {
    id: 'alice-in-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    rating: '4.7',
    meta: '1865 · 192 pages · EPUB · 520 KB',
    topic: 'Sci-Fi & Fantasy',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDtmlDXOB9CPHilQs0e_xWY1BkWyQCULI2MFJ6Qg86hRhQX3twKmegXdUqzGzSYu57J1eMX76yJ1w11aB0W14k5WZY8Kj3BHJrBtOad29JVki4GOk7AI5e00gVHduQ9-iWm9zTp1mg-WxUul-myLkh7fYCl-_s8rfYIaGVbWkQOi0DPnMQv0c0DwRplyG9jV3NM0Lta-5oxfgAGxFNzqjUKSQZ7U-i2jFxUMAHHNcXY6skAzewrsCpH',
    initialSaved: false,
  },
  {
    id: 'crime-and-punishment',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    rating: '4.8',
    meta: '1866 · 480 pages · EPUB · 542 KB',
    topic: 'Russian Lit',
    coverUrl:
      'https://lh3.googleusercontent.com/aida/AEtjO1Wz7sS5dCSWvn2mC45wMjUDYGmEHtOuW4TJ6PsIGjCoM5_lpwcpBznBlYar-HXn5_g5fBOdK6TKLt5U--LFvfYCF-oDyeMYBY6PipbRQfTCKq_eT5XBIFQBwzIVHIhVG-HN8i3aU8Zux5flpAXV-EKBVjBBR8a6Y5HDeGaEh648iIVVk2AOatX6aVDW8pfaJ6HUMhfmI4cVtV1re0ZQ6goOzZLWdF2ePiA7O1F4TIzeXrHX-3W33MhTww',
    initialSaved: false,
  },
  {
    id: 'odyssey',
    title: 'The Odyssey',
    author: 'Homer',
    rating: '4.9',
    meta: '700 BC · 412 pages · EPUB · 490 KB',
    topic: 'Poetry',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAeACwBV0M2iT0v1zMj6buRFY5ZzSPUL-cfzJLJgK_Uta9spP87zbWIpy4uMhPqUcMFPn3ASsRwGI1If2w3Ntyumc-QfkvNkymPhRG9wfFtsFpOALQatW0FlQOH-pSeXwELteBRsQigzrkVplrhq3tUpAK6rjpllLI7LC0vxvf4wvByslFEIJxQYhPSNF_SkgPfrvLz1DtiStrlzlq-itqfxw7dSUDI1WOQ7aR8oxw6OEbG1U_xE5qk',
    initialSaved: false,
  },
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    rating: '4.9',
    meta: '180 AD · 210 pages · EPUB · 260 KB',
    topic: 'Essays',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdgPnoRxpgsaGzblwytZKK1_p6To8xDDG4Rlxs2xosRM4hSIx-uBL6NhZtjR_fIQ41bEyUKTbeaZ5Pv5W0DKWZzEuvB365Aus8GBtE5WJIgMbnH_Dquc2fFHaC7yK7BAsVXsWWx1g07kzlgUgyAAZXBx5LZR2_BiIAXlsvYC4aAO8iKJ-r89X0KeAXW-acmVNJqT8HZwOyBKhXgAMGFJvTFStdIIgop6f2AzJbsyTMjypdJyLYSEx2',
    initialSaved: false,
  },
];

export default function Page() {
  const router = useRouter();
  const { openImportModal, showToast } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Classics');
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'grid'
  const [savedIds, setSavedIds] = useState(() =>
    new Set(CATALOG_BOOKS.filter((b) => b.initialSaved).map((b) => b.id))
  );

  const filteredCatalog = useMemo(() => {
    return CATALOG_BOOKS.filter((book) => {
      if (selectedTopic !== 'All Classics' && book.topic !== selectedTopic) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.topic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedTopic, searchQuery]);

  const handleSaveBook = (e, book) => {
    e.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.add(book.id);
      return next;
    });
    showToast(`Saved "${book.title}" to Local Vault`);
  };

  return (
    <div className="min-h-dvh min-h-full font-body-ui text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container bg-background pb-32">
      <div className="fixed top-0 left-0 md:left-20 lg:left-64 right-0 h-80 bg-gradient-to-b from-[#DCE9F5]/70 dark:from-[#1c2438] via-[#EAF2F8]/30 dark:via-[#161c2d]/70 to-transparent pointer-events-none z-0 pb-28 md:pb-10"></div>

      <header className="md:hidden bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 border-b border-outline-variant/30 dark:border-outline/20 shadow-sm flex justify-between items-center w-full px-margin h-14">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px]">
            local_library
          </span>
          <span className="font-headline-sm text-headline-sm text-primary dark:text-inverse-primary tracking-tight font-bold">
            The Commons
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest/70 backdrop-blur text-primary text-label-md font-label-md hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Import</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl md:max-w-none mx-auto px-margin md:px-8 pt-4 space-y-6 w-full pb-28 md:pb-10">
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <h1 className="font-display-lg-mobile md:font-headline-lg text-display-lg-mobile md:text-headline-lg text-primary tracking-tight font-medium">
              The Commons
            </h1>
            <p className="font-caption text-caption text-on-surface-variant mt-1 flex items-center gap-1.5">
              <span>70,000+ public domain classics</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-secondary font-medium">Project Gutenberg</span>
            </p>
          </div>
          <button
            type="button"
            onClick={openImportModal}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/90 border border-outline-variant/50 text-primary text-label-sm font-label-sm shadow-sm hover:bg-surface-container-low transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              cloud_upload
            </span>
            <span>Upload .epub</span>
          </button>
        </div>

        <section className="space-y-3">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-full pl-10 pr-10 py-2.5 text-body-ui font-body-ui text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm backdrop-blur-sm transition-all"
              placeholder="Search title, author, or subject..."
              type="text"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('All Classics');
              }}
              className="absolute right-3 p-1 rounded-full text-on-surface-variant hover:text-primary transition-colors"
              title="Filter & Clear"
            >
              <span className="material-symbols-outlined text-[18px]">
                {searchQuery ? 'close' : 'tune'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-margin px-margin">
            {TOPICS.map((topic, idx) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </section>

        <section className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-caption text-caption text-on-surface-variant font-semibold tracking-wider">
              TRENDING BY TOPIC
            </span>
            <button
              type="button"
              onClick={() => setSelectedTopic('All Classics')}
              className="font-caption text-caption text-secondary hover:underline flex items-center gap-0.5"
            >
              <span>Explore all shelves</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
          <div className="bg-surface-container-lowest/60 border border-outline-variant/30 rounded-2xl p-4 pt-5 shadow-sm backdrop-blur-md overflow-hidden relative">
            <div className="flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto no-scrollbar pt-2 px-1 pb-1">
              {TRENDING_SPINES.map((sp) => (
                <Link
                  key={sp.id}
                  href={`/book/${sp.id}`}
                  className={`shrink-0 group cursor-pointer w-10 sm:w-11 ${sp.height} rounded-t-sm rounded-b-[2px] ${sp.bg} border-l border-white/20 border-r border-black/40 shadow-md flex flex-col justify-between py-2.5 px-1 items-center transition-transform hover:-translate-y-2 hover:shadow-lg`}
                >
                  {sp.topType === 'icon' ? (
                    <span className={`material-symbols-outlined text-[12px] ${sp.topColor}`}>
                      {sp.top}
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] ${sp.topColor} ${
                        sp.topType === 'text-serif' ? 'font-serif text-[10px]' : 'font-bold tracking-widest uppercase'
                      }`}
                    >
                      {sp.top}
                    </span>
                  )}
                  <div
                    className={`spine-book text-[11px] font-headline-sm ${sp.titleColor} tracking-tight truncate ${sp.maxH} rotate-180`}
                  >
                    {sp.title}
                  </div>
                  <span
                    className={`text-[8px] ${sp.authorColor} font-caption tracking-tighter truncate`}
                  >
                    {sp.author}
                  </span>
                </Link>
              ))}
            </div>
            <div className="h-3 w-full bg-gradient-to-b from-[#b89f82] to-[#998166] rounded-sm shadow-inner mt-0.5 border-t border-[#dfcfbd]"></div>
            <div className="h-2 w-full bg-[#75614a]/30 blur-[2px] -mt-1"></div>
            <p className="text-[11px] font-caption text-on-surface-variant text-center pt-2">
              Curated from the public domain · Free &amp; local-first
            </p>
          </div>
        </section>

        <section id="shelves" className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-caption text-caption text-on-surface-variant font-semibold tracking-wider">
                MOST DOWNLOADED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-container text-[11px] font-label-sm">
                2,400+ this week
              </span>
            </div>
            <div className="flex items-center bg-surface-container-high/60 p-0.5 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`p-1 rounded transition-colors ${
                  viewLayout === 'list'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  format_list_bulleted
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1 rounded transition-colors ${
                  viewLayout === 'grid'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
              </button>
            </div>
          </div>

          {viewLayout === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCatalog.map((book) => (
                <div
                  key={book.id}
                  onClick={() => router.push(`/book/${book.id}`)}
                  className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-surface-container shadow border border-outline-variant/30">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={book.title}
                      src={book.coverUrl}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-caption text-[10px] font-semibold text-secondary uppercase tracking-wider">
                      {book.author}
                    </span>
                    <h3 className="font-headline-sm text-[15px] text-primary leading-tight font-medium truncate mt-0.5">
                      {book.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
              {filteredCatalog.map((book) => {
                const isSaved = savedIds.has(book.id);
                return (
                  <div
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-3.5 flex items-center justify-between gap-3.5 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-14 h-20 shrink-0 rounded-md overflow-hidden bg-surface-container shadow border border-outline-variant/30">
                        <img
                          className="w-full h-full object-cover"
                          alt={book.title}
                          src={book.coverUrl}
                        />
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 to-transparent"></div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-caption text-[11px] font-semibold text-secondary uppercase tracking-wider">
                            {book.author}
                          </span>
                          <span className="text-outline-variant text-[10px]">·</span>
                          <span className="flex items-center text-[11px] text-[#b87d4b] font-medium">
                            ★ {book.rating}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-[17px] text-primary leading-tight font-medium truncate mt-0.5">
                          {book.title}
                        </h3>
                        <p className="font-caption text-[12px] text-on-surface-variant truncate mt-1">
                          {book.meta}
                        </p>
                      </div>
                    </div>

                    {isSaved ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reader/${book.id}`);
                        }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-label-sm border border-secondary-container hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          check_circle
                        </span>
                        <span className="hidden sm:inline">Saved to Vault</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSaveBook(e, book)}
                        className="shrink-0 w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary-container hover:text-on-primary text-primary border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 group"
                        title="Download EPUB"
                      >
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">
                          arrow_downward
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <div className="h-6"></div>
      </main>

      <button
        type="button"
        onClick={openImportModal}
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-50 w-12 h-12 rounded-full bg-primary text-on-primary shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary-container active:scale-95 transition-all duration-150"
        title="Quick Add EPUB"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>
    </div>
  );
}
