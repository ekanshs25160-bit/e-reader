'use client';

import { useState, useEffect, useRef } from 'react';
import { useDictionaryLookup } from './useDictionaryLookup';
import { useAiFollowUp } from './useAiFollowUp';
import { useStreamTabs } from './useStreamTabs';
import { saveVocabularyWord } from '@/lib/storage';

export function useAiAssistant({
  quote,
  bookTitle,
  bookId,
  author,
  currentChapter,
  canvasRef,
  onShowToast,
  isDrawerOpen,
  initialTab = 'subtext',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [spoilersOff, setSpoilersOff] = useState(true);
  const [savedJournal, setSavedJournal] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const cleanWord = quote
    ? quote.replace(/^[“"']+|[”"'.?!,;:\s]+$/g, '').trim().split(/\s+/)[0] || 'word'
    : 'word';
  const isShortSnippet = quote ? quote.trim().split(/\s+/).length <= 3 : false;

  const streamTabs = useStreamTabs({
    quote,
    bookTitle,
    author,
    currentChapter,
    canvasRef,
  });

  const dict = useDictionaryLookup({ cleanWord, isDrawerOpen, activeTab });

  const followUp = useAiFollowUp({
    quote,
    bookTitle,
    author,
    currentChapter,
    abortCurrentStream: streamTabs.abortCurrentStream,
    abortControllerRef: streamTabs.abortControllerRef,
  });

  const handleSaveToJournal = async () => {
    const wordKey = cleanWord;
    const def =
      streamTabs.tabState[activeTab]?.text?.slice(0, 200) ||
      dict.dictResult?.definition?.[0] ||
      'Passage and companion marginalia saved from reading session';

    await saveVocabularyWord({
      word: wordKey,
      phonetic: dict.dictResult?.phonetic || '/—/',
      partOfSpeech: 'journal',
      definitions: [def],
      quote: quote.slice(0, 500),
      bookTitle,
      bookId,
      chapter: currentChapter,
    });

    setSavedJournal(true);
    if (onShowToast) onShowToast('Saved passage to your Reading Journal');
    setTimeout(() => setSavedJournal(false), 2500);
  };

  const handleKeepAsNote = async () => {
    const noteText = streamTabs.tabState[activeTab]?.text || quote || 'Marginalia note on passage';
    await saveVocabularyWord({
      word: cleanWord || 'Note',
      phonetic: '/note/',
      partOfSpeech: 'marginalia',
      definitions: [noteText.slice(0, 400)],
      quote: quote.slice(0, 500),
      bookTitle,
      bookId,
      chapter: currentChapter,
    });

    setSavedNote(true);
    if (onShowToast) onShowToast('Pinned note to margin vault');
    setTimeout(() => setSavedNote(false), 2500);
  };

  const handleShare = () => {
    const textToCopy = streamTabs.tabState[activeTab]?.text || quote || `${bookTitle} by ${author}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    if (onShowToast) onShowToast('Insight copied to clipboard');
  };

  const handleTabChange = (newTab) => {
    if (newTab === 'journal') {
      handleSaveToJournal();
      return;
    }
    streamTabs.abortCurrentStream();
    setActiveTab(newTab);
    if (newTab !== 'define') {
      const existing = streamTabs.tabState[newTab];
      if (!existing?.text && !existing?.isStreaming) {
        streamTabs.startStreamForTab(newTab);
      }
    }
  };

  const prevQuoteRef = useRef(quote);
  useEffect(() => {
    if (!isDrawerOpen) {
      streamTabs.abortCurrentStream();
      return;
    }

    if (prevQuoteRef.current !== quote) {
      prevQuoteRef.current = quote;
      streamTabs.setTabState({
        subtext: { text: '', isStreaming: false, error: null },
        summary: { text: '', isStreaming: false, error: null },
        author: { text: '', isStreaming: false, error: null },
      });
      followUp.setFollowUps([]);
    }

    if (activeTab !== 'define' && activeTab !== 'journal') {
      const current = streamTabs.tabState[activeTab];
      if (!current?.text && !current?.isStreaming && !current?.error) {
        streamTabs.startStreamForTab(activeTab);
      }
    }
  }, [isDrawerOpen, quote, activeTab, streamTabs, followUp]);

  return {
    activeTab,
    handleTabChange,
    spoilersOff,
    setSpoilersOff,
    savedJournal,
    savedNote,
    tabState: streamTabs.tabState,
    cleanWord,
    isShortSnippet,
    dict,
    followUp,
    startStreamForTab: streamTabs.startStreamForTab,
    abortCurrentStream: streamTabs.abortCurrentStream,
    handleKeepAsNote,
    handleShare,
  };
}
