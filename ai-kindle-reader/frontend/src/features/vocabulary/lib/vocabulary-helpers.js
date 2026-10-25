export function speakWord(word, showToast) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
  if (showToast) {
    showToast(`Pronouncing “${word}”`);
  }
}

export function formatVocabularyItem(item) {
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
}
