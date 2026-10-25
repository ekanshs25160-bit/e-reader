'use client';

import EdgeArrows from './EdgeArrows';
import PageFurniture from './PageFurniture';

export default function ReaderFurniture({
  pageInfo,
  currentProgress,
  isMouseInWindow,
  canvasRef,
  bookMeta,
  currentChapter,
  showToolbar,
}) {
  return (
    <>
      <EdgeArrows
        onPrev={() => canvasRef.current?.prev?.()}
        onNext={() => canvasRef.current?.next?.()}
        isAtStart={pageInfo.current <= 1 && currentProgress <= 0}
        isAtEnd={currentProgress >= 1}
        isMouseInWindow={isMouseInWindow}
      />

      <PageFurniture
        isTwoPage={false}
        bookTitle={bookMeta?.title || 'Flyleaf'}
        chapterTitle={currentChapter || ''}
        currentPage={pageInfo.current}
        totalPages={pageInfo.total}
        pagesLeftInChapter={Math.max(0, pageInfo.total - pageInfo.current)}
        isLastPageInChapter={pageInfo.current >= pageInfo.total && pageInfo.total > 1}
        showToolbar={showToolbar}
        pageWidth={704}
      />
    </>
  );
}
