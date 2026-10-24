"use client";

import React, { useRef, useEffect, useState } from "react";

/**
 * Contents Popover anchored under the Contents toolbar button.
 * 360px wide, max 70vh, scrollable, with chapter list and current chapter highlighted.
 */
export default function ContentsPopover({
  isOpen,
  onClose,
  toc = [],
  currentChapter = "",
  onSelectChapter,
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
      aria-label="Table of contents"
      style={{
        backgroundColor: "var(--reader-bg, #FAF9F6)",
        borderColor: "var(--reader-border, rgba(0,0,0,0.15))",
        color: "var(--reader-fg, #152A41)",
        top: coords ? `${coords.top}px` : undefined,
        left: coords ? `${coords.left}px` : undefined,
      }}
      className="fixed top-14 left-4 sm:left-14 z-50 w-[360px] max-w-[calc(100vw-32px)] max-h-[70vh] flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
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
            menu_book
          </span>
          <h3
            style={{ color: "var(--reader-fg, #152A41)" }}
            className="font-headline-sm text-sm font-semibold tracking-tight"
          >
            Contents
          </h3>
          <span
            style={{ color: "var(--reader-muted, #727782)" }}
            className="text-[11px] font-label-sm"
          >
            ({toc.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close contents"
          style={{ color: "var(--reader-muted, #727782)" }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Chapters Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 divide-y divide-black/5 dark:divide-white/5">
        {toc && toc.length > 0 ? (
          toc.map((item, idx) => {
            const label = item.label?.trim() || `Chapter ${idx + 1}`;
            const isCurrent =
              currentChapter &&
              (label.toLowerCase() === currentChapter.toLowerCase() ||
                currentChapter.toLowerCase().includes(label.toLowerCase()) ||
                label.toLowerCase().includes(currentChapter.toLowerCase()));

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (onSelectChapter) onSelectChapter(item.href);
                  onClose();
                }}
                style={{
                  backgroundColor: isCurrent ? "var(--reader-accent-alpha, rgba(133,82,36,0.12))" : "transparent",
                  color: isCurrent ? "var(--reader-accent, #855224)" : "var(--reader-fg, #152A41)",
                }}
                className={`w-full text-left py-2.5 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.99] transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isCurrent ? "font-semibold" : "font-normal"
                }`}
              >
                <span className="font-body-ui text-xs truncate max-w-[240px] pr-2">
                  {label}
                </span>

                {item.page ? (
                  <span
                    style={{ color: isCurrent ? "var(--reader-accent)" : "var(--reader-muted)" }}
                    className="font-label-sm text-[11px] tabular-nums shrink-0"
                  >
                    {item.page}
                  </span>
                ) : (
                  <span
                    style={{ color: "var(--reader-muted)" }}
                    className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    arrow_forward
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <p
              style={{ color: "var(--reader-muted)" }}
              className="font-body-ui text-xs"
            >
              No chapter index available in this book.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
