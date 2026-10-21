'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import AiDrawer from '@/components/AiDrawer';
import {
  getAllVocabularyWords,
  saveVocabularyWord,
  updateVocabularyCardReview,
} from '@/utils/db';

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
    quoteBefore: '“He was in the grip of a nervous fever, suspecting every symptom to be fatal ',
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

  // Flashcard Quiz Mode State
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFlipped, setQuizFlipped] = useState(false);
  const [quizStats, setQuizStats] = useState({ remembered: 0, reviewSoon: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  const [newWordForm, setNewWordForm] = useState({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    definition: '',
    quote: '',
    bookTitle: 'Piranesi',
  });

  useEffect(() => {
    let active = true;
    async function loadVaultVocab() {
      try {
        const saved = await getAllVocabularyWords();
        if (saved && saved.length > 0 && active) {
          const formatted = saved.map((item) => ({
            id: item.id || (item.word ? item.word.toLowerCase().replace(/\s+/g, '-') : `w-${Date.now()}`),
            word: item.word || 'Excerpt',
            phonetic: item.phonetic || '/—/',
            partOfSpeech: item.partOfSpeech || 'noun',
            badgeClass: item.badgeClass || 'bg-secondary-container/50 text-on-secondary-container',
            definition: Array.isArray(item.definitions) ? item.definitions[0] : item.definition || 'Saved excerpt',
            quoteBefore: item.quoteBefore || '“',
            quoteHighlight: item.word || '',
            quoteAfter: item.quoteAfter || (item.quote ? ` — ${item.quote}”` : '”'),
            bookTitle: item.bookTitle || 'Reader Note',
            bookId: item.bookId || 'custom',
            location: item.location || 'Reader Highlight',
            reviewCount: item.reviewCount || 0,
            rememberedCount: item.rememberedCount || 0,
          }));

          const existingWords = new Set(formatted.map((w) => w.word.toLowerCase()));
          const combined = [...formatted, ...INITIAL_WORDS.filter((w) => !existingWords.has(w.word.toLowerCase()))];
          setWords(combined);
        }
      } catch (err) {
        console.warn('Error fetching vocabulary from vault:', err);
      }
    }
    loadVaultVocab();
    return () => {
      active = false;
    };
  }, []);

  const activeFlashcard = words[flashcardIndex % words.length] || words[0];
  const activeQuizCard = words[quizIndex % words.length] || words[0];

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

  const nextFlashcard = async (wasRemembered, statusMsg) => {
    if (activeFlashcard?.id) {
      await updateVocabularyCardReview(activeFlashcard.id, wasRemembered);
    }
    showToast(statusMsg);
    setFlashcardIndex((i) => (i + 1) % words.length);
  };

  const handleStartQuiz = () => {
    setQuizIndex(0);
    setQuizFlipped(false);
    setQuizStats({ remembered: 0, reviewSoon: 0 });
    setQuizFinished(false);
    setQuizModeOpen(true);
  };

  const handleQuizAnswer = async (wasRemembered) => {
    if (activeQuizCard?.id) {
      await updateVocabularyCardReview(activeQuizCard.id, wasRemembered);
    }

    setQuizStats((prev) => ({
      remembered: prev.remembered + (wasRemembered ? 1 : 0),
      reviewSoon: prev.reviewSoon + (!wasRemembered ? 1 : 0),
    }));

    if (quizIndex + 1 >= Math.min(words.length, 10)) {
      setQuizFinished(true);
    } else {
      setQuizIndex((idx) => idx + 1);
      setQuizFlipped(false);
    }
  };

  const handleAddWord = async (e) => {
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
    await saveVocabularyWord(created);
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
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 flex items-center">
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
            </div>
            <button
              type="button"
              onClick={handleStartQuiz}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span className="hidden sm:inline">Start</span> Quiz Mode
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="shrink-0 w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all"
              title="Add word manually"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 -mx-5 px-5">
            {[
              { id: 'All Books', label: `All Books (${words.length})` },
              { id: 'Pride and Prejudice', label: 'Pride and Prejudice' },
              { id: 'Piranesi', label: 'Piranesi' },
              { id: 'Crime and Punishment', label: 'Crime and Punishment' },
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

        {/* Quick Recall Card */}
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
              <span className="font-caption text-caption text-outline">from local vault</span>
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
                  nextFlashcard(false, `Scheduled "${activeFlashcard.word}" for review soon`)
                }
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-surface-container-low border border-outline-variant/50 text-on-surface font-label-md text-[12px] font-medium hover:bg-surface-container active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-outline text-[16px]">update</span>
                <span>Review Soon</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  nextFlashcard(true, `Marked "${activeFlashcard.word}" as remembered!`)
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

        {/* Saved Lexicon List */}
        <section className="px-5 md:px-8 mt-6 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:items-start">
          <div className="md:col-span-2 flex items-center justify-between">
            <h3 className="font-headline-sm text-[17px] font-medium text-primary">
              Saved Lexicon ({lexiconList.length} words)
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
              <div className="mt-3 flex items-center justify-between text-on-surface-variant text-caption">
                <span className="text-[11px] text-outline font-medium">{entry.location}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiWord(entry)}
                    className="p-1 rounded-full text-secondary hover:bg-secondary-container/20 transition-colors"
                    title="Explain in AI Margin"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/reader/${entry.bookId}`)}
                    className="p-1 rounded-full text-on-surface-variant hover:text-primary transition-colors"
                    title="Read in Book"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Flashcard Quiz Mode Modal */}
      {quizModeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface text-on-surface rounded-3xl border border-outline-variant/40 shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {!quizFinished ? (
              <>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">psychology</span>
                    <span className="font-headline-sm text-headline-sm text-primary">
                      Flashcard Quiz
                    </span>
                    <span className="text-caption font-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs">
                      {quizIndex + 1} / {Math.min(words.length, 10)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuizModeOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* The Flashcard itself */}
                <div
                  onClick={() => setQuizFlipped((f) => !f)}
                  className="cursor-pointer min-h-[260px] rounded-2xl bg-surface-container-low border border-outline-variant/40 p-6 flex flex-col justify-between shadow-md hover:border-secondary/50 transition-all select-none"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-caption font-label-sm text-secondary uppercase tracking-wider">
                      {activeQuizCard.bookTitle}
                    </span>
                    <span className="font-caption text-xs text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">touch_app</span>
                      <span>Tap to flip</span>
                    </span>
                  </div>

                  {!quizFlipped ? (
                    // Front of card
                    <div className="my-auto text-center space-y-3 py-4">
                      <h2 className="font-headline-lg text-display-lg-mobile text-primary tracking-tight font-bold">
                        {activeQuizCard.word}
                      </h2>
                      <span className="font-body-ui text-sm text-outline font-mono block">
                        {activeQuizCard.phonetic}
                      </span>
                      <p className="font-body-reading text-[15px] italic text-on-surface-variant max-w-sm mx-auto leading-relaxed mt-2">
                        {activeQuizCard.quoteBefore}
                        <span className="border-b-2 border-secondary font-bold text-secondary px-2">
                          [ ? ]
                        </span>
                        {activeQuizCard.quoteAfter}
                      </p>
                    </div>
                  ) : (
                    // Back of card
                    <div className="my-auto text-center space-y-3 py-4 animate-in fade-in zoom-in-95 duration-200">
                      <span className="px-2.5 py-0.5 rounded-full text-xs uppercase font-label-sm bg-secondary-container/50 text-on-secondary-container">
                        {activeQuizCard.partOfSpeech}
                      </span>
                      <h3 className="font-headline-md text-headline-sm text-primary font-semibold">
                        {activeQuizCard.definition}
                      </h3>
                      <p className="font-body-reading text-sm italic text-on-surface-variant max-w-sm mx-auto leading-relaxed border-t border-outline-variant/20 pt-2">
                        {activeQuizCard.quoteBefore}
                        <mark className="text-highlight not-italic font-semibold">
                          {activeQuizCard.quoteHighlight}
                        </mark>
                        {activeQuizCard.quoteAfter}
                      </p>
                    </div>
                  )}

                  <div className="text-center text-caption text-outline text-[11px]">
                    {!quizFlipped ? 'Click card to see definition' : 'Did you remember the meaning?'}
                  </div>
                </div>

                {/* Rating Answer Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuizAnswer(false)}
                    className="py-3 px-4 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface font-label-md text-sm font-medium hover:bg-surface-container-high active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-outline">update</span>
                    <span>Review Soon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuizAnswer(true)}
                    className="py-3 px-4 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-emerald-300">check_circle</span>
                    <span>Remembered</span>
                  </button>
                </div>
              </>
            ) : (
              // Quiz Finished Screen
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-secondary-container/60 text-secondary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">emoji_events</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold">
                    Round Complete!
                  </h3>
                  <p className="font-body-ui text-sm text-on-surface-variant mt-1">
                    You reviewed {quizStats.remembered + quizStats.reviewSoon} words from your vault.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low flex justify-around border border-outline-variant/30">
                  <div>
                    <span className="font-display-lg-mobile text-2xl font-bold text-emerald-600 block">
                      {quizStats.remembered}
                    </span>
                    <span className="font-label-sm text-xs text-outline">Remembered</span>
                  </div>
                  <div className="w-px bg-outline-variant/40"></div>
                  <div>
                    <span className="font-display-lg-mobile text-2xl font-bold text-secondary block">
                      {quizStats.reviewSoon}
                    </span>
                    <span className="font-label-sm text-xs text-outline">Review Soon</span>
                  </div>
                  <div className="w-px bg-outline-variant/40"></div>
                  <div>
                    <span className="font-display-lg-mobile text-2xl font-bold text-primary block">
                      {Math.round(
                        (quizStats.remembered /
                          Math.max(1, quizStats.remembered + quizStats.reviewSoon)) *
                          100
                      )}
                      %
                    </span>
                    <span className="font-label-sm text-xs text-outline">Accuracy</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="flex-1 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-primary font-label-md text-sm hover:bg-surface-container-high transition-colors"
                  >
                    Restart Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizModeOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold shadow-sm hover:bg-primary-container transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add Word Modal */}
      {addModalOpen && (
        <div
          onClick={() => setAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleAddWord}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-on-surface rounded-2xl p-5 border border-outline-variant/40 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Add Word to Lexicon
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
        bookTitle={aiWord?.bookTitle || 'Custom Reading'}
        bookId={aiWord?.bookId || 'custom'}
        onShowToast={showToast}
      />
    </div>
  );
}
