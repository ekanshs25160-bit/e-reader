'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import AiDrawer from '@/components/AiDrawer';

const INITIAL_WORDS = [
  {
    id: 'alacrity',
    word: 'alacrity',
    phonetic: '/əˈlakrɪti/',
    partOfSpeech: 'noun',
    badgeClass: 'bg-secondary-container/50 text-on-secondary-container',
    definition: 'Brisk and cheerful readiness; prompt and lively eagerness in action.',
    quoteBefore: '“She rose with great ',
    quoteHighlight: 'alacrity',
    quoteAfter: ' to assist her mother, eager to demonstrate her dutiful compliance...”',
    bookTitle: 'Pride and Prejudice',
    bookId: 'pride-and-prejudice',
    location: 'Pride and Prejudice · Ch. 8 · p. 42',
  },
  {
    id: 'acknowledged',
    word: 'acknowledged',
    phonetic: '/əkˈnɒlɪdʒd/',
    partOfSpeech: 'adjective',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200/50',
    definition:
      'Recognized or made known or admitted; generally accepted as valid, authoritatively established.',
    quoteBefore: '“It is a truth universally ',
    quoteHighlight: 'acknowledged',
    quoteAfter: ', that a single man in possession of a good fortune, must be in want of a wife.”',
    bookTitle: 'Pride and Prejudice',
    bookId: 'pride-and-prejudice',
    location: 'Pride and Prejudice · Ch. 1 · p. 3',
  },
  {
    id: 'labyrinthine',
    word: 'labyrinthine',
    phonetic: '/ˌlæb.əˈrɪn.θiːn/',
    partOfSpeech: 'adjective',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200/50',
    definition: 'Irregular and twisting; intricately and confusingly arranged like a maze.',
    quoteBefore: '“The beauty of the House is immeasurable; its ',
    quoteHighlight: 'labyrinthine',
    quoteAfter: ' Halls hold the Tides and the Statues in endless harmony.”',
    bookTitle: 'Piranesi',
    bookId: 'piranesi',
    location: 'Piranesi · Entry Dec 14 · p. 18',
  },
  {
    id: 'hypochondria',
    word: 'hypochondria',
    phonetic: '/ˌhaɪ.pəˈkɒn.dri.ə/',
    partOfSpeech: 'noun',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/50',
    definition:
      'Abnormal state characterized by anxious fixation with nonexistent or minor bodily illnesses.',
    quoteBefore:
      '“He had become so completely absorbed in himself, and isolated from his fellows, that he dreaded meeting anyone... falling into a state of nervous ',
    quoteHighlight: 'hypochondria',
    quoteAfter: '.”',
    bookTitle: 'Crime and Punishment',
    bookId: 'crime-and-punishment',
    location: 'Crime and Punishment · Part I, Ch. 1',
  },
];

export default function Page() {
  const router = useRouter();
  const { showToast } = useTheme();
  const [words, setWords] = useState(INITIAL_WORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('All Books');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [aiWord, setAiWord] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newWordForm, setNewWordForm] = useState({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    definition: '',
    quote: '',
    bookTitle: 'Piranesi',
  });

  const activeFlashcard = words[flashcardIndex % words.length] || words[0];

  const lexiconList = useMemo(() => {
    return words.slice(1).filter((w) => {
      if (selectedBook !== 'All Books' && w.bookTitle !== selectedBook) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [words, selectedBook, searchQuery]);

  const nextFlashcard = (statusMsg) => {
    showToast(statusMsg);
    setFlashcardIndex((i) => (i + 1) % words.length);
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!newWordForm.word.trim() || !newWordForm.definition.trim()) return;
    const bookId =
      newWordForm.bookTitle === 'Pride and Prejudice'
        ? 'pride-and-prejudice'
        : newWordForm.bookTitle === 'Crime and Punishment'
        ? 'crime-and-punishment'
        : 'piranesi';
    const created = {
      id: newWordForm.word.toLowerCase().replace(/\s+/g, '-'),
      word: newWordForm.word.trim(),
      phonetic: newWordForm.phonetic.trim() || '/—/',
      partOfSpeech: newWordForm.partOfSpeech,
      badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200/50',
      definition: newWordForm.definition.trim(),
      quoteBefore: '“',
      quoteHighlight: newWordForm.word.trim(),
      quoteAfter: newWordForm.quote ? ` — ${newWordForm.quote.trim()}”` : '”',
      bookTitle: newWordForm.bookTitle,
      bookId,
      location: `${newWordForm.bookTitle} · Saved Note`,
    };
    setWords((prev) => [prev[0], created, ...prev.slice(1)]);
    setAddModalOpen(false);
    setNewWordForm({
      word: '',
      phonetic: '',
      partOfSpeech: 'noun',
      definition: '',
      quote: '',
      bookTitle: 'Piranesi',
    });
    showToast(`Added "${created.word}" to your Saved Lexicon`);
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased font-body-ui selection:bg-secondary-container/60">
      <div className="relative w-full bg-background flex-col overflow-x-hidden pb-28 md:pb-10">
        <div className="absolute top-0 inset-x-0 h-72 morning-mist-gradient dark:opacity-10 pointer-events-none -z-10"></div>

        <section className="px-5 md:px-8 mt-2 pt-2 flex flex-col gap-3">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 text-on-surface text-[14px] font-body-ui placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-[0_1px_4px_rgba(44,64,88,0.03)]"
              placeholder="Search saved words or sentences..."
              type="search"
            />
            <button
              type="button"
              onClick={() => showToast('Voice search ready')}
              className="absolute right-3 text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 -mx-5 px-5">
            {[
              { id: 'All Books', label: 'All Books (34)' },
              { id: 'Pride and Prejudice', label: 'Pride and Prejudice (14)' },
              { id: 'Piranesi', label: 'Piranesi (9)' },
              { id: 'Crime and Punishment', label: 'Crime and Punishment (11)' },
            ].map((pill) => {
              const active = selectedBook === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedBook(pill.id)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-label-sm text-[12px] transition-colors ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm tracking-wide'
                      : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant hover:border-outline'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-5 md:px-8 mt-5">
          <div className="relative bg-[#F4F3EE] dark:bg-surface-container rounded-2xl p-4 pt-5 border border-[#E4E1D8] dark:border-outline-variant/40 shadow-[0_3px_12px_rgba(44,64,88,0.06)] overflow-hidden">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-5 washi-tape rotate-[-0.8deg] z-10 flex items-center justify-center opacity-90">
              <span className="text-[9px] uppercase tracking-widest text-[#6B6357] font-semibold">
                SCRAPBOOK NOTE
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  auto_awesome
                </span>
                <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  0{(flashcardIndex % words.length) + 1} · Memory Recall
                </span>
              </div>
              <span className="font-caption text-caption text-outline">from local queue</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="flex items-baseline gap-2">
                <h2 className="font-headline-md text-headline-sm font-semibold text-primary">
                  {activeFlashcard.word}
                </h2>
                <span className="font-body-ui text-[13px] text-outline font-normal">
                  {activeFlashcard.phonetic}
                </span>
                <button
                  type="button"
                  onClick={() => showToast(`Pronouncing "${activeFlashcard.word}"`)}
                  className="w-6 h-6 rounded-full bg-white/70 dark:bg-surface-container-high hover:bg-white flex items-center justify-center text-primary transition-colors border border-outline-variant/30 ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">volume_up</span>
                </button>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-secondary-container/50 text-on-secondary-container font-label-sm text-[11px] font-medium">
                {activeFlashcard.partOfSpeech}
              </span>
            </div>
            <p className="font-body-ui text-[13.5px] text-on-surface mt-1.5 leading-relaxed">
              {activeFlashcard.definition}
            </p>
            <div
              onClick={() => router.push(`/reader/${activeFlashcard.bookId}`)}
              className="mt-3 p-3 rounded-xl bg-white/75 dark:bg-surface-container-lowest/80 border border-black/[0.04] backdrop-blur-sm cursor-pointer hover:border-secondary/40 transition-colors"
            >
              <p className="font-body-reading text-[14.5px] italic text-[#262422] dark:text-on-surface leading-snug">
                {activeFlashcard.quoteBefore}
                <mark className="text-highlight not-italic font-medium">
                  {activeFlashcard.quoteHighlight}
                </mark>
                {activeFlashcard.quoteAfter}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.05]">
                <span className="font-caption text-[11px] text-outline font-medium">
                  {activeFlashcard.location}
                </span>
                <span className="material-symbols-outlined text-outline text-[14px]">
                  bookmark
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button
                type="button"
                onClick={() =>
                  nextFlashcard(`Scheduled "${activeFlashcard.word}" for review soon`)
                }
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-surface-container-low border border-outline-variant/50 text-on-surface font-label-md text-[12px] font-medium hover:bg-surface-container active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-outline text-[16px]">update</span>
                <span>Review Soon</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  nextFlashcard(`Marked "${activeFlashcard.word}" as remembered!`)
                }
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-on-primary font-label-md text-[12px] font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-emerald-300 text-[16px]">
                  check_circle
                </span>
                <span>Remembered</span>
              </button>
            </div>
          </div>
        </section>

        <section className="px-5 md:px-8 mt-6 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:items-start">
          <div className="md:col-span-2 flex items-center justify-between">
            <h3 className="font-headline-sm text-[17px] font-medium text-primary">
              Saved Lexicon
            </h3>
            <span className="text-caption font-caption text-outline">Sorted by newest</span>
          </div>

          {lexiconList.map((entry) => (
            <article
              key={entry.id}
              className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-[0_2px_8px_rgba(44,64,88,0.04)] relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-headline-md text-[20px] font-semibold text-primary">
                      {entry.word}
                    </h4>
                    <span className="font-body-ui text-[12px] text-outline">{entry.phonetic}</span>
                  </div>
                  <p className="font-body-ui text-[13px] text-on-surface-variant mt-1">
                    {entry.definition}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-label-sm text-[10px] tracking-wide ${entry.badgeClass}`}
                >
                  {entry.partOfSpeech}
                </span>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-surface-container-low/70 border border-black/[0.03]">
                <p className="font-body-reading text-[14.5px] text-on-surface leading-snug">
                  {entry.quoteBefore}
                  <mark className="text-highlight">{entry.quoteHighlight}</mark>
                  {entry.quoteAfter}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => router.push(`/reader/${entry.bookId}`)}
                  className="flex items-center gap-1.5 text-outline hover:text-primary text-[12px] font-caption transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">menu_book</span>
                  <span>{entry.location}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => showToast(`Pronouncing "${entry.word}"`)}
                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                    title="Pronounce"
                  >
                    <span className="material-symbols-outlined text-[15px]">volume_up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiWord(entry)}
                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                    title="Nuance & Context"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      temp_preferences_custom
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/reader/${entry.bookId}`)}
                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                    title="Jump to book location"
                  >
                    <span className="material-symbols-outlined text-[15px]">north_east</span>
                  </button>
                </div>
              </div>
            </article>
          ))}

          <div className="md:col-span-2 text-center py-4">
            <span className="material-symbols-outlined text-outline/50 text-[18px]">
              history_edu
            </span>
            <p className="font-caption text-caption text-outline mt-1">
              End of current vault sync · 31 more archived words
            </p>
          </div>
        </section>

        <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_16px_rgba(21,42,65,0.28)] hover:bg-primary-container active:scale-95 transition-all"
            title="Add Word Manually"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </div>

      {/* Add Word Modal */}
      {addModalOpen && (
        <div
          onClick={() => setAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddWord}
            className="w-full max-w-md bg-surface text-on-surface rounded-t-3xl md:rounded-3xl border border-outline-variant/40 shadow-2xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Add Word to Lexicon
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                required
                placeholder="Word (e.g. ineffable)"
                value={newWordForm.word}
                onChange={(e) => setNewWordForm((f) => ({ ...f, word: e.target.value }))}
                className="col-span-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              />
              <input
                placeholder="Phonetic (optional)"
                value={newWordForm.phonetic}
                onChange={(e) => setNewWordForm((f) => ({ ...f, phonetic: e.target.value }))}
                className="col-span-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              />
            </div>
            <textarea
              required
              rows={2}
              placeholder="Definition..."
              value={newWordForm.definition}
              onChange={(e) => setNewWordForm((f) => ({ ...f, definition: e.target.value }))}
              className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
            />
            <input
              placeholder="Context sentence from book (optional)"
              value={newWordForm.quote}
              onChange={(e) => setNewWordForm((f) => ({ ...f, quote: e.target.value }))}
              className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-body-ui-bold text-body-ui-bold shadow-sm hover:opacity-95"
            >
              Save to Local Lexicon
            </button>
          </form>
        </div>
      )}

      <AiDrawer
        open={Boolean(aiWord)}
        onClose={() => setAiWord(null)}
        quote={
          aiWord
            ? `${aiWord.quoteBefore}${aiWord.quoteHighlight}${aiWord.quoteAfter}`
            : undefined
        }
        onShowToast={showToast}
      />
    </div>
  );
}
