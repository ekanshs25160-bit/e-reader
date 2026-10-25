'use client';

import { useRef, useEffect } from 'react';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { AiHeader } from './AiHeader';
import { AiQuoteCard } from './AiQuoteCard';
import { AiTabStrip } from './AiTabStrip';
import { AiDefinitionView } from './AiDefinitionView';
import { AiAnalysisView } from './AiAnalysisView';
import { AiFollowUps } from './AiFollowUps';
import { AiFooter } from './AiFooter';

export function AiDrawer({
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
  activeItem,
}) {
  const isDrawerOpen = isOpen !== undefined ? isOpen : open;

  const rawQuote =
    activeItem?.sentence ||
    activeItem?.word ||
    selectedText ||
    initialQuote ||
    '';
  const quote = rawQuote.length > 10000 ? rawQuote.slice(0, 10000) : rawQuote;

  const effectiveTitle = activeItem?.bookTitle || bookTitle;
  const effectiveInitialTab =
    activeItem?.type === 'word' ? 'define' : initialTab;

  const inputRef = useRef(null);

  const {
    activeTab,
    handleTabChange,
    spoilersOff,
    setSpoilersOff,
    savedJournal,
    savedNote,
    tabState,
    cleanWord,
    isShortSnippet,
    dict,
    followUp,
    startStreamForTab,
    abortCurrentStream,
    handleKeepAsNote,
    handleShare,
  } = useAiAssistant({
    quote,
    bookTitle: effectiveTitle,
    bookId,
    author,
    currentChapter,
    canvasRef,
    onShowToast,
    isDrawerOpen,
    initialTab: effectiveInitialTab,
  });

  const handleClose = () => {
    abortCurrentStream();
    onClose?.();
  };

  useEffect(() => {
    if (isDrawerOpen && autoFocusInput) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, autoFocusInput]);

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
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[48dvh] max-md:max-h-[50dvh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-[0_-8px_32px_rgba(21,42,65,0.15)]
          md:top-0 md:right-0 md:bottom-0 md:w-[420px] md:h-full md:rounded-l-3xl md:border-l md:shadow-2xl"
      >
        <AiHeader
          spoilersOff={spoilersOff}
          setSpoilersOff={setSpoilersOff}
          chapterDisplay={chapterDisplay}
          onClose={handleClose}
        />

        {/* Scrollable Drawer Interior Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 hide-scrollbar">
          <AiQuoteCard
            cleanQuote={cleanQuote}
            chapterDisplay={chapterDisplay}
          />

          <AiTabStrip
            activeTab={activeTab}
            onTabChange={handleTabChange}
            savedJournal={savedJournal}
            isShortSnippet={isShortSnippet || Boolean(activeItem?.word)}
            cleanWord={activeItem?.word || cleanWord}
          />

          {activeTab === 'define' ? (
            <AiDefinitionView
              cleanWord={activeItem?.word || cleanWord}
              bookTitle={effectiveTitle}
              dictResult={dict.dictResult}
              dictLoading={dict.dictLoading}
              dictError={dict.dictError}
              onAskAi={() => handleTabChange('subtext')}
            />
          ) : (
            <AiAnalysisView
              analysisTitle={analysisTitle}
              currentTabState={currentTabState}
              onRetry={() => startStreamForTab(activeTab)}
            />
          )}

          <AiFollowUps followUps={followUp.followUps} />
        </div>

        <AiFooter
          inputRef={inputRef}
          followUpInput={followUp.followUpInput}
          setFollowUpInput={followUp.setFollowUpInput}
          onSendFollowUp={followUp.handleSendFollowUp}
          onKeepAsNote={handleKeepAsNote}
          savedNote={savedNote}
          onShare={handleShare}
        />
      </aside>
    </>
  );
}
