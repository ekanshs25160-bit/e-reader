'use client';

import { useState, useEffect, useCallback } from 'react';
import { lookupWord } from '@/lib/api';
import { saveVocabularyWord } from '@/lib/storage';

export function useSelectionCard({
  bookId,
  bookMeta,
  currentCfi,
  currentChapter,
  showToast,
  setActiveOverlay,
  setAiInitialTab,
  handleAddHighlight,
}) {
  const [selectedData, setSelectedData] = useState(null);
  const [wordMeaning, setWordMeaning] = useState(null);
  const [loadingMeaning, setLoadingMeaning] = useState(false);

  // Position calculation
  const [cardPosition, setCardPosition] = useState({
    mode: 'fixed',
    left: 0,
    top: 0,
    width: 320,
    isAbove: false,
  });

  useEffect(() => {
    if (!selectedData) {
      setWordMeaning(null);
      return;
    }

    const rect = selectedData.selectionRect;
    if (rect && typeof window !== 'undefined') {
      const cardWidth = Math.min(360, window.innerWidth - 32);
      const centerX = rect.left + rect.width / 2;
      let left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, centerX - cardWidth / 2));
      const spaceBelow = window.innerHeight - rect.bottom;
      const isAbove = spaceBelow < 280 && rect.top > 280;
      const top = isAbove ? Math.max(16, rect.top - 260) : Math.min(window.innerHeight - 260, rect.bottom + 12);

      setCardPosition({
        mode: 'anchored',
        left,
        top,
        width: cardWidth,
        isAbove,
      });
    } else {
      setCardPosition({ mode: 'fixed', left: 0, top: 0, width: 320, isAbove: false });
    }

    const cleanWord = selectedData.text?.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (cleanWord && cleanWord.split(/\s+/).length <= 2) {
      setLoadingMeaning(true);
      lookupWord(cleanWord)
        .then((res) => setWordMeaning(res))
        .catch(() => setWordMeaning(null))
        .finally(() => setLoadingMeaning(false));
    } else {
      setWordMeaning(null);
    }
  }, [selectedData]);

  const handlePronounce = useCallback(() => {
    const textToSpeak = wordMeaning?.word || selectedData?.text?.trim().split(/\s+/)[0];
    if (!textToSpeak) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.speak(utterance);
    }
  }, [wordMeaning, selectedData]);

  const handleCopy = useCallback(() => {
    if (!selectedData?.text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(selectedData.text);
      showToast?.('Copied to clipboard');
      setSelectedData(null);
    }
  }, [selectedData, showToast]);

  const handleExplain = useCallback(() => {
    setAiInitialTab?.('subtext');
    setActiveOverlay?.('ai');
  }, [setAiInitialTab, setActiveOverlay]);

  const handleContext = useCallback(() => {
    setAiInitialTab?.('author');
    setActiveOverlay?.('ai');
  }, [setAiInitialTab, setActiveOverlay]);

  const handleFind = useCallback(() => {
    if (selectedData?.text) {
      const query = selectedData.text.trim();
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      if (typeof window !== 'undefined') {
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
      }
      setSelectedData(null);
    }
  }, [selectedData]);

  const handleKeep = async () => {
    if (!selectedData?.text) return;
    if (wordMeaning) {
      await saveVocabularyWord({
        word: wordMeaning.word,
        phonetic: wordMeaning.phonetic || '',
        partOfSpeech: wordMeaning.partOfSpeech || 'word',
        definition: wordMeaning.definition,
        contextSentence: selectedData.contextSentence || selectedData.text,
        quote: selectedData.contextSentence || selectedData.text,
        bookId,
        bookTitle: bookMeta?.title || 'Book',
        cfi: selectedData.cfiRange || currentCfi || null,
        chapter: currentChapter || bookMeta?.currentChapter || '',
      });
      showToast?.('Saved to Vocabulary');
    } else if (handleAddHighlight) {
      await handleAddHighlight('var(--reader-accent)');
    }
    setSelectedData(null);
  };

  return {
    selectedData,
    setSelectedData,
    wordMeaning,
    loadingMeaning,
    cardPosition,
    handlePronounce,
    handleCopy,
    handleExplain,
    handleContext,
    handleFind,
    handleKeep,
  };
}
