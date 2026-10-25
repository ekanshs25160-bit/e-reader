'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { saveVocabularyWord } from '@/utils/db';
import { lookupWord, streamAi } from '@/lib/api';

export default function AiDrawer({
  open = true,
  isOpen,
  onClose,
  quote: initialQuote,
  selectedText,
  initialTab = 'subtext',
  bookTitle = 'Untitled Book',
  bookId = 'book',
  author = 'Unknown Author',
  currentChapter = '',
  canvasRef,
  onShowToast,
  autoFocusInput = false,
}) {
  const isDrawerOpen = isOpen !== undefined ? isOpen : open;

  // Selected text or excerpt capped at 10,000 characters
  const rawQuote = selectedText || initialQuote || '';
  const quote = rawQuote.length > 10000 ? rawQuote.slice(0, 10000) : rawQuote;

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [spoilersOff, setSpoilersOff] = useState(true);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUps, setFollowUps] = useState([]);
  const [savedJournal, setSavedJournal] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  // Dynamic state for each tab's streamed AI content
  const [tabState, setTabState] = useState({
    subtext: { text: '', isStreaming: false, error: null },
    summary: { text: '', isStreaming: false, error: null },
    author: { text: '', isStreaming: false, error: null },
  });

  // Dynamic Dictionary lookup state (for define tab)
  const [dictLoading, setDictLoading] = useState(false);
  const [dictResult, setDictResult] = useState(null);
  const [dictError, setDictError] = useState(null);

  // Extract clean target word for vocabulary / dictionary lookup
  const cleanWord = quote
    ? quote.replace(/^[“"']+|[”"'.?!,;:\s]+$/g, '').trim().split(/\s+/)[0] || 'word'
    : 'word';
  const isShortSnippet = quote ? quote.trim().split(/\s+/).length <= 3 : false;

  const abortCurrentStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Teardown abort on unmount
  useEffect(() => {
    return () => {
      abortCurrentStream();
    };
  }, [abortCurrentStream]);

  // Handle drawer close
  const handleClose = useCallback(() => {
    abortCurrentStream();
    onClose?.();
  }, [abortCurrentStream, onClose]);

  // Autofocus follow-up input if requested
  useEffect(() => {
    if (isDrawerOpen && autoFocusInput) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, autoFocusInput]);

  // Main streaming generator for tabs: subtext, summary, author
  const startStreamForTab = useCallback(
    async (tabName) => {
      if (tabName === 'define' || tabName === 'journal') return;

      abortCurrentStream();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setTabState((prev) => ({
        ...prev,
        [tabName]: { text: '', isStreaming: true, error: null },
      }));

      const cappedSelectedText = (quote || '').slice(0, 10000);

      try {
        if (tabName === 'subtext') {
          await streamAi(
            '/api/ai/assist',
            {
              bookTitle: bookTitle || 'Untitled Book',
              author: author || 'Unknown Author',
              currentChapter: currentChapter || 'Current Chapter',
              selectedText: cappedSelectedText || 'Current passage excerpt',
            },
            {
              onToken: (token) => {
                setTabState((prev) => ({
                  ...prev,
                  subtext: {
                    ...prev.subtext,
                    text: (prev.subtext?.text || '') + token,
                  },
                }));
              },
              onDone: () => {
                setTabState((prev) => ({
                  ...prev,
                  subtext: { ...prev.subtext, isStreaming: false },
                }));
              },
              onError: (err) => {
                setTabState((prev) => ({
                  ...prev,
                  subtext: {
                    ...prev.subtext,
                    isStreaming: false,
                    error: err?.message || 'Failed to generate subtext analysis.',
                  },
                }));
              },
              signal: controller.signal,
            }
          );
        } else if (tabName === 'summary') {
          const rawChapterText =
            canvasRef?.current?.getChapterText?.() || cappedSelectedText || 'Chapter excerpt';
          const truncatedChapterText = (rawChapterText || 'Current chapter text').slice(0, 50000);

          await streamAi(
            '/api/ai/summary',
            {
              bookTitle: bookTitle || 'Untitled Book',
              author: author || 'Unknown Author',
              chapterTitle: currentChapter || 'Current Chapter',
              chapterText: truncatedChapterText,
            },
            {
              onToken: (token) => {
                setTabState((prev) => ({
                  ...prev,
                  summary: {
                    ...prev.summary,
                    text: (prev.summary?.text || '') + token,
                  },
                }));
              },
              onDone: () => {
                setTabState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, isStreaming: false },
                }));
              },
              onError: (err) => {
                setTabState((prev) => ({
                  ...prev,
                  summary: {
                    ...prev.summary,
                    isStreaming: false,
                    error: err?.message || 'Failed to generate chapter summary.',
                  },
                }));
              },
              signal: controller.signal,
            }
          );
        } else if (tabName === 'author') {
          const authorQuery = `Provide biographical, historical, and cultural context for ${
            author || 'the author'
          } in relation to "${bookTitle || 'this work'}".`;

          await streamAi(
            '/api/ai/author-grounding',
            {
              author: author || 'Unknown Author',
              bookTitle: bookTitle || 'Untitled Book',
              userQuery: authorQuery,
            },
            {
              onToken: (token) => {
                setTabState((prev) => ({
                  ...prev,
                  author: {
                    ...prev.author,
                    text: (prev.author?.text || '') + token,
                  },
                }));
              },
              onDone: () => {
                setTabState((prev) => ({
                  ...prev,
                  author: { ...prev.author, isStreaming: false },
                }));
              },
              onError: (err) => {
                setTabState((prev) => ({
                  ...prev,
                  author: {
                    ...prev.author,
                    isStreaming: false,
                    error: err?.message || 'Failed to retrieve author grounding.',
                  },
                }));
              },
              signal: controller.signal,
            }
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setTabState((prev) => ({
            ...prev,
            [tabName]: {
              ...prev[tabName],
              isStreaming: false,
              error: err?.message || 'AI request failed.',
            },
          }));
        }
      }
    },
    [abortCurrentStream, bookTitle, author, currentChapter, quote, canvasRef]
  );

  // Tab switching with stream abort
  const handleTabChange = (newTab) => {
    if (newTab === 'journal') {
      handleSaveToJournal();
      return;
    }
    abortCurrentStream();
    setActiveTab(newTab);
    if (newTab !== 'define') {
      const existing = tabState[newTab];
      if (!existing?.text && !existing?.isStreaming) {
        startStreamForTab(newTab);
      }
    }
  };

  // Trigger stream on drawer open or quote update
  const prevQuoteRef = useRef(quote);
  useEffect(() => {
    if (!isDrawerOpen) {
      abortCurrentStream();
      return;
    }

    if (prevQuoteRef.current !== quote) {
      prevQuoteRef.current = quote;
      setTabState({
        subtext: { text: '', isStreaming: false, error: null },
        summary: { text: '', isStreaming: false, error: null },
        author: { text: '', isStreaming: false, error: null },
      });
      setFollowUps([]);
    }

    if (activeTab !== 'define' && activeTab !== 'journal') {
      const current = tabState[activeTab];
      if (!current?.text && !current?.isStreaming && !current?.error) {
        startStreamForTab(activeTab);
      }
    }
  }, [isDrawerOpen, quote, activeTab, startStreamForTab, abortCurrentStream, tabState]);

  // Lookup word in dictionary when define tab is active
  useEffect(() => {
    if (!isDrawerOpen || activeTab !== 'define' || !cleanWord || cleanWord.length < 2) return;

    let isCancelled = false;
    async function fetchDefinition() {
      try {
        setDictLoading(true);
        setDictError(null);
        const data = await lookupWord(cleanWord.toLowerCase());
        if (!isCancelled) {
          if (data?.definition && data.definition.length > 0) {
            setDictResult(data);
          } else {
            setDictError('Not in dictionary, ask AI');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setDictError('Not in dictionary, ask AI');
        }
      } finally {
        if (!isCancelled) setDictLoading(false);
      }
    }

    fetchDefinition();

    return () => {
      isCancelled = true;
    };
  }, [cleanWord, isDrawerOpen, activeTab]);

  // Follow-up question submission streaming through assist endpoint
  const handleSendFollowUp = async (e) => {
    e?.preventDefault();
    const q = followUpInput.trim();
    if (!q) return;

    abortCurrentStream();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const followUpId = Date.now();
    setFollowUps((prev) => [
      ...prev,
      {
        id: followUpId,
        question: q,
        answer: '',
        isStreaming: true,
        error: null,
      },
    ]);
    setFollowUpInput('');

    const cappedSelectedText = (quote || '').slice(0, 10000);

    try {
      await streamAi(
        '/api/ai/assist',
        {
          bookTitle: bookTitle || 'Untitled Book',
          author: author || 'Unknown Author',
          currentChapter: currentChapter || 'Current Chapter',
          selectedText: cappedSelectedText || 'Current passage excerpt',
          userQuery: q,
        },
        {
          onToken: (token) => {
            setFollowUps((prev) =>
              prev.map((item) =>
                item.id === followUpId
                  ? { ...item, answer: item.answer + token }
                  : item
              )
            );
          },
          onDone: () => {
            setFollowUps((prev) =>
              prev.map((item) =>
                item.id === followUpId ? { ...item, isStreaming: false } : item
              )
            );
          },
          onError: (err) => {
            setFollowUps((prev) =>
              prev.map((item) =>
                item.id === followUpId
                  ? {
                      ...item,
                      isStreaming: false,
                      error: err?.message || 'Failed to stream answer',
                    }
                  : item
              )
            );
          },
          signal: controller.signal,
        }
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        setFollowUps((prev) =>
          prev.map((item) =>
            item.id === followUpId
              ? {
                  ...item,
                  isStreaming: false,
                  error: err?.message || 'Follow-up request failed',
                }
              : item
          )
        );
      }
    }
  };

  // Save to Journal mode
  const handleSaveToJournal = async () => {
    const wordKey = cleanWord;
    const def =
      tabState[activeTab]?.text?.slice(0, 200) ||
      dictResult?.definition?.[0] ||
      'Passage and companion marginalia saved from reading session';

    await saveVocabularyWord({
      word: wordKey,
      phonetic: dictResult?.phonetic || '/—/',
      partOfSpeech: 'journal',
      definitions: [def],
      quote: quote.slice(0, 500),
      bookTitle: bookTitle,
      bookId: bookId,
      chapter: currentChapter,
    });

    setSavedJournal(true);
    if (onShowToast) onShowToast(`Saved passage to your Reading Journal`);
    setTimeout(() => setSavedJournal(false), 2500);
  };

  // Keep as Note on this Page
  const handleKeepAsNote = async () => {
    const noteText =
      tabState[activeTab]?.text || quote || 'Marginalia note on passage';

    await saveVocabularyWord({
      word: cleanWord || 'Note',
      phonetic: '/note/',
      partOfSpeech: 'marginalia',
      definitions: [noteText.slice(0, 400)],
      quote: quote.slice(0, 500),
      bookTitle: bookTitle,
      bookId: bookId,
      chapter: currentChapter,
    });

    setSavedNote(true);
    if (onShowToast) onShowToast('Pinned note to margin vault');
    setTimeout(() => setSavedNote(false), 2500);
  };

  // Share Insight
  const handleShare = () => {
    const textToCopy =
      tabState[activeTab]?.text || quote || `${bookTitle} by ${author}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    if (onShowToast) onShowToast('Insight copied to clipboard');
  };

  if (!isDrawerOpen) return null;

  const currentTabState = tabState[activeTab] || {
    text: '',
    isStreaming: false,
    error: null,
  };

  const analysisTitle =
    activeTab === 'subtext'
      ? 'Psychological Subtext & Literary Devices'
      : activeTab === 'summary'
      ? `Chapter Summary · ${currentChapter || 'Overview'}`
      : `Author & Era · ${author || 'Historical Context'}`;

  // Clean quote text without outer quotation marks or irregular whitespace
  const cleanQuote = quote
    ? quote.trim().replace(/^["“'”]+|["“'”]+$/g, '').trim()
    : '';

  const chapterDisplay = currentChapter
    ? currentChapter.length > 12
      ? currentChapter.slice(0, 10) + '…'
      : currentChapter
    : 'Ch. 1';

  return (
    <>
      {/* 1. Atmospheric Scrim on Mobile Only */}
      <div
        onClick={handleClose}
        className="md:hidden fixed inset-0 bg-primary/20 backdrop-blur-[2.5px] z-40 pointer-events-auto transition-opacity duration-300"
      />

      {/* 2. AI Assistant: Phone bottom sheet (45-50%), Tablet & Desktop right-docked panel (420px) */}
      <aside
        aria-label="AI Literary Companion"
        className="fixed z-50 bg-surface flex flex-col border-outline-variant/40 transition-all duration-300 ease-out overflow-hidden text-on-surface
          /* Phone: bottom sheet 45-50% height */
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[48dvh] max-md:max-h-[50dvh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-[0_-8px_32px_rgba(21,42,65,0.15)]
          /* Tablet & Desktop: right-docked panel 420px wide */
          md:top-0 md:right-0 md:bottom-0 md:w-[420px] md:h-full md:rounded-l-3xl md:border-l md:shadow-2xl"
      >
        {/* Tactile Drag Handle (Mobile only) */}
        <div className="md:hidden w-full flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant/60"></div>
        </div>

        {/* Drawer Header Bar */}
        <header className="px-5 py-2.5 flex items-center justify-between border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 shadow-xs">
              <span
                className="material-symbols-outlined text-[18px]"
                data-icon="auto_stories"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight leading-tight">
                Literary Companion
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Spoiler Protection Indicator */}
            <button
              type="button"
              onClick={() => setSpoilersOff((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors min-h-[44px]"
            >
              <span
                className="material-symbols-outlined text-[14px] text-secondary"
                data-icon="shield"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield
              </span>
              <span>{spoilersOff ? `Spoilers: Off (${chapterDisplay})` : 'Spoilers: All'}</span>
            </button>
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close drawer"
              className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="close">
                close
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Drawer Interior Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 hide-scrollbar">
          {/* 3. Tactile Parchment Quote Card (Aligned with AI Assist Notebook Card) */}
          {cleanQuote && (
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 border-l-[3.5px] border-l-secondary shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="material-symbols-outlined text-[16px] text-secondary"
                    data-icon="format_quote"
                  >
                    format_quote
                  </span>
                  <span className="font-label-sm text-[11px] tracking-wider uppercase text-secondary font-semibold">
                    Highlighted Passage
                  </span>
                </div>
                <span className="font-caption text-caption text-outline">
                  {chapterDisplay}
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto hide-scrollbar">
                <p className="font-body-reading text-[14px] leading-[23px] italic text-on-surface text-left select-text">
                  &ldquo;{cleanQuote}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* 4. Mode Switcher Pill Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {/* Explain Subtext */}
            <button
              type="button"
              onClick={() => handleTabChange('subtext')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                activeTab === 'subtext'
                  ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px] text-secondary-fixed"
                data-icon="sparkles"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>Explain Subtext</span>
            </button>

            {/* Chapter Summary */}
            <button
              type="button"
              onClick={() => handleTabChange('summary')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                activeTab === 'summary'
                  ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" data-icon="menu_book">
                menu_book
              </span>
              <span>Chapter Summary</span>
            </button>

            {/* Author & Era */}
            <button
              type="button"
              onClick={() => handleTabChange('author')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                activeTab === 'author'
                  ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" data-icon="travel_explore">
                travel_explore
              </span>
              <span>Author &amp; Era</span>
            </button>

            {/* Save to Journal */}
            <button
              type="button"
              onClick={() => handleTabChange('journal')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                savedJournal
                  ? 'bg-secondary-container/60 border border-secondary text-on-secondary-container font-semibold'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px]"
                data-icon="bookmark_add"
                style={{ fontVariationSettings: savedJournal ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark_add
              </span>
              <span>{savedJournal ? 'Saved to Journal ✓' : 'Save to Journal'}</span>
            </button>

            {/* Optional Define Tab if short snippet */}
            {isShortSnippet && (
              <button
                type="button"
                onClick={() => handleTabChange('define')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                  activeTab === 'define'
                    ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" data-icon="dictionary">
                  menu_book
                </span>
                <span>Define &ldquo;{cleanWord}&rdquo;</span>
              </button>
            )}
          </div>

          {/* 5. Live Editorial AI Streaming Response Notebook Card */}
          {activeTab === 'define' ? (
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-headline-md text-[18px] text-primary tracking-tight font-medium">
                    {dictResult?.word || cleanWord}
                  </h3>
                  <span className="font-body-ui text-[12px] text-outline font-mono">
                    {dictResult?.phonetic || '/—/'}
                  </span>
                </div>
                {dictResult?.partsOfSpeech?.[0] && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-label-sm tracking-wider bg-surface-container-high text-on-surface-variant">
                    {dictResult.partsOfSpeech[0]}
                  </span>
                )}
              </div>

              {dictLoading ? (
                <div className="py-6 text-center text-caption text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Looking up dictionary entry…</span>
                </div>
              ) : dictError ? (
                <div className="py-4 text-center text-xs text-on-surface-variant">
                  <p>{dictError}</p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('subtext')}
                    className="mt-2 text-secondary underline font-medium"
                  >
                    Ask AI to analyze this excerpt
                  </button>
                </div>
              ) : dictResult?.definition ? (
                <ol className="space-y-2 text-[13.5px] leading-relaxed list-decimal list-inside text-on-surface font-body-ui">
                  {dictResult.definition.slice(0, 3).map((def, idx) => (
                    <li key={idx} className="text-on-surface-variant">
                      <span className="text-on-surface">{def}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="font-body-ui text-[13.5px] text-on-surface-variant leading-relaxed">
                  Contextual usage in {bookTitle}: &ldquo;{cleanWord}&rdquo; conveys the tone of the passage.
                </p>
              )}

              <div className="pt-2 flex items-center gap-1.5 text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
                <span className="material-symbols-outlined text-[15px] text-secondary" data-icon="policy">
                  policy
                </span>
                <span>Dictionary API Grounding</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <h3 className="font-headline-sm text-[18px] text-primary tracking-tight font-medium flex items-center gap-1.5">
                  <span>{analysisTitle}</span>
                </h3>
                <span className="font-caption text-caption text-outline">Marginalia</span>
              </div>

              {/* Skeleton before first token */}
              {currentTabState.isStreaming && !currentTabState.text && (
                <div className="space-y-3 py-3 animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded-md w-3/4"></div>
                  <div className="h-3.5 bg-surface-container-high rounded-md w-full"></div>
                  <div className="h-3.5 bg-surface-container-high rounded-md w-5/6"></div>
                  <div className="flex items-center gap-2 pt-2 text-secondary text-xs font-label-sm">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span>Consulting literary intelligence…</span>
                  </div>
                </div>
              )}

              {/* Error state with Retry button */}
              {currentTabState.error && !currentTabState.isStreaming && (
                <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-center space-y-2.5 my-2">
                  <div className="flex items-center justify-center gap-2 text-error text-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">error_outline</span>
                    <span>Analysis Failed</span>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    {currentTabState.error}
                  </p>
                  <button
                    type="button"
                    onClick={() => startStreamForTab(activeTab)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-label-md hover:opacity-90 active:scale-95 transition"
                  >
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Rendered Markdown with copper dot bullets */}
              {currentTabState.text && (
                <div className="text-[13.5px] leading-[22px] text-on-surface font-body-ui space-y-2.5">
                  <ReactMarkdown
                    components={{
                      li: ({ children }) => (
                        <div className="flex items-start gap-2 my-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
                          <div className="flex-1">{children}</div>
                        </div>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-body-ui-bold text-primary">{children}</strong>
                      ),
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    }}
                  >
                    {currentTabState.text}
                  </ReactMarkdown>
                  {currentTabState.isStreaming && (
                    <span className="inline-block w-[2px] h-3.5 bg-secondary ml-1 cursor-pulse align-middle" />
                  )}
                </div>
              )}

              {/* Grounding Verification Bar */}
              <div className="pt-2 flex items-center justify-between text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-secondary" data-icon="policy">
                    policy
                  </span>
                  <span>Grounding: Textual analysis &amp; historical grounding</span>
                </div>
                {!currentTabState.isStreaming && currentTabState.text && (
                  <button
                    type="button"
                    onClick={() => startStreamForTab(activeTab)}
                    className="text-[11px] font-label-sm text-secondary hover:underline flex items-center gap-1"
                    title="Regenerate insight"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Follow-up conversation history */}
          {followUps.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-2 animate-in fade-in duration-200"
            >
              <p className="font-label-md text-label-md text-secondary font-semibold">
                Q: {item.question}
              </p>
              {item.isStreaming && !item.answer && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant animate-pulse py-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Thinking…</span>
                </div>
              )}
              {item.error ? (
                <p className="text-xs text-error">{item.error}</p>
              ) : item.answer ? (
                <div className="text-[13.5px] leading-[22px] text-on-surface font-body-ui space-y-2">
                  <ReactMarkdown
                    components={{
                      li: ({ children }) => (
                        <div className="flex items-start gap-2 my-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
                          <div className="flex-1">{children}</div>
                        </div>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-body-ui-bold text-primary">{children}</strong>
                      ),
                    }}
                  >
                    {item.answer}
                  </ReactMarkdown>
                  {item.isStreaming && (
                    <span className="inline-block w-[2px] h-3.5 bg-secondary ml-1 cursor-pulse align-middle" />
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* 6. Action & Follow-Up Footer */}
        <footer className="p-4 bg-surface/95 border-t border-outline-variant/20 flex flex-col gap-2.5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Follow-up query pill input bar */}
          <form
            onSubmit={handleSendFollowUp}
            className="flex items-center bg-surface-container rounded-full px-3.5 py-1.5 border border-outline-variant/40 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-outline mr-2" data-icon="search">
              search
            </span>
            <input
              ref={inputRef}
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-on-surface font-body-ui text-[13px] placeholder:text-outline focus:ring-0 focus:outline-none"
              placeholder="Ask a follow-up about this passage…"
              type="text"
            />
            <button
              type="submit"
              aria-label="Send follow up"
              className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform ml-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]" data-icon="arrow_upward">
                arrow_upward
              </span>
            </button>
          </form>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleKeepAsNote}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary transition-colors active:scale-98"
            >
              <span
                className="material-symbols-outlined text-[16px] text-secondary-fixed"
                data-icon="push_pin"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                push_pin
              </span>
              <span>{savedNote ? 'Pinned to Notes ✓' : 'Keep as Note on this Page'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share insight"
              className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/40 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="ios_share">
                ios_share
              </span>
            </button>
          </div>
          <div className="text-center">
            <span className="font-caption text-[10px] text-outline">
              Saves to CFI timeline &amp; margin vault
            </span>
          </div>
        </footer>
      </aside>
    </>
  );
}
