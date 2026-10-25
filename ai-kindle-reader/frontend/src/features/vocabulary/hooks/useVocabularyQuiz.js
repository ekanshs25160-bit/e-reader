'use client';

import { useState } from 'react';
import { updateVocabularyCardReview } from '@/lib/storage';

export function useVocabularyQuiz({ words = [], showToast }) {
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFlipped, setQuizFlipped] = useState(false);
  const [quizStats, setQuizStats] = useState({ remembered: 0, reviewSoon: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  const activeQuizCard = words.length > 0 ? words[quizIndex % words.length] : null;

  const handleStartQuiz = () => {
    if (words.length === 0) {
      showToast?.('No saved words in your vault to quiz yet');
      return;
    }
    setQuizIndex(0);
    setQuizFlipped(false);
    setQuizStats({ remembered: 0, reviewSoon: 0 });
    setQuizFinished(false);
    setQuizModeOpen(true);
  };

  const handleQuizAnswer = async (wasRemembered) => {
    if (activeQuizCard?.id) {
      await updateVocabularyCardReview(activeQuizCard.id, wasRemembered);
    }

    setQuizStats((prev) => ({
      remembered: prev.remembered + (wasRemembered ? 1 : 0),
      reviewSoon: prev.reviewSoon + (!wasRemembered ? 1 : 0),
    }));

    if (quizIndex + 1 >= Math.min(words.length, 10)) {
      setQuizFinished(true);
    } else {
      setQuizIndex((idx) => idx + 1);
      setQuizFlipped(false);
    }
  };

  return {
    quizModeOpen,
    setQuizModeOpen,
    quizIndex,
    quizFlipped,
    setQuizFlipped,
    quizStats,
    quizFinished,
    activeQuizCard,
    handleStartQuiz,
    handleQuizAnswer,
  };
}
