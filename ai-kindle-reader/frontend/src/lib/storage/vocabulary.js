import { isBrowser, vocabStore, recordWriteTimestamp } from './db';

export async function saveVocabularyWord({
  word,
  phonetic = '',
  partOfSpeech = 'word',
  definition = '',
  aiExplanation = '',
  contextSentence = '',
  bookId = null,
  bookTitle = 'Saved Book',
  cfi = null,
  chapter = '',
  ...rest
}) {
  if (!isBrowser || !vocabStore || !word) return null;
  try {
    const id = String(word).toLowerCase().trim();
    const existing = (await vocabStore.getItem(id)) || {};

    const defString = Array.isArray(definition)
      ? definition[0]
      : typeof definition === 'string'
      ? definition
      : '';

    const entry = {
      ...existing,
      id,
      word: String(word).trim(),
      phonetic: phonetic || existing.phonetic || '',
      partOfSpeech: partOfSpeech || existing.partOfSpeech || 'word',
      definition: defString || existing.definition || '',
      definitions: Array.isArray(definition)
        ? definition
        : [defString || existing.definition || ''],
      aiExplanation: aiExplanation || existing.aiExplanation || '',
      contextSentence: contextSentence || existing.contextSentence || '',
      quote: contextSentence || existing.quote || '',
      bookId: bookId || existing.bookId || null,
      bookTitle: bookTitle || existing.bookTitle || 'Saved Book',
      cfi: cfi || rest.cfiRange || existing.cfi || null,
      chapter: chapter || existing.chapter || '',
      mastered: existing.mastered || false,
      reviewCount: existing.reviewCount || 0,
      rememberedCount: existing.rememberedCount || 0,
      nextReviewDate: rest.nextReviewDate ?? existing.nextReviewDate ?? Date.now(),
      savedAt: existing.savedAt || Date.now(),
      createdAt: existing.createdAt || Date.now(),
      ...rest,
    };
    await vocabStore.setItem(id, entry);
    recordWriteTimestamp();
    return entry;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving vocabulary word:', err);
    return null;
  }
}

export async function getAllVocabulary() {
  if (!isBrowser || !vocabStore) return [];
  try {
    const words = [];
    await vocabStore.iterate((val) => {
      words.push(val);
    });
    return words.sort(
      (a, b) => (b.savedAt || b.createdAt || 0) - (a.savedAt || a.createdAt || 0)
    );
  } catch (err) {
    console.warn('[KindleAIReader DB] Error fetching vocabulary:', err);
    return [];
  }
}

export const getAllVocabularyWords = getAllVocabulary;

export async function deleteVocabularyWord(wordId) {
  if (!isBrowser || !vocabStore) return false;
  try {
    await vocabStore.removeItem(String(wordId).toLowerCase().trim());
    recordWriteTimestamp();
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error deleting vocabulary word:', err);
    return false;
  }
}

export async function updateVocabularyCardReview(wordId, wasRemembered) {
  if (!isBrowser || !vocabStore) return null;
  try {
    const id = String(wordId).toLowerCase().trim();
    const card = await vocabStore.getItem(id);
    if (!card) return null;

    const reviewCount = (card.reviewCount || 0) + 1;
    const rememberedCount = (card.rememberedCount || 0) + (wasRemembered ? 1 : 0);
    const intervalDays = wasRemembered ? Math.min(30, Math.pow(2, rememberedCount)) : 1;
    const nextReviewDate = Date.now() + intervalDays * 86400000;

    const updated = {
      ...card,
      reviewCount,
      rememberedCount,
      lastReviewed: Date.now(),
      nextReviewDate,
      mastered: rememberedCount >= 3,
    };
    await vocabStore.setItem(id, updated);
    recordWriteTimestamp();
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error updating card review:', err);
    return null;
  }
}
