'use client';

import SelectionQuickActions from './SelectionQuickActions';

export default function SelectionCard({
  selectedData,
  onDismiss,
  cardPosition,
  wordMeaning,
  loadingMeaning,
  activeHighlightColor,
  handlePronounce,
  handleAddHighlight,
  handleKeep,
  handleCopy,
  handleExplain,
  handleContext,
  handleFind,
}) {
  if (!selectedData?.text) return null;

  const isWord = selectedData.text.trim().split(/\s+/).length <= 2;

  return (
    <section
      style={
        cardPosition.mode === 'anchored'
          ? {
              position: 'fixed',
              left: `${cardPosition.left}px`,
              top: `${cardPosition.top}px`,
              width: `${cardPosition.width}px`,
              zIndex: 40,
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-fg)',
            }
          : {
              backgroundColor: 'var(--reader-bg)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-fg)',
            }
      }
      className={`${
        cardPosition.mode === 'anchored'
          ? 'rounded-xl backdrop-blur-xl border editorial-shadow transition-all duration-150 overflow-hidden text-left shadow-2xl'
          : 'fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm rounded-xl backdrop-blur-xl border editorial-shadow transition-all duration-200 overflow-hidden text-left shadow-2xl'
      }`}
    >
      <div
        style={{
          backgroundColor: 'var(--reader-bg)',
          borderColor: 'var(--reader-border)',
        }}
        className={`w-3 h-3 border-t border-l transform rotate-45 shadow-sm ${
          cardPosition.mode === 'anchored' && cardPosition.isAbove
            ? 'hidden'
            : 'mx-auto -mt-1.5'
        }`}
      />

      {/* Header */}
      <div style={{ borderColor: 'var(--reader-border)' }} className="px-4 pt-3 pb-3 border-b">
        {isWord ? (
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2 truncate pr-2">
              <span
                style={{ color: 'var(--reader-fg)' }}
                className="font-headline-md text-headline-sm font-medium tracking-tight truncate max-w-[170px]"
              >
                {wordMeaning?.word || selectedData.text}
              </span>
              {wordMeaning?.phonetic && (
                <span style={{ color: 'var(--reader-muted)' }} className="text-caption font-mono">
                  {wordMeaning.phonetic}
                </span>
              )}
              {wordMeaning && (
                <button
                  type="button"
                  onClick={handlePronounce}
                  aria-label="Listen to pronunciation"
                  style={{ color: 'var(--reader-muted)' }}
                  className="hover:opacity-80 transition-opacity p-1 rounded-full inline-flex items-center min-w-[28px] min-h-[28px] justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]" data-icon="volume_up">
                    volume_up
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                style={{ backgroundColor: 'var(--reader-border)', color: 'var(--reader-fg)' }}
                className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase font-medium"
              >
                {wordMeaning?.partOfSpeech || 'word'}
              </span>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss selection"
                style={{ color: 'var(--reader-muted)' }}
                className="hover:opacity-80 transition-opacity p-1.5 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]" data-icon="close">
                  close
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--reader-accent)' }}>
              <span className="material-symbols-outlined text-[16px]" data-icon="format_quote">
                format_quote
              </span>
              <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold">
                Highlighted Passage
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                style={{ backgroundColor: 'var(--reader-border)', color: 'var(--reader-fg)' }}
                className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase font-medium"
              >
                {selectedData.text.trim().split(/\s+/).length} words
              </span>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss selection"
                style={{ color: 'var(--reader-muted)' }}
                className="hover:opacity-80 transition-opacity p-1.5 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]" data-icon="close">
                  close
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Content body */}
        {isWord ? (
          loadingMeaning ? (
            <div style={{ color: 'var(--reader-muted)' }} className="py-2.5 flex items-center gap-2 text-caption font-sans">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Looking up definition…</span>
            </div>
          ) : wordMeaning?.definitions?.length > 0 ? (
            <ol
              style={{ color: 'var(--reader-muted)' }}
              className="mt-2.5 space-y-1.5 text-caption font-body-ui list-decimal list-inside leading-snug max-h-28 overflow-y-auto"
            >
              {wordMeaning.definitions.map((def, idx) => (
                <li key={idx}>
                  <span style={{ color: 'var(--reader-fg)' }} className="font-medium">{def.split(' ')[0]}</span>{' '}
                  <span>{def.split(' ').slice(1).join(' ')}</span>
                </li>
              ))}
            </ol>
          ) : wordMeaning?.definition ? (
            <p style={{ color: 'var(--reader-muted)' }} className="mt-2 text-caption font-body-ui leading-snug">
              {wordMeaning.definition}
            </p>
          ) : (
            <p style={{ color: 'var(--reader-muted)' }} className="mt-2 text-caption font-body-ui leading-snug italic">
              “{selectedData.text}”
            </p>
          )
        ) : (
          <div className="mt-2 max-h-24 overflow-y-auto hide-scrollbar">
            <p
              style={{ color: 'var(--reader-fg)' }}
              className="font-body-reading text-[13.5px] leading-[22px] italic select-text text-left"
            >
              “{selectedData.text.trim().replace(/^["“'”]+|["“'”]+$/g, '').trim()}”
            </p>
          </div>
        )}
      </div>

      {/* Swatches & Underline */}
      <div style={{ borderColor: 'var(--reader-border)' }} className="px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span style={{ color: 'var(--reader-muted)' }} className="font-label-sm text-caption tracking-wider uppercase text-[10px]">
            Highlight
          </span>
          <div className="flex items-center space-x-0.5 ml-1">
            <button
              type="button"
              onClick={() => handleAddHighlight?.(selectedData.text, selectedData.cfiRange, 'var(--reader-accent)')}
              aria-label="Highlight passage"
              title="Highlight passage"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span
                className={`w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-xs transition-transform ${
                  activeHighlightColor === 'var(--reader-accent)' ? 'border-2 border-ink' : 'border border-hairline'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-background font-bold" data-icon="check">
                  check
                </span>
              </span>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleAddHighlight?.(selectedData.text, selectedData.cfiRange, 'underline')}
          aria-label="Underline text"
          style={{
            backgroundColor: 'var(--reader-border)',
            borderColor: 'var(--reader-border)',
            color: 'var(--reader-fg)',
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="font-headline-sm text-label-md underline font-semibold leading-none">U</span>
        </button>
      </div>

      {/* 5-Column Quick Actions */}
      <SelectionQuickActions
        handleKeep={handleKeep}
        handleCopy={handleCopy}
        handleExplain={handleExplain}
        handleContext={handleContext}
        handleFind={handleFind}
      />
    </section>
  );
}
