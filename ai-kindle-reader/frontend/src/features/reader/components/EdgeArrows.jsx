"use client";

import React from "react";

/**
 * Desktop side-margin edge navigation arrows.
 * Thin ‹ and › buttons vertically centered in the margin, fade in on hover, disabled at book start/end.
 */
export default function EdgeArrows({
  onPrev,
  onNext,
  isAtStart = false,
  isAtEnd = false,
  isMouseInWindow = true,
}) {
  return (
    <div
      aria-hidden="false"
      className={`transition-opacity duration-300 ${
        isMouseInWindow ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Left Margin: Previous Page Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isAtStart && onPrev) onPrev();
        }}
        disabled={isAtStart}
        aria-label="Previous page (Left arrow)"
        title="Previous page (Left arrow)"
        style={{
          color: "var(--reader-fg)",
        }}
        className={`fixed left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${
            isAtStart
              ? "opacity-20 cursor-not-allowed pointer-events-none"
              : "opacity-40 hover:opacity-100 focus-visible:opacity-100 hover:bg-hairline/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none cursor-pointer"
          }`}
      >
        <span
          className="material-symbols-outlined text-[28px] font-light leading-none"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          chevron_left
        </span>
      </button>

      {/* Right Margin: Next Page Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isAtEnd && onNext) onNext();
        }}
        disabled={isAtEnd}
        aria-label="Next page (Right arrow)"
        title="Next page (Right arrow)"
        style={{
          color: "var(--reader-fg)",
        }}
        className={`fixed right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${
            isAtEnd
              ? "opacity-20 cursor-not-allowed pointer-events-none"
              : "opacity-40 hover:opacity-100 focus-visible:opacity-100 hover:bg-hairline/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none cursor-pointer"
          }`}
      >
        <span
          className="material-symbols-outlined text-[28px] font-light leading-none"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          chevron_right
        </span>
      </button>
    </div>
  );
}
