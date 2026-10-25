"use client";

import React from "react";
import { pluralize } from "@/lib/format";

/**
 * Desktop & responsive reader page furniture (running head & footer page counts)
 * Muted, 12px, tabular numbers matching Flyleaf design tokens.
 */
export default function PageFurniture({
  isTwoPage = false,
  bookTitle = "",
  chapterTitle = "",
  currentPage = 1,
  totalPages = 1,
  pagesLeftInChapter = 0,
  isLastPageInChapter = false,
  showToolbar = false,
  showHud = false,
  pageWidth = 1200,
}) {
  const isHidden = showToolbar || showHud;
  const runningHeadText = chapterTitle || bookTitle || "";

  // Right footer text calculation
  let rightFooterText = "";
  if (isLastPageInChapter || pagesLeftInChapter <= 0) {
    rightFooterText = "Last page in chapter";
  } else {
    rightFooterText = `${pluralize(pagesLeftInChapter, "page")} left in chapter`;
  }

  // Left page number in two-page spread: currentPage is the first of the two facing pages
  const leftPageNum = currentPage || 1;
  const leftFooterText = `${leftPageNum} of ${totalPages || 1}`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-10"
    >
      {/* Centered Running Head (Top Margin) - hides when toolbar is visible to prevent overlap */}
      {runningHeadText && (
        <div
          className={`absolute top-4 left-0 right-0 flex justify-center px-8 transition-opacity duration-200 ${
            isHidden ? "opacity-0" : "opacity-100"
          }`}
        >
          <p
            style={{ color: "var(--reader-muted)" }}
            className="font-label-sm text-[12px] tracking-wide truncate max-w-xl text-center opacity-75"
          >
            {runningHeadText}
          </p>
        </div>
      )}

      {/* Bottom Page Furniture (Bottom Margin) - only hides on mobile if bottom nav is open, stays visible on desktop */}
      <div
        className={`absolute bottom-4 left-0 right-0 flex justify-center px-8 transition-opacity duration-200 ${
          isHidden ? "max-md:opacity-0" : "opacity-100"
        }`}
      >
        <div
          style={{ width: `${pageWidth}px` }}
          className="flex items-center justify-between px-2 max-w-full"
        >
          {isTwoPage ? (
            <>
              {/* Left page footer */}
              <div className="w-1/2 flex justify-start pl-2">
                <span
                  style={{ color: "var(--reader-muted)" }}
                  className="font-label-sm text-[12px] tabular-nums tracking-normal opacity-75"
                >
                  {leftFooterText}
                </span>
              </div>

              {/* Right page footer */}
              <div className="w-1/2 flex justify-end pr-2">
                <span
                  style={{ color: "var(--reader-muted)" }}
                  className="font-label-sm text-[12px] tabular-nums tracking-normal opacity-75"
                >
                  {rightFooterText}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span
                style={{ color: "var(--reader-muted)" }}
                className="font-label-sm text-[12px] tabular-nums tracking-normal opacity-75"
              >
                {leftFooterText}
              </span>
              <span
                style={{ color: "var(--reader-muted)" }}
                className="font-label-sm text-[12px] tabular-nums tracking-normal opacity-75"
              >
                {rightFooterText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
