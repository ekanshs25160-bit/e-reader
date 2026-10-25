'use client';

import { useState, useEffect } from 'react';
import { lookupWord } from '@/lib/api';

export function useDictionaryLookup({ cleanWord, isDrawerOpen, activeTab }) {
  const [dictLoading, setDictLoading] = useState(false);
  const [dictResult, setDictResult] = useState(null);
  const [dictError, setDictError] = useState(null);

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
      } catch {
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

  return { dictLoading, dictResult, dictError };
}
