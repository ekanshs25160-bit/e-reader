'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import AiDrawer from '@/components/AiDrawer';
import {
  getAllVocabularyWords,
  saveVocabularyWord,
  deleteVocabularyWord,
  updateVocabularyCardReview,
  getAllBooks,
} from '@/utils/db';
import { lookupWord } from '@/lib/api';
import { pluralize } from '@/lib/format';

/**
 * Highlight occurrences of the word inside the context sentence
 */
function HighlightedSentence({ sentence, word }) {
  if (!sentence) return null;
  if (!word) {
    return (
      <p className="font-body-reading text-[14.5px] italic text-[#262422] dark:text-on-surface leading-snug">
        “{sentence}”
      </p>
    );
  }

  try {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = sentence.split(regex);

    return (
      <p className="font-body-reading text-[14.5px] italic text-[#262422] dark:text-on-surface leading-snug">
        “
        {parts.map((part, idx) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <mark
              key={idx}
              className="bg-secondary-container/70 text-on-secondary-container px-1 py-0.5 rounded not-italic font-semibold"
            >
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
        ”
      </p>
    );
  } catch {
    return (
      <p className="font-body-reading text-[14.5px] italic text-[#262422] dark:text-on-surface leading-snug">
        “{sentence}”
      </p>
    );
  }
}

export default function VocabularyPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { showToast } = useTheme();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedBooks, setStoredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('All Books');
  const [aiWord, setAiWord] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Manual Add Form State
  const [addWord, setAddWord] = useState('');
  const [addPhonetic, setAddPhonetic] = useState('');
  const [addPartOfSpeech, setAddPartOfSpeech] = useState('noun');
  const [addDefinition, setAddDefinition] = useState('');
  const [addSentence, setAddSentence] = useState('');
  const [addBookId, setAddBookId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  // Flashcard Quiz Mode State
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFlipped, setQuizFlipped] = useState(false);
  const [quizStats, setQuizStats] = useState({ remembered: 0, reviewSoon: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  const loadVaultVocab = async () => {
    setLoading(true);
    try {
      const [saved, books] = await Promise.all([
        getAllVocabularyWords(),
        getAllBooks(),
      ]);

      if (Array.isArray(books)) {
        setStoredBooks(books);
      }

      if (Array.isArray(saved) && saved.length > 0) {
        const formatted = saved.map((item) => {
          const id = item.id || (item.word ? String(item.word).toLowerCase().trim() : `w-${Date.now()}`);
          const def = item.definition || (Array.isArray(item.definitions) ? item.definitions[0] : '') || '';
          const sentence = item.contextSentence || item.quote || '';
          return {
            id,
            word: item.word || 'Word',
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'word',
            badgeClass: item.badgeClass || 'bg-secondary-container/50 text-on-secondary-container',
            definition: def,
            definitions: Array.isArray(item.definitions) ? item.definitions : [def],
            contextSentence: sentence,
            quote: sentence,
            bookId: item.bookId || null,
            bookTitle: (item.bookTitle || 'Unfiled').trim(),
            cfi: item.cfi || null,
            chapter: item.chapter || '',
            nextReviewDate: item.nextReviewDate ?? item.createdAt ?? Date.now(),
            reviewCount: item.reviewCount || 0,
            rememberedCount: item.rememberedCount || 0,
            createdAt: item.createdAt || Date.now(),
          };
        });

        formatted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setWords(formatted);
      } else {
        setWords([]);
      }
    } catch (err) {
      console.warn('Error loading vocabulary from vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultVocab();
  }, []);

  // Book filter chips grouped by bookTitle with real counts, plus "All Books (N)"
  const bookFilterChips = useMemo(() => {
    const counts = {};
    words.forEach((w) => {
      const title = (w.bookTitle || 'Unfiled').trim();
      counts[title] = (counts[title] || 0) + 1;
    });

    return [
      { id: 'All Books', label: `All Books (${words.length})` },
      ...Object.entries(counts).map(([title, count]) => ({
        id: title,
        label: `${title} (${count})`,
      })),
    ];
  }, [words]);

  // Memory recall: card with earliest nextReviewDate that is due (nextReviewDate <= Date.now())
  const dueCards = useMemo(() => {
    const now = Date.now();
    return words
      .filter((w) => {
        if (!w.nextReviewDate) return true;
        const dueTime = typeof w.nextReviewDate === 'number' ? w.nextReviewDate : new Date(w.nextReviewDate).getTime();
        return dueTime <= now;
      })
      .sort((a, b) => {
        const timeA = a.nextReviewDate ? (typeof a.nextReviewDate === 'number' ? a.nextReviewDate : new Date(a.nextReviewDate).getTime()) : 0;
        const timeB = b.nextReviewDate ? (typeof b.nextReviewDate === 'number' ? b.nextReviewDate : new Date(b.nextReviewDate).getTime()) : 0;
        return timeA - timeB;
      });
  }, [words]);

  const activeRecallCard = dueCards.length > 0 ? dueCards[0] : null;

  // Search filter across word, definition, and context sentence
  const filteredLexicon = useMemo(() => {
    return words.filter((w) => {
      if (selectedBook !== 'All Books') {
        const title = (w.bookTitle || 'Unfiled').trim();
        if (title !== selectedBook) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const wordMatch = (w.word || '').toLowerCase().includes(q);
        const defMatch = (w.definition || (Array.isArray(w.definitions) ? w.definitions.join(' ') : '')).toLowerCase().includes(q);
        const sentenceMatch = (w.contextSentence || w.quote || '').toLowerCase().includes(q);
        return wordMatch || defMatch || sentenceMatch;
      }
      return true;
    });
  }, [words, selectedBook, searchQuery]);

  // Speech pronunciation via Web Speech API
  const speakWord = (word) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis gracefully handled
      }
    }
    showToast(`Pronouncing "${word}"`);
  };

  // Memory recall actions
  const handleRecallAction = async (wasRemembered) => {
    if (!activeRecallCard) return;
    try {
      const updated = await updateVocabularyCardReview(activeRecallCard.id, wasRemembered);
      const nextDue = updated?.nextReviewDate || (Date.now() + (wasRemembered ? 86400000 * 2 : 86400000));
      setWords((prev) =>
        prev.map((w) =>
          w.id === activeRecallCard.id
            ? { ...w, ...(updated || {}), nextReviewDate: nextDue }
            : w
        )
      );
      showToast(
        wasRemembered
          ? `Marked "${activeRecallCard.word}" as remembered!`
          : `Scheduled "${activeRecallCard.word}" for review soon.`
      );
    } catch (err) {
      showToast('Error updating review: ' + err.message);
    }
  };

  // Jump to reader with CFI
  const handleOpenInReader = (bookId, cfi) => {
    if (!bookId || bookId === 'custom') {
      showToast('No book attached to this word');
      return;
    }
    const cfiQuery = cfi ? `?cfi=${encodeURIComponent(cfi)}` : '';
    router.push(`/reader/${encodeURIComponent(bookId)}${cfiQuery}`);
  };

  // Delete word from vault
  const handleDeleteWord = async (id, wordText) => {
    try {
      await deleteVocabularyWord(id);
      setWords((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
      showToast(`Removed "${wordText}" from lexicon`);
    } catch (err) {
      showToast('Failed to delete word: ' + err.message);
    }
  };

  // Look up word via API before saving
  const handleLookupDictionary = async () => {
    const term = addWord.trim();
    if (!term) return;
    setLookingUp(true);
    setLookupMessage('');
    try {
      const res = await lookupWord(term);
      if (res && res.definition && res.definition.length > 0) {
        if (res.phonetic) setAddPhonetic(res.phonetic);
        if (res.partsOfSpeech?.[0]) setAddPartOfSpeech(res.partsOfSpeech[0]);
        setAddDefinition(res.definition[0] || '');
        setLookupMessage('Found definition in dictionary!');
      } else {
        setLookupMessage('Not found in dictionary. You can enter your own definition below.');
      }
    } catch {
      setLookupMessage('Lookup service unavailable. Please enter your definition manually.');
    } finally {
      setLookingUp(false);
    }
  };

  // Handle manual word addition
  const handleAddWordSubmit = async (e) => {
    e.preventDefault();
    if (!addWord.trim() || !addDefinition.trim()) return;

    let targetBookTitle = 'General Notes';
    let targetBookId = addBookId || null;

    if (addBookId) {
      const matched = storedBooks.find((b) => String(b.id) === String(addBookId));
      if (matched) {
        targetBookTitle = matched.title;
      }
    } else if (storedBooks.length > 0) {
      targetBookTitle = storedBooks[0].title;
      targetBookId = storedBooks[0].id;
    }

    const newRecord = {
      word: addWord.trim(),
      phonetic: addPhonetic.trim(),
      partOfSpeech: addPartOfSpeech,
      definition: addDefinition.trim(),
      contextSentence: addSentence.trim(),
      quote: addSentence.trim(),
      bookId: targetBookId,
      bookTitle: targetBookTitle,
      location: `${targetBookTitle} · Saved Note`,
      nextReviewDate: Date.now(),
      createdAt: Date.now(),
      reviewCount: 0,
      rememberedCount: 0,
    };

    try {
      const created = await saveVocabularyWord(newRecord);
      setWords((prev) => [created || newRecord, ...prev]);
      setAddModalOpen(false);
      setAddWord('');
      setAddPhonetic('');
      setAddPartOfSpeech('noun');
      setAddDefinition('');
      setAddSentence('');
      setAddBookId('');
      setLookupMessage('');
      showToast(`Added "${newRecord.word}" to your Saved Lexicon`);
    } catch (err) {
      showToast('Error saving word: ' + err.message);
    }
  };

  // Flashcard Quiz Handlers
  const activeQuizCard = words.length > 0 ? words[quizIndex % words.length] : null;

  const handleStartQuiz = () => {
    if (words.length === 0) {
      showToast('No saved words in your vault to quiz yet.');
      return;
    }
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

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased font-body-ui selection:bg-secondary-container/60">
      <div className="relative w-full bg-background flex-col overflow-x-hidden pb-28 md:pb-10">
        <div className="absolute top-0 inset-x-0 h-72 morning-mist-gradient dark:opacity-10 pointer-events-none -z-10"></div>

        {/* Search & Actions Bar */}
        <section className="px-5 md:px-8 mt-2 pt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1 min-w-0 flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 text-on-surface text-[14px] font-body-ui placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-[0_1px_4px_rgba(44,64,88,0.03)]"
                placeholder="Search saved words, definitions, or sentences..."
                type="search"
              />
            </div>
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={words.length === 0}
              className="shrink-0 flex items-center justify-center gap-1.5 px-4 max-[480px]:px-2.5 max-[480px]:w-9 h-9 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container active:scale-95 transition-all disabled:opacity-50"
              title="Quiz Mode"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span className="hidden min-[480px]:inline">
                <span className="hidden sm:inline">Start </span>Quiz Mode
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupMessage('');
                setAddModalOpen(true);
              }}
              className="shrink-0 w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all"
              title="Add word manually"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>

          {/* Book Filter Chips */}
          {words.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 -mx-5 px-5">
              {bookFilterChips.map((chip) => {
                const active = selectedBook === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedBook(chip.id)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-label-sm text-[12px] transition-colors ${
                      active
                        ? 'bg-primary text-on-primary shadow-sm tracking-wide'
                        : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {loading ? (
          <div className="px-5 md:px-8 mt-6 space-y-4 animate-pulse">
            <div className="h-44 bg-surface-container-low rounded-2xl"></div>
            <div className="h-6 w-36 bg-surface-container-low rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-surface-container-lowest rounded-2xl"></div>
              <div className="h-32 bg-surface-container-lowest rounded-2xl"></div>
            </div>
          </div>
        ) : words.length === 0 ? (
          /* Empty State when no vocabulary is saved */
          <section className="px-5 md:px-8 mt-10">
            <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 border border-outline-variant/40 shadow-sm text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container/50 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">translate</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline-md text-headline-sm font-semibold text-primary">
                  Your Lexicon is Empty
                </h3>
                <p className="font-body-ui text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Words looked up while reading in the reader or added manually will appear here with definitions, context sentences, and spaced repetition recall cards.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-3 justify-center">
                <button
                  type="button"
                  onClick={() => router.push('/library')}
                  className="py-2.5 px-5 rounded-full bg-primary text-on-primary font-label-md text-sm font-medium hover:bg-primary-container active:scale-95 transition-all shadow-sm"
                >
                  Go to Library
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/browse')}
                  className="py-2.5 px-5 rounded-full border border-outline-variant/60 hover:bg-surface-container text-on-surface font-label-md text-sm font-medium active:scale-95 transition-all"
                >
                  Browse Books
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLookupMessage('');
                    setAddModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-full bg-surface-container-high hover:bg-surface-container text-primary font-label-md text-sm font-medium active:scale-95 transition-all"
                >
                  Add Word
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Memory Recall Section */}
            <section className="px-5 md:px-8 mt-5">
              {activeRecallCard ? (
                <div className="relative bg-[#F4F3EE] dark:bg-surface-container rounded-2xl p-4 pt-5 border border-[#E4E1D8] dark:border-outline-variant/40 shadow-[0_3px_12px_rgba(44,64,88,0.06)] overflow-hidden">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-5 washi-tape rotate-[-0.8deg] z-10 flex items-center justify-center opacity-90">
                    <span className="text-[9px] uppercase tracking-widest text-[#6B6357] font-semibold">
                      MEMORY RECALL
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        auto_awesome
                      </span>
                      <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wider text-secondary">
                        Due for Review
                      </span>
                    </div>
                    <span className="font-caption text-caption text-outline">
                      {activeRecallCard.bookTitle || 'local vault'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-2">
                      <h2 className="font-headline-md text-headline-sm font-semibold text-primary">
                        {activeRecallCard.word}
                      </h2>
                      {activeRecallCard.phonetic && (
                        <span className="font-body-ui text-[13px] text-outline font-normal">
                          {activeRecallCard.phonetic}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => speakWord(activeRecallCard.word)}
                        className="w-6 h-6 rounded-full bg-white/70 dark:bg-surface-container-high hover:bg-white flex items-center justify-center text-primary transition-colors border border-outline-variant/30 ml-1"
                        title="Pronounce word"
                      >
                        <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      </button>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-secondary-container/50 text-on-secondary-container font-label-sm text-[11px] font-medium">
                      {activeRecallCard.partOfSpeech}
                    </span>
                  </div>
                  <p className="font-body-ui text-[13.5px] text-on-surface mt-1.5 leading-relaxed">
                    {activeRecallCard.definition}
                  </p>

                  {/* Context sentence with word highlighted */}
                  {activeRecallCard.contextSentence && (
                    <div
                      onClick={() => handleOpenInReader(activeRecallCard.bookId, activeRecallCard.cfi)}
                      className={`mt-3 p-3 rounded-xl bg-white/75 dark:bg-surface-container-lowest/80 border border-black/[0.04] backdrop-blur-sm ${
                        activeRecallCard.bookId ? 'cursor-pointer hover:border-secondary/40' : ''
                      } transition-colors`}
                    >
                      <HighlightedSentence
                        sentence={activeRecallCard.contextSentence}
                        word={activeRecallCard.word}
                      />
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.05]">
                        <span className="font-caption text-[11px] text-outline font-medium">
                          {activeRecallCard.bookTitle} {activeRecallCard.chapter ? `· ${activeRecallCard.chapter}` : ''}
                        </span>
                        {activeRecallCard.bookId && (
                          <span
                            className="material-symbols-outlined text-outline text-[14px]"
                            title={activeRecallCard.cfi ? 'Jump to passage' : 'Open book'}
                          >
                            open_in_new
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <button
                      type="button"
                      onClick={() => handleRecallAction(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-surface-container-low border border-outline-variant/50 text-on-surface font-label-md text-[12px] font-medium hover:bg-surface-container active:scale-[0.98] transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-outline text-[16px]">update</span>
                      <span>Review Soon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecallAction(true)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-on-primary font-label-md text-[12px] font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-emerald-300 text-[16px]">
                        check_circle
                      </span>
                      <span>Remembered</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* "All caught up" state when nothing is due */
                <div className="relative bg-surface-container-lowest/90 dark:bg-surface-container rounded-2xl p-6 border border-outline-variant/40 shadow-sm flex flex-col items-center justify-center text-center py-7 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">task_alt</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                    All caught up
                  </h3>
                  <p className="font-body-ui text-sm text-on-surface-variant max-w-sm">
                    No vocabulary cards are currently due for recall. Keep reading to discover and save new words!
                  </p>
                  <div className="text-caption font-caption text-outline pt-1">
                    {pluralize(words.length, 'word')} saved in your vault
                  </div>
                </div>
              )}
            </section>

            {/* Saved Lexicon List */}
            <section className="px-5 md:px-8 mt-6 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 md:items-start">
              <div className="md:col-span-2 flex items-center justify-between">
                <h3 className="font-headline-sm text-[17px] font-medium text-primary">
                  Saved Lexicon ({pluralize(filteredLexicon.length, 'word')})
                </h3>
                <span className="text-caption font-caption text-outline">Sorted by newest</span>
              </div>

              {filteredLexicon.length === 0 ? (
                <div className="md:col-span-2 py-8 text-center text-on-surface-variant font-body-ui text-sm bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                  No vocabulary words matched your filter criteria.
                </div>
              ) : (
                filteredLexicon.map((entry) => (
                  <article
                    key={entry.id}
                    className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-[0_2px_8px_rgba(44,64,88,0.04)] relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h4 className="font-headline-md text-[20px] font-semibold text-primary">
                              {entry.word}
                            </h4>
                            {entry.phonetic && (
                              <span className="font-body-ui text-[12px] text-outline">
                                {entry.phonetic}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => speakWord(entry.word)}
                              className="text-on-surface-variant hover:text-primary transition-colors"
                              title="Pronounce word"
                            >
                              <span className="material-symbols-outlined text-[15px]">volume_up</span>
                            </button>
                          </div>
                          <p className="font-body-ui text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                            {entry.definition}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md font-label-sm text-[10px] tracking-wide ${entry.badgeClass}`}
                        >
                          {entry.partOfSpeech}
                        </span>
                      </div>

                      {/* Sentence context with word highlighted */}
                      {entry.contextSentence && (
                        <div className="mt-3 p-3 rounded-xl bg-surface-container-low/70 border border-black/[0.03]">
                          <HighlightedSentence
                            sentence={entry.contextSentence}
                            word={entry.word}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between text-on-surface-variant text-caption border-t border-outline-variant/10">
                      <span className="text-[11px] text-outline font-medium truncate max-w-[180px]">
                        {entry.bookTitle} {entry.chapter ? `· ${entry.chapter}` : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAiWord(entry)}
                          className="p-1.5 rounded-full text-secondary hover:bg-secondary-container/20 transition-colors"
                          title="Explain in AI Margin"
                        >
                          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        </button>

                        {/* Open arrow going to /reader/<bookId> jumping to saved cfi */}
                        {entry.bookId && (
                          <button
                            type="button"
                            onClick={() => handleOpenInReader(entry.bookId, entry.cfi)}
                            className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            title={entry.cfi ? 'Jump to passage in reader' : 'Open book in reader'}
                          >
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(entry.id)}
                          className="p-1.5 rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                          title="Delete from Lexicon"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface rounded-2xl p-5 border border-outline-variant/40 shadow-xl space-y-3"
          >
            <h4 className="font-headline-sm text-headline-sm text-primary">Remove Word</h4>
            <p className="text-body-ui text-sm text-on-surface-variant">
              Are you sure you want to remove this word from your saved lexicon?
            </p>
            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/50 text-sm font-medium hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = words.find((w) => w.id === deleteConfirmId);
                  if (target) handleDeleteWord(target.id, target.word);
                }}
                className="px-4 py-2 rounded-xl bg-error text-on-error text-sm font-medium hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Word Modal with Dictionary Lookup */}
      {addModalOpen && (
        <div
          onClick={() => setAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleAddWordSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-on-surface rounded-2xl p-5 border border-outline-variant/40 shadow-xl space-y-3.5"
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

            {/* Word Input + Lookup Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  required
                  placeholder="Word (e.g. ineffable)"
                  value={addWord}
                  onChange={(e) => setAddWord(e.target.value)}
                  onBlur={() => {
                    if (addWord.trim() && !addDefinition.trim() && !lookingUp) {
                      handleLookupDictionary();
                    }
                  }}
                  className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleLookupDictionary}
                disabled={lookingUp || !addWord.trim()}
                className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-primary font-label-md text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
              >
                {lookingUp ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">search</span>
                )}
                <span>Look Up</span>
              </button>
            </div>

            {lookupMessage && (
              <p className="text-caption font-caption text-secondary px-1">
                {lookupMessage}
              </p>
            )}

            {/* Phonetic & Part of Speech */}
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Phonetic (optional)"
                value={addPhonetic}
                onChange={(e) => setAddPhonetic(e.target.value)}
                className="col-span-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              />
              <select
                value={addPartOfSpeech}
                onChange={(e) => setAddPartOfSpeech(e.target.value)}
                className="col-span-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              >
                <option value="noun">noun</option>
                <option value="verb">verb</option>
                <option value="adjective">adjective</option>
                <option value="adverb">adverb</option>
                <option value="phrase">phrase</option>
              </select>
            </div>

            {/* Target Book Dropdown */}
            <div>
              <label className="text-caption font-label-sm text-on-surface-variant block mb-1">
                Attach to Book / Note
              </label>
              <select
                value={addBookId}
                onChange={(e) => setAddBookId(e.target.value)}
                className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              >
                <option value="">(General / Custom Note)</option>
                {storedBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Definition */}
            <div>
              <label className="text-caption font-label-sm text-on-surface-variant block mb-1">
                Definition *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Enter or refine definition..."
                value={addDefinition}
                onChange={(e) => setAddDefinition(e.target.value)}
                className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Context Sentence */}
            <div>
              <label className="text-caption font-label-sm text-on-surface-variant block mb-1">
                Context sentence from book (optional)
              </label>
              <input
                placeholder="Sentence where this word appears..."
                value={addSentence}
                onChange={(e) => setAddSentence(e.target.value)}
                className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-body-ui-bold text-body-ui-bold shadow-sm hover:opacity-95 transition-opacity"
            >
              Save to Local Lexicon
            </button>
          </form>
        </div>
      )}

      {/* Flashcard Quiz Mode Modal */}
      {quizModeOpen && activeQuizCard && (
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

                {/* The Flashcard */}
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
                      {activeQuizCard.phonetic && (
                        <span className="font-body-ui text-sm text-outline font-mono block">
                          {activeQuizCard.phonetic}
                        </span>
                      )}
                      {activeQuizCard.contextSentence && (
                        <p className="font-body-reading text-[15px] italic text-on-surface-variant max-w-sm mx-auto leading-relaxed mt-2">
                          “
                          {activeQuizCard.contextSentence.replace(
                            new RegExp(`\\b${activeQuizCard.word}\\b`, 'gi'),
                            ' [ ? ] '
                          )}
                          ”
                        </p>
                      )}
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
                      {activeQuizCard.contextSentence && (
                        <div className="border-t border-outline-variant/20 pt-2 mt-2">
                          <HighlightedSentence
                            sentence={activeQuizCard.contextSentence}
                            word={activeQuizCard.word}
                          />
                        </div>
                      )}
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

      {/* AI Drawer */}
      <AiDrawer
        open={Boolean(aiWord)}
        onClose={() => setAiWord(null)}
        quote={aiWord?.contextSentence || aiWord?.quote}
        bookTitle={aiWord?.bookTitle || 'Custom Reading'}
        bookId={aiWord?.bookId || 'custom'}
        onShowToast={showToast}
      />
    </div>
  );
}
