'use client';

import React from 'react';

export function InlineDropzone({
  dragActive,
  setDragActive,
  isUploading,
  error,
  onFileSelect,
}) {
  return (
    <div className="w-full">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) {
            onFileSelect(e.dataTransfer.files[0]);
          }
        }}
        className={`flex flex-col items-center justify-center w-full p-6 border border-dashed rounded-[12px] cursor-pointer transition-colors ${
          dragActive
            ? 'border-accent bg-accent/10'
            : 'border-hairline hover:border-accent bg-surface'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2.5 py-2">
            <div className="w-16 h-1 bg-hairline rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-accent animate-pulse rounded-full" />
            </div>
            <span className="text-[13.5px] font-sans font-medium text-ink">
              Saving volume to device memory…
            </span>
          </div>
        ) : (
          <>
            <span className="text-[14px] font-sans font-medium text-ink">
              + Import Local .EPUB Book
            </span>
            <span className="text-[12px] font-sans text-muted mt-1">
              Stored offline in IndexedDB
            </span>
          </>
        )}
        <input
          type="file"
          accept=".epub,application/epub+zip"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          disabled={isUploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-[12px] font-sans text-semantic-error mt-2 text-center">{error}</p>}
    </div>
  );
}

export default InlineDropzone;
