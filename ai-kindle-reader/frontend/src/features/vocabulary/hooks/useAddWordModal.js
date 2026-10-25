'use client';

import { useState } from 'react';
import { saveVocabularyWord } from '@/lib/storage';
import { lookupWord } from '@/lib/api';

export function useAddWordModal({ storedBooks = [], onWordAdded, showToast }) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addWord, setAddWord] = useState('');
  const [addPhonetic, setAddPhonetic] = useState('');
  const [addPartOfSpeech, setAddPartOfSpeech] = useState('noun');
  const [addDefinition, setAddDefinition] = useState('');
  const [addSentence, setAddSentence] = useState('');
  const [addBookId, setAddBookId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  const resetForm = () => {
    setAddWord('');
    setAddPhonetic('');
    setAddPartOfSpeech('noun');
    setAddDefinition('');
    setAddSentence('');
    setAddBookId('');
    setLookupMessage('');
  };

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
      onWordAdded?.(created || newRecord);
      setAddModalOpen(false);
      resetForm();
      showToast?.(`Added “${newRecord.word}” to lexicon`);
    } catch (err) {
      showToast?.('Error saving word: ' + err.message);
    }
  };

  return {
    addModalOpen,
    setAddModalOpen,
    addWord,
    setAddWord,
    addPhonetic,
    setAddPhonetic,
    addPartOfSpeech,
    setAddPartOfSpeech,
    addDefinition,
    setAddDefinition,
    addSentence,
    setAddSentence,
    addBookId,
    setAddBookId,
    lookingUp,
    lookupMessage,
    setLookupMessage,
    handleLookupDictionary,
    handleAddWordSubmit,
  };
}
