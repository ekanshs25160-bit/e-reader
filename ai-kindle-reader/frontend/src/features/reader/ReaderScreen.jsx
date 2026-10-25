'use client';

import React, { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DEMO_FALLBACK_CONTENT } from './constants';
import ReaderCanvas from './components/ReaderCanvas';
import ReaderHeader from './components/ReaderHeader';
import ReaderFooter from './components/ReaderFooter';
import SelectionCard from './components/SelectionCard';
import ReaderOverlays from './components/ReaderOverlays';
import ReaderFurniture from './components/ReaderFurniture';
import ReaderToast from './components/ReaderToast';
import { ReaderInitialLoadingState, ReaderDownloadState } from './components/ReaderStates';
import { useBookLoader } from './hooks/useBookLoader';
import { useReadingSession } from './hooks/useReadingSession';
import { useReaderSettings } from './hooks/useReaderSettings';
import { useHud } from './hooks/useHud';
import { useBookmarks } from './hooks/useBookmarks';
import { useSelectionCard } from './hooks/useSelectionCard';
import { useReaderShortcuts } from './hooks/useReaderShortcuts';
import { useReaderTheme } from './hooks/useReaderTheme';
import { useReaderLocation } from './hooks/useReaderLocation';

export default function ReaderScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const targetCfi = searchParams?.get('cfi') || null;
  const bookId = decodeURIComponent(params?.id || '');
  const canvasRef = useRef(null);
  const contentsBtnRef = useRef(null);
  const highlightsBtnRef = useRef(null);

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const {
    bookMeta,
    bookBlob,
    loadingDb,
    isNotDownloaded,
    isReDownloading,
    downloadError,
    handleDownloadAgain,
    toc,
    setToc,
  } = useBookLoader(bookId, showToast);

  const [selectedData, setSelectedData] = useState(null);
  const { readerSettings, handleSettingsChange } = useReaderSettings();
  const { currentPalette, isShortLandscape } = useReaderTheme(readerSettings);

  const {
    currentCfi,
    currentProgress,
    currentChapter,
    pageInfo,
    endOfChapterHint,
    handleLocationChange,
    pct,
  } = useReaderLocation({
    bookId,
    recordPageTurn: () => session.recordPageTurn(),
    setSelectedData,
  });

  const session = useReadingSession({ bookId, bookBlob, loadingDb, isNotDownloaded, pageInfo });
  const [activeOverlay, setActiveOverlay] = useState('none');
  const [aiInitialTab, setAiInitialTab] = useState('subtext');

  const {
    showHud,
    setShowHud,
    cursorHidden,
    isMouseInWindow,
    isFullscreen,
    handleToggleHud,
    handleToggleFullscreen,
    registerPointerActivity,
  } = useHud({ activeOverlay, onActivity: session.registerActivity });

  const {
    bookmarks,
    highlights,
    activeHighlightColor,
    isCurrentBookmarked,
    handleToggleBookmark,
    handleAddHighlight,
    handleDeleteHighlight,
  } = useBookmarks({
    bookId,
    bookMeta,
    currentCfi,
    currentProgress,
    currentChapter,
    pageInfo,
    canvasRef,
    showToast,
  });

  const selection = useSelectionCard({
    bookId,
    bookMeta,
    currentCfi,
    currentChapter,
    showToast,
    setActiveOverlay,
    setAiInitialTab,
    handleAddHighlight: (color) => handleAddHighlight(selectedData?.text, selectedData?.cfiRange, color),
  });

  const { handleKeyDown } = useReaderShortcuts({
    canvasRef,
    activeOverlay,
    setActiveOverlay,
    selectedData,
    setSelectedData,
    setShowHud,
    handleToggleFullscreen,
    handleToggleBookmark,
    onActivity: session.registerActivity,
  });

  if (loadingDb) return <ReaderInitialLoadingState />;
  if (isNotDownloaded) {
    return (
      <ReaderDownloadState
        bookMeta={bookMeta}
        onDownload={handleDownloadAgain}
        isDownloading={isReDownloading}
        error={downloadError}
      />
    );
  }

  return (
    <div
      style={{
        '--reader-bg': currentPalette.bg,
        '--reader-fg': currentPalette.fg,
        '--reader-muted': currentPalette.muted,
        '--reader-border': currentPalette.border,
        '--reader-accent': currentPalette.accent,
        backgroundColor: 'var(--reader-bg)',
        color: 'var(--reader-fg)',
      }}
      className="relative w-full h-full overflow-hidden select-none"
    >
      <ReaderToast message={toastMessage} />

      <ReaderHeader
        bookMeta={bookMeta}
        pageInfo={pageInfo}
        showHud={showHud}
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        isShortLandscape={isShortLandscape}
        isCurrentBookmarked={isCurrentBookmarked}
        handleToggleBookmark={handleToggleBookmark}
        isFullscreen={isFullscreen}
        handleToggleFullscreen={handleToggleFullscreen}
        contentsBtnRef={contentsBtnRef}
        highlightsBtnRef={highlightsBtnRef}
      />

      <ReaderOverlays
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        toc={toc}
        currentChapter={currentChapter}
        canvasRef={canvasRef}
        contentsBtnRef={contentsBtnRef}
        highlightsBtnRef={highlightsBtnRef}
        highlights={highlights}
        handleDeleteHighlight={handleDeleteHighlight}
        readerSettings={readerSettings}
        handleSettingsChange={handleSettingsChange}
        selectedData={selectedData}
        setSelectedData={setSelectedData}
        aiInitialTab={aiInitialTab}
        bookMeta={bookMeta}
        bookId={bookId}
        showToast={showToast}
      />

      <ReaderFurniture
        pageInfo={pageInfo}
        currentProgress={currentProgress}
        isMouseInWindow={isMouseInWindow}
        canvasRef={canvasRef}
        bookMeta={bookMeta}
        currentChapter={currentChapter}
        showToolbar={showHud || activeOverlay !== 'none'}
      />

      <ReaderCanvas
        ref={canvasRef}
        bookBlob={bookBlob}
        fallbackContent={DEMO_FALLBACK_CONTENT}
        initialCfi={targetCfi || bookMeta?.lastReadCfi}
        settings={readerSettings}
        highlights={highlights}
        cursorHidden={cursorHidden && !showHud && activeOverlay === 'none' && !selectedData}
        isShortLandscape={isShortLandscape}
        onKeyDown={handleKeyDown}
        onIframeMouseMove={registerPointerActivity}
        onUserInteraction={registerPointerActivity}
        onToggleMenu={handleToggleHud}
        onNavigationLoaded={(loadedToc) => Array.isArray(loadedToc) && setToc(loadedToc)}
        onLocationChange={handleLocationChange}
        onTextSelect={(data) => { session.registerActivity(); setSelectedData(data); }}
      />

      <ReaderFooter
        showHud={showHud}
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        isShortLandscape={isShortLandscape}
        selectedData={selectedData}
        pct={pct}
        pageInfo={pageInfo}
        minutesLeftInChapter={session.minutesLeftInChapter}
        chapterDisplayName={currentChapter || 'Chapter'}
        chapterProgressPercent={session.chapterProgressPercent}
        endOfChapterHint={endOfChapterHint}
        handleToggleHud={handleToggleHud}
      />

      <SelectionCard
        selectedData={selectedData}
        onDismiss={() => setSelectedData(null)}
        cardPosition={selection.cardPosition}
        wordMeaning={selection.wordMeaning}
        loadingMeaning={selection.loadingMeaning}
        activeHighlightColor={activeHighlightColor}
        handlePronounce={selection.handlePronounce}
        handleAddHighlight={(text, cfi, color) => handleAddHighlight(text, cfi, color)}
        handleKeep={selection.handleKeep}
        handleCopy={selection.handleCopy}
        handleExplain={selection.handleExplain}
        handleContext={selection.handleContext}
        handleFind={selection.handleFind}
      />
    </div>
  );
}
