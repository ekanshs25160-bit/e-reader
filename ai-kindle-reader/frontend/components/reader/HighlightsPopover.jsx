"use client";

import React, { useRef, useEffect, useState } from "react";

/**
 * Highlights & Notes Popover anchored under the Highlights toolbar button.
 * 360px wide, max 70vh, scrollable, with saved highlights and empty state.
 */
export default function HighlightsPopover({
  isOpen,
  onClose,
  highlights = [],
  onSelectHighlight,
  onDeleteHighlight,
  anchorRef,
}) {
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const left = Math.max(16, Math.min(window.innerWidth - 376, rect.left));
      const top = rect.bottom + 8;
      setCoords({ top, left });
    }
  }, [isOpen, anchorRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Highlights and notes"
      style={{
        backgroundColor: "var(--reader-bg, #FAF9F6)",
        borderColor: "var(--reader-border, rgba(0,0,0,0.15))",
        color: "var(--reader-fg, #152A41)",
        top: coords ? `${coords.top}px` : undefined,
        left: coords ? `${coords.left}px` : undefined,
      }}
      className="fixed top-14 left-10 sm:left-24 z-50 w-[360px] max-w-[calc(100vw-32px)] max-h-[70vh] flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Popover Header */}
      <div
        style={{ borderColor: "var(--reader-border, rgba(0,0,0,0.1))" }}
        className="px-4 py-3 border-b flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-2">
          <span
            style={{ color: "var(--reader-fg, #152A41)" }}
            className="material-symbols-outlined text-[18px]"
          >
            rate_review
          </span>
          <h3
            style={{ color: "var(--reader-fg, #152A41)" }}
            className="font-headline-sm text-sm font-semibold tracking-tight"
          >
            Highlights & Notes
          </h3>
          <span
            style={{ color: "var(--reader-muted, #727782)" }}
            className="text-[11px] font-label-sm"
          >
            ({highlights.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close highlights"
          style={{ color: "var(--reader-muted, #727782)" }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Highlights Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {highlights && highlights.length > 0 ? (
          highlights.map((hl, idx) => (
            <div
              key={hl.id || idx}
              onClick={() => {
                if (onSelectHighlight) onSelectHighlight(hl.cfi || hl.cfiRange);
                onClose();
              }}
              style={{
                borderColor: "var(--reader-border, rgba(0,0,0,0.08))",
              }}
              className="group p-3 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all active:scale-[0.99] relative flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                    style={{ backgroundColor: hl.color || "#F3D382" }}
                  />
                  {hl.chapter && (
                    <span
                      style={{ color: "var(--reader-muted, #727782)" }}
                      className="font-label-sm text-[10px] uppercase tracking-wider truncate max-w-[180px]"
                    >
                      {hl.chapter}
                    </span>
                  )}
                </div>

                {onDeleteHighlight && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHighlight(hl.id);
                    }}
                    aria-label="Delete highlight"
                    style={{ color: "var(--reader-muted)" }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                )}
              </div>

              <p
                style={{ color: "var(--reader-fg, #152A41)" }}
                className="font-body-reading text-xs line-clamp-3 leading-relaxed italic"
              >
                &ldquo;{hl.text || hl.selectedText}&rdquo;
              </p>

              {hl.note && (
                <p
                  style={{ color: "var(--reader-accent, #855224)" }}
                  className="font-body-ui text-[11px] font-medium mt-1 line-clamp-2"
                >
                  Note: {hl.note}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
              <span
                style={{ color: "var(--reader-muted, #727782)" }}
                className="material-symbols-outlined text-[20px]"
              >
                edit_note
              </span>
            </div>
            <p
              style={{ color: "var(--reader-muted, #727782)" }}
              className="font-body-ui text-xs leading-relaxed max-w-[240px] mx-auto"
            >
              No highlights or notes yet. Select text to add one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
