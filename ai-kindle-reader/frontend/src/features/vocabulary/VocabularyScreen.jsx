'use client';

import { useState, useEffect } from 'react';
import { speakWord } from './lib/vocabulary-helpers';
import { useVocabularyData } from './hooks/useVocabularyData';
import { SearchAndFilter } from './components/SearchAndFilter';
import { RecallDeck } from './components/RecallDeck';
import { WordListTable } from './components/WordListTable';
import { DeleteWordModal } from './components/DeleteWordModal';
import { AddWordModal } from './components/AddWordModal';
import { QuizModal } from './components/QuizModal';
import { pluralize } from '@/lib/format';
import AiDrawer from '@/components/AiDrawer';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';

export function VocabularyScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    words,
    loading,
    error,
    loadVaultVocab,
    searchQuery,
    setSearchQuery,
    selectedBook,
    setSelectedBook,
    bookFilterChips,
    dueCards,
    activeRecallCard,
    filteredLexicon,
    handleRecallAction,
    handleOpenInReader,
    deleteConfirmId,
    setDeleteConfirmId,
    handleDeleteWord,
    addModal,
    aiWord,
    setAiWord,
    showToast,
    quiz,
  } = useVocabularyData();

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="PERSONAL LEXICON"
        title="Vocabulary"
        description={`${pluralize(words.length, 'saved term')} & contextual definitions`}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={quiz.handleStartQuiz}
              disabled={words.length === 0}
              icon="psychology"
              aria-label="Quiz Mode"
            >
              <span className="hidden sm:inline">Quiz</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                addModal.setLookupMessage('');
                addModal.setAddModalOpen(true);
              }}
              icon="add"
              aria-label="Add Word"
            >
              <span className="hidden sm:inline">Add Word</span>
            </Button>
          </div>
        }
      />

      {/* Search & Topic Filters */}
      <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        wordsCount={words.length}
        bookFilterChips={bookFilterChips}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
      />

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon="error_outline"
          title="Lexicon unavailable"
          description={error}
          action={
            <Button variant="primary" onClick={loadVaultVocab} icon="refresh">
              Retry
            </Button>
          }
        />
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          <div className="border border-hairline bg-surface rounded-[12px] p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border border-hairline bg-surface rounded-[12px] p-4 space-y-2.5"
              >
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Memory Recall Card */}
          <RecallDeck
            activeRecallCard={activeRecallCard}
            dueCardsCount={dueCards.length}
            onSpeak={(term) => speakWord(term, showToast)}
            onOpenInReader={handleOpenInReader}
            onRecallAction={handleRecallAction}
          />

          {/* Saved Lexicon List */}
          <WordListTable
            filteredLexicon={filteredLexicon}
            searchQuery={searchQuery}
            onResetFilters={() => {
              setSearchQuery('');
              setSelectedBook('All Books');
            }}
            onOpenAddModal={() => addModal.setAddModalOpen(true)}
            onSpeak={(term) => speakWord(term, showToast)}
            onOpenInReader={handleOpenInReader}
            onOpenAiMargin={(entry) => setAiWord(entry)}
            onDeleteRequest={(id) => setDeleteConfirmId(id)}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteWordModal
        deleteConfirmId={deleteConfirmId}
        words={words}
        onClose={() => setDeleteConfirmId(null)}
        onDelete={handleDeleteWord}
      />

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={addModal.addModalOpen}
        onClose={() => addModal.setAddModalOpen(false)}
        addWord={addModal.addWord}
        setAddWord={addModal.setAddWord}
        addPhonetic={addModal.addPhonetic}
        setAddPhonetic={addModal.setAddPhonetic}
        addPartOfSpeech={addModal.addPartOfSpeech}
        setAddPartOfSpeech={addModal.setAddPartOfSpeech}
        addDefinition={addModal.addDefinition}
        setAddDefinition={addModal.setAddDefinition}
        addSentence={addModal.addSentence}
        setAddSentence={addModal.setAddSentence}
        lookingUp={addModal.lookingUp}
        lookupMessage={addModal.lookupMessage}
        onLookup={addModal.handleLookupDictionary}
        onSubmit={addModal.handleAddWordSubmit}
      />

      {/* Quiz Modal */}
      <QuizModal
        isOpen={quiz.quizModeOpen}
        onClose={() => quiz.setQuizModeOpen(false)}
        activeQuizCard={quiz.activeQuizCard}
        quizIndex={quiz.quizIndex}
        totalWords={words.length}
        quizFlipped={quiz.quizFlipped}
        setQuizFlipped={quiz.setQuizFlipped}
        quizFinished={quiz.quizFinished}
        quizStats={quiz.quizStats}
        onQuizAnswer={quiz.handleQuizAnswer}
      />

      {/* AI Margin Drawer */}
      {aiWord && (
        <AiDrawer
          activeItem={{
            type: 'word',
            word: aiWord.word,
            definition: aiWord.definition,
            sentence: aiWord.contextSentence,
            bookTitle: aiWord.bookTitle,
          }}
          onClose={() => setAiWord(null)}
        />
      )}
    </div>
  );
}
