'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { streamAi } from '@/lib/api';

export function useStreamTabs({
  quote,
  bookTitle,
  author,
  currentChapter,
  canvasRef,
}) {
  const abortControllerRef = useRef(null);

  const [tabState, setTabState] = useState({
    subtext: { text: '', isStreaming: false, error: null },
    summary: { text: '', isStreaming: false, error: null },
    author: { text: '', isStreaming: false, error: null },
  });

  const abortCurrentStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortCurrentStream();
    };
  }, [abortCurrentStream]);

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
                  subtext: { ...prev.subtext, text: (prev.subtext?.text || '') + token },
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
                  summary: { ...prev.summary, text: (prev.summary?.text || '') + token },
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
                  author: { ...prev.author, text: (prev.author?.text || '') + token },
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

  return {
    tabState,
    setTabState,
    startStreamForTab,
    abortCurrentStream,
    abortControllerRef,
  };
}
