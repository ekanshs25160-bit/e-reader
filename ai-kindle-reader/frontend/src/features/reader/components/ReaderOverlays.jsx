'use client';

import ContentsPopover from './ContentsPopover';
import HighlightsPopover from './HighlightsPopover';
import SettingsMenu from './SettingsMenu';
import { AiDrawer } from '@/features/ai';

export default function ReaderOverlays({
  activeOverlay,
  setActiveOverlay,
  toc,
  currentChapter,
  canvasRef,
  contentsBtnRef,
  highlightsBtnRef,
  highlights,
  handleDeleteHighlight,
  readerSettings,
  handleSettingsChange,
  selectedData,
  setSelectedData,
  aiInitialTab,
  bookMeta,
  bookId,
  showToast,
}) {
  return (
    <>
      <ContentsPopover
        isOpen={activeOverlay === 'contents'}
        onClose={() => setActiveOverlay('none')}
        toc={toc}
        currentChapter={currentChapter}
        onSelectChapter={(href) => {
          canvasRef.current?.goToCfi?.(href);
          setActiveOverlay('none');
        }}
        anchorRef={contentsBtnRef}
      />

      <HighlightsPopover
        isOpen={activeOverlay === 'highlights'}
        onClose={() => setActiveOverlay('none')}
        highlights={highlights}
        onSelectHighlight={(cfi) => {
          canvasRef.current?.goToCfi?.(cfi);
          setActiveOverlay('none');
        }}
        onDeleteHighlight={handleDeleteHighlight}
        anchorRef={highlightsBtnRef}
      />

      <SettingsMenu
        open={activeOverlay === 'settings'}
        onClose={() => setActiveOverlay('none')}
        settings={readerSettings}
        onChangeSettings={handleSettingsChange}
      />

      {activeOverlay === 'ai' && (
        <AiDrawer
          isOpen={true}
          open={true}
          onClose={() => {
            setActiveOverlay('none');
            setSelectedData?.(null);
          }}
          selectedText={selectedData?.text || ''}
          initialTab={aiInitialTab}
          bookTitle={bookMeta?.title || 'Current Book'}
          author={bookMeta?.author || 'Unknown Author'}
          currentChapter={currentChapter}
          bookId={bookId}
          canvasRef={canvasRef}
          onShowToast={showToast}
        />
      )}
    </>
  );
}
