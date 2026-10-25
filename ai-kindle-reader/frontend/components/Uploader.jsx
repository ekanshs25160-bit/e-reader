"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ePub from "epubjs";
import { saveBook } from "@/utils/db";

// Helper to convert temporary blob URL into permanent Base64 image string
async function blobUrlToBase64(blobUrl) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function Uploader({
  open,
  onClose,
  onShowToast,
  onUploadSuccess,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // If used strictly as a modal dialog and open is false, don't render
  if (open !== undefined && !open) {
    return null;
  }

  const processEpubFile = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".epub")) {
      const msg = "Please select a valid .epub file.";
      setError(msg);
      if (onShowToast) onShowToast(msg);
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // 1. Read file as ArrayBuffer so epub.js can inspect it
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);

      // 2. Extract Title & Author metadata from EPUB package
      const metadata = await book.loaded.metadata;
      const title =
        metadata?.title || file.name.replace(/\.epub$/i, "").replace(/[-_]+/g, " ").trim();
      const rawAuthor = metadata?.creator;
      const author =
        typeof rawAuthor === "string"
          ? rawAuthor
          : rawAuthor?.name || "Unknown Author";

      // 3. Extract Cover Image & convert to Base64 for offline persistence
      let coverUrl = null;
      try {
        const rawCoverUrl = await book.coverUrl();
        if (rawCoverUrl) {
          coverUrl = await blobUrlToBase64(rawCoverUrl);
        }
      } catch (coverErr) {
        console.warn("[Uploader] Cover extraction skipped:", coverErr);
      }

      // 4. Generate unique ID and save to localForage (IndexedDB)
      const bookId = `local_${Date.now()}`;
      const savedBook = await saveBook(
        bookId,
        {
          id: bookId,
          title,
          author,
          coverUrl,
          fileSize: file.size,
          progressPercentage: 0,
          progress: 0,
          status: "reading",
          category: "Local Vault",
          isUploaded: true,
          language: metadata?.language || "EN",
          editionNote: "Uploaded to Local-first Vault",
          synopsis: metadata?.description || `Locally uploaded e-book: ${file.name}`,
          chapterHeading: title,
          addedAt: Date.now(),
        },
        file // Saves the File/Blob directly in IndexedDB
      );

      // Clean up epub.js memory
      book.destroy();

      if (onShowToast) {
        onShowToast(`Shelved "${title}" in your Local Vault`);
      }

      if (onUploadSuccess) {
        onUploadSuccess(savedBook);
      }

      if (onClose) {
        onClose();
      }

      router.push(`/reader/${savedBook?.id || bookId}`);
    } catch (err) {
      console.error("Failed to parse and save EPUB:", err);
      const errMsg = "Could not process this EPUB file. Please try another edition.";
      setError(errMsg);
      if (onShowToast) {
        onShowToast(errMsg);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processEpubFile(file);
    }
  };

  // Standalone inline layout when rendered outside a modal (open === undefined)
  if (open === undefined) {
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
              processEpubFile(e.dataTransfer.files[0]);
            }
          }}
          className={`flex flex-col items-center justify-center w-full p-6 border border-dashed rounded-[12px] cursor-pointer transition-colors ${
            dragActive
              ? "border-accent bg-accent/10"
              : "border-hairline hover:border-accent bg-surface"
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
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
        {error && <p className="text-[12px] font-sans text-semantic-error mt-2 text-center">{error}</p>}
      </div>
    );
  }

  // Full-featured Modal Dialog layout when open={true}
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface text-on-surface rounded-t-3xl md:rounded-3xl border border-outline-variant/40 shadow-2xl overflow-hidden p-5 md:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-10 h-1 bg-outline-variant/60 rounded-full mx-auto -mt-1 mb-2"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary leading-tight">
                Add to Local Vault
              </h3>
              <p className="font-caption text-caption text-on-surface-variant">
                100% offline · stored in browser IndexedDB
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

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
              processEpubFile(e.dataTransfer.files[0]);
            }
          }}
          className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
            dragActive
              ? "border-secondary bg-secondary-fixed/20"
              : "border-outline-variant/50 bg-surface-container-lowest/70 hover:bg-surface-container-low"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,application/epub+zip"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2.5 py-4">
              <div className="w-20 h-1.5 bg-hairline rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-accent animate-pulse rounded-full" />
              </div>
              <span className="font-sans text-[14px] font-medium text-ink">
                Extracting metadata and saving to vault…
              </span>
              <span className="text-[12px] font-sans text-muted">
                Parsing offline EPUB package
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="material-symbols-outlined text-[32px] text-accent mb-2 block mx-auto">
                auto_stories
              </span>
              <p className="font-serif text-[17px] text-ink font-normal">
                Drop an .epub file here, or tap to browse
              </p>
              <p className="text-[12px] font-sans text-muted">
                Extracts metadata &amp; persistent cover image offline
              </p>
            </div>
          )}
        </label>

        {error && (
          <p className="text-[12px] text-semantic-error text-center font-sans">{error}</p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/browse"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 border border-outline-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">
              local_library
            </span>
            <span>Or browse 70,000+ free classics in The Commons</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
