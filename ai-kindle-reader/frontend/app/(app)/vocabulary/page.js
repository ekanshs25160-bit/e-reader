'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Highlight occurrences of the word inside the context sentence:
 * Editorial spec: in italic serif with the word underlined in bronze (no yellow highlight blocks).
 */
function HighlightedSentence({ sentence, word }) {
  if (!sentence) return null;
  if (!word) {
    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
        “{sentence}”
      </p>
    );
  }

  try {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = sentence.split(regex);

    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
        “
        {parts.map((part, idx) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <span
              key={idx}
              className="underline decoration-accent underline-offset-4 text-ink font-serif italic font-normal"
            >
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
        ”
      </p>
    );
  } catch {
    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
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
  const [error, setError] = useState(null);
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

  const loadVaultVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
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
          const id =
            item.id ||
            (item.word ? String(item.word).toLowerCase().trim() : `w-${Date.now()}`);
          const def =
            item.definition ||
            (Array.isArray(item.definitions) ? item.definitions[0] : '') ||
            '';
          const sentence = item.contextSentence || item.quote || '';
          return {
            id,
            word: item.word || 'Word',
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'word',
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
      setError(err?.message || 'Failed to load vocabulary words from vault');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaultVocab();
  }, [loadVaultVocab]);

  // Book filter chips grouped by bookTitle
  const bookFilterChips = useMemo(() => {
    const counts = {};
    words.forEach((w) => {
      const title = (w.bookTitle || 'Unfiled').trim();
      counts[title] = (counts[title] || 0) + 1;
    });

    return [
      { id: 'All Books', label: 'All Books', count: words.length },
      ...Object.entries(counts).map(([title, count]) => ({
        id: title,
        label: title,
        count,
      })),
    ];
  }, [words]);

  // Memory recall: card with earliest nextReviewDate that is due
  const dueCards = useMemo(() => {
    const now = Date.now();
    return words
      .filter((w) => {
        if (!w.nextReviewDate) return true;
        const dueTime =
          typeof w.nextReviewDate === 'number'
            ? w.nextReviewDate
            : new Date(w.nextReviewDate).getTime();
        return dueTime <= now;
      })
      .sort((a, b) => {
        const timeA = a.nextReviewDate
          ? typeof a.nextReviewDate === 'number'
            ? a.nextReviewDate
            : new Date(a.nextReviewDate).getTime()
          : 0;
        const timeB = b.nextReviewDate
          ? typeof b.nextReviewDate === 'number'
            ? b.nextReviewDate
            : new Date(b.nextReviewDate).getTime()
          : 0;
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
        const defMatch = (
          w.definition ||
          (Array.isArray(w.definitions) ? w.definitions.join(' ') : '')
        )
          .toLowerCase()
          .includes(q);
        const sentenceMatch = (w.contextSentence || w.quote || '')
          .toLowerCase()
          .includes(q);
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
      } catch {}
    }
    showToast(`Pronouncing “${word}”`);
  };

  // Memory recall actions
  const handleRecallAction = async (wasRemembered) => {
    if (!activeRecallCard) return;
    try {
      const updated = await updateVocabularyCardReview(activeRecallCard.id, wasRemembered);
      const nextDue =
        updated?.nextReviewDate ||
        Date.now() + (wasRemembered ? 86400000 * 2 : 86400000);
      setWords((prev) =>
        prev.map((w) =>
          w.id === activeRecallCard.id
            ? { ...w, ...(updated || {}), nextReviewDate: nextDue }
            : w
        )
      );
      showToast(
        wasRemembered
          ? `Marked “${activeRecallCard.word}” as remembered`
          : `Scheduled “${activeRecallCard.word}” for review soon`
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
      showToast(`Removed “${wordText}” from lexicon`);
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
        setLookupMessage('Found definition in dictionary');
      } else {
        setLookupMessage('Not found in dictionary. You can enter your own definition below.');
      }
    } catch {
      setLookupMessage('Lookup service unavailable. Please enter definition manually.');
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
      location: `${targetBookTitle} · Note`,
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
      showToast(`Added “${newRecord.word}” to lexicon`);
    } catch (err) {
      showToast('Error saving word: ' + err.message);
    }
  };

  // Flashcard Quiz Handlers
  const activeQuizCard = words.length > 0 ? words[quizIndex % words.length] : null;

  const handleStartQuiz = () => {
    if (words.length === 0) {
      showToast('No saved words in your vault to quiz yet');
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
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="PERSONAL LEXICON"
        title="Vocabulary"
        description={`${pluralize(words.length, 'saved term')} & contextual definitions`}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartQuiz}
              disabled={words.length === 0}
              icon="psychology"
              aria-label="Quiz Mode"
            >
              <span className="hidden sm:inline">Quiz</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setLookupMessage('');
                setAddModalOpen(true);
              }}
              icon="add"
              aria-label="Add Word"
            >
              <span className="hidden sm:inline">Add Word</span>
            </Button>
          </div>
        }
      />

      {/* Search & Topic Filters */}
      <div className="space-y-4">
        <div className="relative flex items-center">
          <span
            className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            aria-hidden="true"
          >
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, definitions, or sentences…"
            type="text"
            className="w-full min-h-[44px] bg-surface-container-low text-on-surface placeholder:text-on-surface-variant border border-outline-variant/30 rounded-full pl-10 pr-10 py-2.5 text-sm font-sans focus:outline-none focus:border-outline-variant transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Clear search"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                close
              </span>
            </button>
          )}
        </div>

        {/* Book Filter Chips */}
        {words.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 py-1">
            {bookFilterChips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                count={chip.count}
                selected={selectedBook === chip.id}
                onClick={() => setSelectedBook(chip.id)}
              />
            ))}
          </div>
        )}
      </div>

        {/* Error State */}
        {!loading && error && (
          <EmptyState
            icon="error_outline"
            title="Lexicon unavailable"
            description={error}
            action={
              <Button variant="primary" onClick={loadVocabulary} icon="refresh">
                Retry
              </Button>
            }
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <div className="border border-hairline bg-surface rounded-[12px] p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border border-hairline bg-surface rounded-[12px] p-4 space-y-2.5"
                >
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Active Memory Recall Card */}
            {activeRecallCard && (
              <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                    Due for Recall · {dueCards.length} in queue
                  </span>
                  <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                    {activeRecallCard.partOfSpeech}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  {/* Serif Word */}
                  <h2 className="font-serif text-[26px] sm:text-[30px] font-normal text-ink leading-tight">
                    {activeRecallCard.word}
                  </h2>
                  {activeRecallCard.phonetic && (
                    <span className="text-[13px] text-muted font-sans font-normal">
                      {activeRecallCard.phonetic}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => speakWord(activeRecallCard.word)}
                    className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition-colors"
                    title="Pronounce word"
                    aria-label="Pronounce word"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      volume_up
                    </span>
                  </button>
                </div>

                <p className="text-[14.5px] font-sans text-ink leading-relaxed">
                  {activeRecallCard.definition}
                </p>

                {/* Saved sentence in italic serif with word underlined in bronze */}
                {activeRecallCard.contextSentence && (
                  <div
                    onClick={() =>
                      handleOpenInReader(activeRecallCard.bookId, activeRecallCard.cfi)
                    }
                    className={`p-3.5 rounded-[12px] border border-hairline bg-background/50 ${
                      activeRecallCard.bookId ? 'cursor-pointer hover:border-ink/30' : ''
                    } transition-colors`}
                  >
                    <HighlightedSentence
                      sentence={activeRecallCard.contextSentence}
                      word={activeRecallCard.word}
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline text-muted">
                      <span className="text-[11px] font-sans">
                        {activeRecallCard.bookTitle}{' '}
                        {activeRecallCard.chapter ? `· ${activeRecallCard.chapter}` : ''}
                      </span>
                      {activeRecallCard.bookId && (
                        <span
                          className="material-symbols-outlined text-[15px]"
                          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                        >
                          open_in_new
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Review buttons as secondary hairline pills */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRecallAction(false)}
                    icon="update"
                  >
                    Review Soon
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRecallAction(true)}
                    icon="check"
                  >
                    Remembered
                  </Button>
                </div>
              </section>
            )}

            {/* Saved Lexicon List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                  Saved Lexicon ({pluralize(filteredLexicon.length, 'term')})
                </span>
                <span className="text-[11px] text-muted font-sans">Chronological</span>
              </div>

              {filteredLexicon.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={searchQuery ? 'search_off' : 'spellcheck'}
                    title={searchQuery ? 'No matching words found' : 'Your lexicon is empty'}
                    description={
                      searchQuery
                        ? `No terms match “${searchQuery}”.`
                        : 'Capture unfamiliar words while reading to build your personal lexicon.'
                    }
                    action={
                      searchQuery ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedBook('All Books');
                          }}
                        >
                          Reset filters
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => setAddModalOpen(true)}
                          icon="add"
                        >
                          Add term
                        </Button>
                      )
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredLexicon.map((entry) => (
                    <article
                      key={entry.id}
                      className="border border-hairline bg-surface rounded-[12px] p-4 flex flex-col justify-between space-y-3 hover:border-ink/25 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {/* Serif Word */}
                            <h4 className="font-serif text-[20px] font-normal text-ink leading-tight">
                              {entry.word}
                            </h4>
                            {entry.phonetic && (
                              <span className="text-[12px] text-muted font-sans">
                                {entry.phonetic}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => speakWord(entry.word)}
                              className="text-muted hover:text-ink transition-colors p-1"
                              title="Pronounce word"
                              aria-label={`Pronounce ${entry.word}`}
                            >
                              <span
                                className="material-symbols-outlined text-[15px]"
                                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                              >
                                volume_up
                              </span>
                            </button>
                          </div>
                          {/* Part of speech as micro-label */}
                          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium shrink-0">
                            {entry.partOfSpeech}
                          </span>
                        </div>

                        <p className="text-[13.5px] text-muted font-sans mt-1 leading-relaxed">
                          {entry.definition}
                        </p>

                        {/* Saved sentence in italic serif with word underlined in bronze */}
                        {entry.contextSentence && (
                          <div className="mt-3 p-3 rounded-[8px] border border-hairline bg-background/50">
                            <HighlightedSentence
                              sentence={entry.contextSentence}
                              word={entry.word}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-muted">
                        <span className="truncate max-w-[180px] font-sans">
                          {entry.bookTitle} {entry.chapter ? `· ${entry.chapter}` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAiWord(entry)}
                            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
                            title="Explain in AI Margin"
                            aria-label="Explain in AI Margin"
                          >
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                            >
                              auto_awesome
                            </span>
                          </button>
                          {entry.bookId && (
                            <button
                              type="button"
                              onClick={() => handleOpenInReader(entry.bookId, entry.cfi)}
                              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
                              title="Open book passage"
                              aria-label="Open book passage"
                            >
                              <span
                                className="material-symbols-outlined text-[16px]"
                                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                              >
                                open_in_new
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-red-600 transition-colors flex items-center justify-center"
                            title="Delete word"
                            aria-label="Delete word"
                          >
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          data-overlay="dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteConfirmId(null)}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface rounded-[24px] border border-hairline p-6 space-y-4"
          >
            <h3 className="font-serif text-[18px] text-ink font-normal">
              Remove from lexicon?
            </h3>
            <p className="text-[13px] text-muted font-sans">
              This entry and its review progress will be removed from your vault.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const target = words.find((w) => w.id === deleteConfirmId);
                  handleDeleteWord(deleteConfirmId, target?.word || 'term');
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {addModalOpen && (
        <div
          data-overlay="dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-serif text-[20px] text-ink font-normal">
                Add to Lexicon
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleAddWordSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                  Word
                </label>
                <div className="flex gap-2">
                  <input
                    value={addWord}
                    onChange={(e) => setAddWord(e.target.value)}
                    placeholder="e.g. Ephemeral"
                    required
                    className="flex-1 bg-surface border border-hairline rounded-[12px] px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleLookupDictionary}
                    disabled={!addWord.trim() || lookingUp}
                  >
                    {lookingUp ? 'Looking…' : 'Lookup'}
                  </Button>
                </div>
                {lookupMessage && (
                  <p className="text-[11px] text-muted font-sans mt-1">{lookupMessage}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                    Phonetic
                  </label>
                  <input
                    value={addPhonetic}
                    onChange={(e) => setAddPhonetic(e.target.value)}
                    placeholder="/ɪˈfɛmərəl/"
                    className="w-full bg-surface border border-hairline rounded-[12px] px-3.5 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                    Part of Speech
                  </label>
                  <select
                    value={addPartOfSpeech}
                    onChange={(e) => setAddPartOfSpeech(e.target.value)}
                    className="w-full bg-surface border border-hairline rounded-[12px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="phrase">Phrase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                  Definition
                </label>
                <textarea
                  value={addDefinition}
                  onChange={(e) => setAddDefinition(e.target.value)}
                  placeholder="Lasting for a very short time…"
                  required
                  rows={3}
                  className="w-full bg-surface border border-hairline rounded-[12px] p-3 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                  Context Sentence
                </label>
                <textarea
                  value={addSentence}
                  onChange={(e) => setAddSentence(e.target.value)}
                  placeholder="Fashions are ephemeral, but style endures…"
                  rows={2}
                  className="w-full bg-surface border border-hairline rounded-[12px] p-3 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink font-serif italic"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Save Term
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {quizModeOpen && activeQuizCard && (
        <div
          data-overlay="dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setQuizModeOpen(false)}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                Card {quizIndex + 1} of {Math.min(words.length, 10)}
              </span>
              <button
                type="button"
                onClick={() => setQuizModeOpen(false)}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  close
                </span>
              </button>
            </div>

            {quizFinished ? (
              <div className="text-center py-6 space-y-4">
                <h3 className="font-serif text-[24px] text-ink font-normal">
                  Quiz complete
                </h3>
                <p className="text-[14px] text-muted font-sans">
                  {quizStats.remembered} remembered · {quizStats.reviewSoon} scheduled for review
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setQuizModeOpen(false)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div
                  onClick={() => setQuizFlipped(!quizFlipped)}
                  className="min-h-[160px] p-6 rounded-[12px] border border-hairline bg-background/50 flex flex-col items-center justify-center cursor-pointer space-y-2 select-none"
                >
                  <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                    {activeQuizCard.partOfSpeech}
                  </span>
                  <h3 className="font-serif text-[28px] text-ink font-normal">
                    {activeQuizCard.word}
                  </h3>
                  {quizFlipped ? (
                    <p className="text-[14px] text-muted font-sans pt-2">
                      {activeQuizCard.definition}
                    </p>
                  ) : (
                    <span className="text-[11px] text-muted font-sans pt-2">
                      Click to reveal definition
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleQuizAnswer(false)}
                  >
                    Review Soon
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleQuizAnswer(true)}
                  >
                    Remembered
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Margin Drawer */}
      {aiWord && (
        <AiDrawer
          activeItem={{
            type: 'word',
            word: aiWord.word,
            definition: aiWord.definition,
            sentence: aiWord.contextSentence,
            bookTitle: aiWord.bookTitle,
          }}
          onClose={() => setAiWord(null)}
        />
      )}
    </div>
  );
}
