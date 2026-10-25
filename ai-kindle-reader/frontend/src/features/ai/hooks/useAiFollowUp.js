'use client';

import { useState } from 'react';
import { streamAi } from '@/lib/api';

export function useAiFollowUp({
  quote,
  bookTitle,
  author,
  currentChapter,
  abortCurrentStream,
  abortControllerRef,
}) {
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUps, setFollowUps] = useState([]);

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
    } catch {
      if (!controller.signal.aborted) {
        setFollowUps((prev) =>
          prev.map((item) =>
            item.id === followUpId
              ? {
                  ...item,
                  isStreaming: false,
                  error: 'Follow-up request failed',
                }
              : item
          )
        );
      }
    }
  };

  return {
    followUpInput,
    setFollowUpInput,
    followUps,
    setFollowUps,
    handleSendFollowUp,
  };
}
