"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReaderCanvas from "@/components/ReaderCanvas";
import SettingsMenu from "@/components/SettingsMenu";
import AiDrawer from "@/components/AiDrawer";
import {
  getBookBlob,
  getBookMeta,
  saveBook,
  saveReadingLocation,
  saveVocabularyWord,
  logReadingSession,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getHighlights,
  addHighlight,
  removeHighlight,
  getReaderSettings,
  saveReaderSettings,
} from "@/utils/db";
import { downloadEpub, lookupWord } from "@/lib/api";

const STATIC_GUTENBERG_BOOKS = {
  "2701": { title: "Moby Dick", author: "Herman Melville" },
  "345": { title: "Dracula", author: "Bram Stoker" },
  "1727": { title: "The Odyssey", author: "Homer" },
  "2680": { title: "Meditations", author: "Marcus Aurelius" },
  "84": { title: "Frankenstein", author: "Mary Shelley" },
  "2554": { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
};

// Helper to validate whether a binary blob is a genuine non-empty EPUB file (PK zip signature)
async function validateEpubBlob(blob) {
  if (!blob) return false;
  try {
    if (blob instanceof ArrayBuffer) {
      if (blob.byteLength < 2) return false;
      const bytes = new Uint8Array(blob, 0, 2);
      return bytes[0] === 0x50 && bytes[1] === 0x4b; // 'P', 'K'
    }
    if (typeof blob.slice === "function" && typeof blob.size === "number") {
      if (blob.size === 0) return false;
      const slice = await blob.slice(0, 2).arrayBuffer();
      const bytes = new Uint8Array(slice);
      return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    }
  } catch (err) {
    console.warn("Failed to validate EPUB blob header:", err);
    return false;
  }
  return false;
}

function ReaderContent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCfi = searchParams?.get("cfi") || null;
  const bookId = decodeURIComponent(params?.id || "");
  const canvasRef = useRef(null);

  const [bookMeta, setBookMeta] = useState(null);
  const [bookBlob, setBookBlob] = useState(null);
  const [currentCfi, setCurrentCfi] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState("");
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [loadingDb, setLoadingDb] = useState(true);
  const [isNotDownloaded, setIsNotDownloaded] = useState(false);
  const [isReDownloading, setIsReDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Telemetry & active reading tracking refs
  const lastInteractionRef = useRef(Date.now());
  const uncommittedSecondsRef = useRef(0);
  const uncommittedPagesRef = useRef(0);
  const isInitialLocationRef = useRef(true);

  // Reader appearance & typography settings
  const [readerSettings, setReaderSettings] = useState({
    palette: "paper",
    fontSize: 18.5,
    typeface: "literata",
    align: "justify",
    lineHeight: "1.75",
    margins: "normal",
  });

  // Bookmarks and Highlights
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState("#F3D382");

  // UI Overlays & HUD: showHud defaults to true on open, toggled when tapping center
  const [showHud, setShowHud] = useState(true);
  const [activeOverlay, setActiveOverlay] = useState("none"); // "none" | "settings" | "ai" | "contents"
  const [aiInitialTab, setAiInitialTab] = useState("subtext");
  const [contentsTab, setContentsTab] = useState("toc"); // "toc" | "bookmarks"

  // Word Lookup & Selection states
  const [selectedData, setSelectedData] = useState(null); // { text, cfiRange, contextSentence }
  const [wordMeaning, setWordMeaning] = useState(null);
  const [loadingMeaning, setLoadingMeaning] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2200);
  }, []);

  // 1. Load book metadata and binary blob from IndexedDB
  const loadBook = useCallback(async () => {
    if (!bookId) return;

    setLoadingDb(true);
    setIsNotDownloaded(false);
    setDownloadError("");

    try {
      const [meta, blob] = await Promise.all([
        getBookMeta(bookId),
        getBookBlob(bookId),
      ]);

      const rawGutenbergId =
        meta?.gutenbergId ||
        (bookId.startsWith("gutenberg_") ? bookId.replace("gutenberg_", "") : /^\d+$/.test(bookId) ? bookId : null);

      const staticInfo = rawGutenbergId ? STATIC_GUTENBERG_BOOKS[rawGutenbergId] : null;

      const resolvedMeta = {
        id: bookId,
        title:
          meta?.title ||
          staticInfo?.title ||
          (rawGutenbergId ? `Project Gutenberg #${rawGutenbergId}` : "Untitled Book"),
        author: meta?.author || staticInfo?.author || "Unknown Author",
        coverUrl: meta?.coverUrl || null,
        gutenbergId: rawGutenbergId ? String(rawGutenbergId) : null,
        lastReadCfi: meta?.lastReadCfi || null,
        ...(meta || {}),
      };

      setBookMeta(resolvedMeta);
      if (resolvedMeta.lastReadCfi) {
        setCurrentCfi(resolvedMeta.lastReadCfi);
      }

      const isValid = await validateEpubBlob(blob);
      if (blob && isValid) {
        setBookBlob(blob);
        setIsNotDownloaded(false);
      } else {
        setBookBlob(null);
        setIsNotDownloaded(true);
      }
    } catch (err) {
      console.error("Error loading book from DB:", err);
      setIsNotDownloaded(true);
    } finally {
      setLoadingDb(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  // 2. Load Bookmarks, Highlights, and Reader Settings on Mount
  useEffect(() => {
    if (!bookId) return;
    let active = true;

    async function loadAuxiliaryData() {
      try {
        const [savedBookmarks, savedHighlights, savedSettings] =
          await Promise.all([
            getBookmarks(bookId),
            getHighlights(bookId),
            getReaderSettings(),
          ]);

        if (!active) return;
        if (Array.isArray(savedBookmarks)) setBookmarks(savedBookmarks);
        if (Array.isArray(savedHighlights)) setHighlights(savedHighlights);
        if (savedSettings) {
          setReaderSettings((prev) => ({
            ...prev,
            ...savedSettings,
          }));
        }
      } catch (err) {
        console.warn("Failed to load bookmarks, highlights or settings:", err);
      }
    }

    loadAuxiliaryData();
    return () => {
      active = false;
    };
  }, [bookId]);

  // Persist Reader Settings
  const handleSettingsChange = (newSettings) => {
    setReaderSettings(newSettings);
    saveReaderSettings(newSettings);
  };

  // 3. Active Reading Time Tracking
  const flushSession = useCallback(() => {
    const secs = uncommittedSecondsRef.current;
    const pgs = uncommittedPagesRef.current;
    if (secs > 0 || pgs > 0) {
      uncommittedSecondsRef.current = 0;
      uncommittedPagesRef.current = 0;
      logReadingSession({ bookId, seconds: secs, pages: pgs });
    }
  }, [bookId]);

  // 1-second interval timer
  useEffect(() => {
    if (isNotDownloaded || loadingDb || !bookBlob) return;

    const timer = setInterval(() => {
      const isVisible =
        typeof document !== "undefined" && document.visibilityState === "visible";
      const isActiveRecently =
        Date.now() - lastInteractionRef.current <= 120000; // 2 minutes

      if (isVisible && isActiveRecently) {
        uncommittedSecondsRef.current += 1;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isNotDownloaded, loadingDb, bookBlob]);

  // Periodic flush every 30 seconds
  useEffect(() => {
    if (isNotDownloaded || loadingDb || !bookBlob) return;

    const flushInterval = setInterval(() => {
      flushSession();
    }, 30000);

    return () => {
      clearInterval(flushInterval);
      flushSession();
    };
  }, [flushSession, isNotDownloaded, loadingDb, bookBlob]);

  // Flush on visibilitychange / pagehide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSession();
      } else {
        lastInteractionRef.current = Date.now();
      }
    };

    const handlePageHide = () => {
      flushSession();
    };

    const registerActivity = () => {
      lastInteractionRef.current = Date.now();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pointerdown", registerActivity);
    window.addEventListener("keydown", registerActivity);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
    };
  }, [flushSession]);

  // Re-download EPUB via backend proxy, persist to vault, and reload
  async function handleDownloadAgain() {
    const gutenbergId = bookMeta?.gutenbergId;
    if (!gutenbergId) {
      setDownloadError("No Gutenberg ID found for this title. Cannot auto-download.");
      return;
    }

    setIsReDownloading(true);
    setDownloadError("");

    try {
      const epubBlob = await downloadEpub(gutenbergId);
      const updatedMeta = {
        ...bookMeta,
        id: bookId,
        gutenbergId: String(gutenbergId),
        fileSize: epubBlob.size,
        hasBinary: true,
        addedAt: Date.now(),
      };

      await saveBook(bookId, updatedMeta, epubBlob);
      await loadBook();
    } catch (err) {
      console.error("Re-download failed:", err);
      setDownloadError(
        err.message || "Download failed. Please check your backend connection."
      );
    } finally {
      setIsReDownloading(false);
    }
  }

  // 4. Automatically fetch Dictionary Meaning when 1-2 words are selected via lookupWord
  useEffect(() => {
    if (!selectedData?.text) {
      setWordMeaning(null);
      return;
    }

    const words = selectedData.text.trim().split(/\s+/);
    if (words.length <= 2) {
      const cleanWord = words[0].replace(/[^a-zA-Z-]/g, "");
      if (!cleanWord) return;

      setLoadingMeaning(true);
      lookupWord(cleanWord)
        .then((data) => {
          if (data?.definition && data.definition.length > 0) {
            setWordMeaning({
              word: data.word || cleanWord,
              phonetic: data.phonetic || "",
              partOfSpeech: data.partsOfSpeech?.join(" / ") || "definition",
              definitions: data.definition.slice(0, 3),
              definition: data.definition[0] || "No definition found.",
            });
          } else {
            setWordMeaning({
              word: cleanWord,
              phonetic: "",
              partOfSpeech: "lookup",
              definitions: ["Not in standard dictionary. Use AI explanation."],
              definition: "Not in standard dictionary. Use AI explanation.",
            });
          }
        })
        .catch(() => {
          setWordMeaning({
            word: cleanWord,
            phonetic: "",
            partOfSpeech: "lookup",
            definitions: ["Not in dictionary. Use AI explanation."],
            definition: "Not in dictionary. Use AI explanation.",
          });
        })
        .finally(() => setLoadingMeaning(false));
    } else {
      setWordMeaning(null);
    }
  }, [selectedData]);

  // Pronunciation handler via Web Speech API
  const handlePronounce = useCallback(() => {
    const textToSpeak = wordMeaning?.word || selectedData?.text?.trim().split(/\s+/)[0];
    if (!textToSpeak) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.speak(utterance);
    }
  }, [wordMeaning, selectedData]);

  // 5. Save word / selection to localForage Vocabulary store
  async function handleKeep() {
    if (!selectedData?.text) return;

    if (wordMeaning) {
      await saveVocabularyWord({
        word: wordMeaning.word,
        phonetic: wordMeaning.phonetic || "",
        partOfSpeech: wordMeaning.partOfSpeech || "word",
        definition: wordMeaning.definition,
        contextSentence: selectedData.contextSentence || selectedData.text,
        quote: selectedData.contextSentence || selectedData.text,
        bookId,
        bookTitle: bookMeta?.title || "Book",
        cfi: selectedData.cfiRange || currentCfi || null,
        chapter: currentChapter || bookMeta?.currentChapter || "",
      });
      showToast("Saved to Vocabulary");
    } else {
      // Save passage as highlight / note
      await handleAddHighlight(activeHighlightColor);
    }
    setSelectedData(null);
  }

  // Copy selection to clipboard
  const handleCopy = useCallback(() => {
    if (!selectedData?.text) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(selectedData.text);
      showToast("Copied to clipboard");
      setSelectedData(null);
    }
  }, [selectedData, showToast]);

  // Explain selection with AI
  const handleExplain = useCallback(() => {
    setAiInitialTab("subtext");
    setActiveOverlay("ai");
  }, []);

  // Context selection with AI (author grounding)
  const handleContext = useCallback(() => {
    setAiInitialTab("author");
    setActiveOverlay("ai");
  }, []);

  // Find / Search selection
  const handleFind = useCallback(() => {
    if (selectedData?.text) {
      const query = selectedData.text.trim();
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      if (typeof window !== "undefined") {
        window.open(searchUrl, "_blank", "noopener,noreferrer");
      }
      setSelectedData(null);
    }
  }, [selectedData]);

  // 6. Highlight Selection Handler
  const handleAddHighlight = async (color = "#F3D382") => {
    if (!selectedData?.text) return;
    const cfiRange = selectedData.cfiRange || currentCfi || null;
    const chosenColor = color === "underline" ? "#F3D382" : color;
    setActiveHighlightColor(chosenColor);

    const highlightEntry = {
      id: `hl-${Date.now()}`,
      cfiRange,
      text: selectedData.text,
      color: chosenColor,
      isUnderline: color === "underline",
      chapter: currentChapter || bookMeta?.currentChapter || "Passage",
      createdAt: Date.now(),
    };

    await addHighlight(bookId, highlightEntry);

    if (cfiRange && canvasRef.current?.renderHighlight) {
      canvasRef.current.renderHighlight(cfiRange, chosenColor, highlightEntry.id);
    }

    setHighlights((prev) => [highlightEntry, ...prev]);
    setSelectedData(null);
    showToast(color === "underline" ? "Underline saved" : "Highlight saved");
  };

  // 7. Bookmark Toggle Handler
  const isCurrentBookmarked = Boolean(
    currentCfi && bookmarks.some((b) => b.cfi === currentCfi)
  );

  const handleToggleBookmark = async () => {
    if (!currentCfi) return;

    const existingBm = bookmarks.find((b) => b.cfi === currentCfi);
    if (existingBm) {
      await removeBookmark(bookId, existingBm.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existingBm.id));
      showToast("Bookmark removed");
    } else {
      const newBm = await addBookmark(bookId, {
        cfi: currentCfi,
        chapter: currentChapter || bookMeta?.currentChapter || "Bookmark",
        percentage: currentProgress,
        page: pageInfo.current,
        totalPages: pageInfo.total,
        createdAt: Date.now(),
      });
      if (newBm) {
        setBookmarks((prev) => [newBm, ...prev]);
        showToast("Bookmark saved");
      }
    }
  };

  // Remove individual bookmark
  const handleRemoveBookmark = async (id, e) => {
    e.stopPropagation();
    await removeBookmark(bookId, id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast("Bookmark removed");
  };

  // Jump to location from TOC or Bookmarks
  const handleJumpToLocation = (target) => {
    if (canvasRef.current?.goToCfi && target) {
      canvasRef.current.goToCfi(target);
      setActiveOverlay("none");
    }
  };

  // Toggle HUD (TopAppBar & BottomNavBar) on center tap
  const handleToggleHud = useCallback(() => {
    if (activeOverlay !== "none") {
      setActiveOverlay("none");
      return;
    }
    if (selectedData) {
      setSelectedData(null);
      return;
    }
    setShowHud((prev) => !prev);
  }, [activeOverlay, selectedData]);

  // Prevent hydration mismatch between server HTML and local IndexedDB/browser state
  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  // Loading state while querying IndexedDB
  if (loadingDb) {
    return (
      <div className="w-full h-dvh bg-surface text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-ui text-sm text-on-surface-variant font-medium">Loading book from vault...</p>
        </div>
      </div>
    );
  }

  // "Not Downloaded" State: Missing or invalid EPUB binary
  if (isNotDownloaded) {
    return (
      <div className="w-full h-dvh bg-surface text-on-surface flex flex-col items-center justify-center px-6 text-center select-none">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 backdrop-blur-xl editorial-shadow flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 border border-secondary/20 text-secondary flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[32px]">cloud_off</span>
          </div>

          <span className="text-[11px] font-label-sm uppercase tracking-widest text-secondary font-semibold mb-1">
            Offline Vault
          </span>

          <h2 className="font-headline-md text-headline-sm text-primary mb-2 line-clamp-2">
            {bookMeta?.title || "Book Not Downloaded"}
          </h2>

          <p className="font-body-ui text-xs text-on-surface-variant mb-6 leading-relaxed">
            The EPUB file for this book is missing or has not been saved into your offline vault yet.
          </p>

          {downloadError && (
            <div className="w-full p-3 mb-5 rounded-xl bg-error-container text-error text-xs text-left">
              <p className="font-semibold mb-0.5">Download error:</p>
              <p>{downloadError}</p>
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleDownloadAgain}
              disabled={isReDownloading}
              className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-body-ui-bold text-sm hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isReDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Downloading EPUB...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download again</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/library")}
              className="w-full py-3 px-4 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest font-body-ui text-sm active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to library</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawPct = currentProgress <= 1 ? currentProgress * 100 : currentProgress;
  const pct = Math.max(0, Math.min(100, Math.round(rawPct)));

  return (
    <div className="relative w-full h-dvh overflow-hidden select-none bg-surface text-on-surface">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface-container-highest/95 border border-outline-variant/30 text-primary font-label-md text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none transition-all">
          {toastMessage}
        </div>
      )}

      {/* TopAppBar: Fixed h-14 matching designs/03-reader-viewport.html */}
      <header
        className={`fixed top-0 left-0 w-full z-40 flex justify-between items-center px-gutter h-14 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-outline-variant/10 shadow-sm transition-all duration-300 ease-in-out ${
          showHud
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Leading Action */}
        <button
          type="button"
          onClick={() => router.push("/library")}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150"
        >
          <span className="material-symbols-outlined" data-icon="arrow_back">
            arrow_back
          </span>
        </button>

        {/* Title / Brand Pill */}
        <div className="flex items-center px-3.5 py-1 rounded-full bg-surface-container-low/70 border border-outline-variant/20 shadow-xs max-w-[62%] sm:max-w-md truncate">
          <span className="font-headline-sm text-label-md text-primary dark:text-inverse-primary tracking-normal font-medium truncate">
            {bookMeta?.title || "Reading"}
          </span>
          {bookMeta?.author && (
            <>
              <span className="mx-1.5 text-outline-variant text-[10px] shrink-0">•</span>
              <span className="font-label-md text-caption text-on-surface-variant truncate shrink-0">
                {bookMeta.author}
              </span>
            </>
          )}
        </div>

        {/* Trailing Action: Bookmark */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          aria-label={isCurrentBookmarked ? "Remove bookmark" : "Bookmark this page"}
          title={isCurrentBookmarked ? "Remove bookmark" : "Bookmark this page"}
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150"
        >
          <span
            className={`material-symbols-outlined ${
              isCurrentBookmarked ? "fill-icon text-secondary" : ""
            }`}
            data-icon="bookmark"
            style={{ fontVariationSettings: isCurrentBookmarked ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
      </header>

      {/* Main Kindle EPUB Canvas */}
      <ReaderCanvas
        ref={canvasRef}
        bookBlob={bookBlob}
        initialCfi={targetCfi || bookMeta?.lastReadCfi}
        settings={readerSettings}
        highlights={highlights}
        onUserInteraction={() => {
          lastInteractionRef.current = Date.now();
        }}
        onToggleMenu={handleToggleHud}
        onNavigationLoaded={(loadedToc) => {
          if (Array.isArray(loadedToc)) setToc(loadedToc);
        }}
        onLocationChange={({ cfi, progress, chapter, page, totalPages }) => {
          if (cfi) setCurrentCfi(cfi);
          if (progress !== undefined) setCurrentProgress(progress);
          if (chapter) setCurrentChapter(chapter);
          if (page) setPageInfo({ current: page, total: totalPages || pageInfo.total });

          // Dismiss any active word selection popover on page turn
          setSelectedData(null);

          lastInteractionRef.current = Date.now();

          // Count page flips after initial load
          if (isInitialLocationRef.current) {
            isInitialLocationRef.current = false;
          } else {
            uncommittedPagesRef.current += 1;
          }

          saveReadingLocation(bookId, cfi, progress, chapter, page, totalPages);
        }}
        onTextSelect={(selection) => {
          lastInteractionRef.current = Date.now();
          setSelectedData(selection);
        }}
      />

      {/* Floating Selection & Dictionary Popover Card matching designs/03-reader-viewport.html */}
      {selectedData?.text && activeOverlay === "none" && (
        <section className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm sm:max-w-md rounded-xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 editorial-shadow transition-all duration-200 overflow-hidden text-left shadow-2xl">
          {/* Subtle directional indicator */}
          <div className="w-3 h-3 bg-surface-container-lowest border-t border-l border-outline-variant/30 transform rotate-45 mx-auto -mt-1.5 shadow-sm"></div>

          {/* Dictionary or Passage Header */}
          <div className="px-4 pt-3 pb-3 border-b border-outline-variant/20 bg-surface-container-low/40">
            {selectedData.text.trim().split(/\s+/).length <= 2 ? (
              /* Single Word Header */
              <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-2 truncate pr-2">
                  <span className="font-headline-md text-headline-sm text-primary font-medium tracking-tight truncate max-w-[170px]">
                    {wordMeaning?.word || selectedData.text}
                  </span>
                  {wordMeaning?.phonetic && (
                    <span className="text-caption text-on-surface-variant font-mono">
                      {wordMeaning.phonetic}
                    </span>
                  )}
                  {wordMeaning && (
                    <button
                      type="button"
                      onClick={handlePronounce}
                      aria-label="Listen to pronunciation"
                      className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded-full inline-flex items-center"
                    >
                      <span className="material-symbols-outlined text-[16px]" data-icon="volume_up">
                        volume_up
                      </span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide bg-surface-container-high text-on-surface-variant uppercase font-medium">
                    {wordMeaning?.partOfSpeech || "word"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedData(null)}
                    aria-label="Dismiss selection"
                    className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[16px]" data-icon="close">
                      close
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Highlighted Passage Header */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]" data-icon="format_quote">
                    format_quote
                  </span>
                  <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold text-secondary">
                    Highlighted Passage
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide bg-surface-container-high text-on-surface-variant uppercase font-medium">
                    {selectedData.text.trim().split(/\s+/).length} words
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedData(null)}
                    aria-label="Dismiss selection"
                    className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[16px]" data-icon="close">
                      close
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Definitions or Passage Body */}
            {selectedData.text.trim().split(/\s+/).length <= 2 ? (
              loadingMeaning ? (
                <div className="py-2.5 flex items-center gap-2 text-caption font-body-ui text-on-surface-variant">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Looking up definition...</span>
                </div>
              ) : wordMeaning?.definitions?.length > 0 ? (
                <ol className="mt-2.5 space-y-1.5 text-caption font-body-ui text-on-surface-variant list-decimal list-inside leading-snug max-h-28 overflow-y-auto">
                  {wordMeaning.definitions.map((def, idx) => (
                    <li key={idx}>
                      <span className="text-on-surface font-medium">{def.split(" ")[0]}</span>{" "}
                      <span>{def.split(" ").slice(1).join(" ")}</span>
                    </li>
                  ))}
                </ol>
              ) : wordMeaning?.definition ? (
                <p className="mt-2 text-caption font-body-ui text-on-surface-variant leading-snug">
                  {wordMeaning.definition}
                </p>
              ) : (
                <p className="mt-2 text-caption font-body-ui text-on-surface-variant leading-snug italic">
                  “{selectedData.text}”
                </p>
              )
            ) : (
              <div className="mt-2 max-h-24 overflow-y-auto hide-scrollbar">
                <p className="font-body-reading text-[13.5px] leading-[22px] italic text-on-surface select-text text-left">
                  “{selectedData.text.trim().replace(/^["“'”]+|["“'”]+$/g, '').trim()}”
                </p>
              </div>
            )}
          </div>

          {/* Color Highlight Swatches */}
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-label-sm text-caption text-on-surface-variant tracking-wider uppercase text-[10px]">
                Highlight
              </span>
              {/* Swatches */}
              <div className="flex items-center space-x-2 ml-1">
                {/* Ochre */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#F3D382")}
                  aria-label="Warm Ochre Highlight"
                  className={`w-6 h-6 rounded-full bg-[#F3D382] flex items-center justify-center shadow-xs active:scale-95 transition-transform ${
                    activeHighlightColor === "#F3D382"
                      ? "border-2 border-primary"
                      : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                  }`}
                >
                  {activeHighlightColor === "#F3D382" && (
                    <span className="material-symbols-outlined text-[14px] text-primary font-bold" data-icon="check">
                      check
                    </span>
                  )}
                </button>
                {/* Rose */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#F8B4B4")}
                  aria-label="Soft Rose Highlight"
                  className={`w-6 h-6 rounded-full bg-[#F8B4B4] flex items-center justify-center shadow-xs active:scale-95 transition-transform ${
                    activeHighlightColor === "#F8B4B4"
                      ? "border-2 border-primary"
                      : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                  }`}
                >
                  {activeHighlightColor === "#F8B4B4" && (
                    <span className="material-symbols-outlined text-[14px] text-primary font-bold" data-icon="check">
                      check
                    </span>
                  )}
                </button>
                {/* Sky Blue */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#A7D2FB")}
                  aria-label="Sky Blue Highlight"
                  className={`w-6 h-6 rounded-full bg-[#A7D2FB] flex items-center justify-center shadow-xs active:scale-95 transition-transform ${
                    activeHighlightColor === "#A7D2FB"
                      ? "border-2 border-primary"
                      : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                  }`}
                >
                  {activeHighlightColor === "#A7D2FB" && (
                    <span className="material-symbols-outlined text-[14px] text-primary font-bold" data-icon="check">
                      check
                    </span>
                  )}
                </button>
                {/* Sage Green */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#B7DEBD")}
                  aria-label="Sage Green Highlight"
                  className={`w-6 h-6 rounded-full bg-[#B7DEBD] flex items-center justify-center shadow-xs active:scale-95 transition-transform ${
                    activeHighlightColor === "#B7DEBD"
                      ? "border-2 border-primary"
                      : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                  }`}
                >
                  {activeHighlightColor === "#B7DEBD" && (
                    <span className="material-symbols-outlined text-[14px] text-primary font-bold" data-icon="check">
                      check
                    </span>
                  )}
                </button>
              </div>
            </div>
            {/* Underline Toggle */}
            <button
              type="button"
              onClick={() => handleAddHighlight("underline")}
              aria-label="Underline text"
              className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center border border-outline-variant/30 active:scale-95 transition-all"
            >
              <span className="font-headline-sm text-label-md underline font-semibold leading-none">
                U
              </span>
            </button>
          </div>

          {/* 5-Column Quick Actions Grid */}
          <div className="grid grid-cols-5 divide-x divide-outline-variant/20 text-center bg-surface-container-lowest py-1.5">
            <button
              type="button"
              onClick={handleKeep}
              className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="sticky_note_2">
                sticky_note_2
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Keep</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="content_copy">
                content_copy
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Copy</span>
            </button>
            <button
              type="button"
              onClick={handleExplain}
              className="flex flex-col items-center justify-center py-1 text-secondary hover:text-on-secondary-container active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
                auto_awesome
              </span>
              <span className="font-label-sm text-[10px] mt-0.5 font-medium">Explain</span>
            </button>
            <button
              type="button"
              onClick={handleContext}
              className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="history_edu">
                history_edu
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Context</span>
            </button>
            <button
              type="button"
              onClick={handleFind}
              className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="search">
                search
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Find</span>
            </button>
          </div>
        </section>
      )}

      {/* BottomNavBar: Fixed h-16 matching designs/03-reader-viewport.html */}
      <nav
        className={`fixed bottom-0 left-0 w-full z-40 flex justify-between items-center px-gutter h-16 bg-surface/90 dark:bg-surface-container/90 backdrop-blur-md border-t border-outline-variant/30 dark:border-outline-variant/10 shadow-sm transition-all duration-300 ease-in-out ${
          showHud
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Item 1: Contents */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === "contents" ? "none" : "contents"))}
          className={`flex flex-col items-center justify-center hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg ${
            activeOverlay === "contents" ? "text-primary font-medium" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined" data-icon="menu_book">
            menu_book
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Contents</span>
        </button>

        {/* Item 2: Active Reading Progress */}
        <button
          type="button"
          onClick={handleToggleHud}
          className="flex flex-col items-center justify-center text-primary dark:text-inverse-primary font-medium hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg"
        >
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary" data-icon="article">
              article
            </span>
            <span className="font-label-sm text-[11px] tracking-wider font-semibold">
              PAGE {pageInfo.current} OF {pageInfo.total} · {pct}%
            </span>
          </div>
          {/* Mini Progress Pip */}
          <div className="w-16 bg-surface-container-high h-1 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
            ></div>
          </div>
        </button>

        {/* Item 3: Appearance */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === "settings" ? "none" : "settings"))}
          className={`flex flex-col items-center justify-center hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg ${
            activeOverlay === "settings" ? "text-primary font-medium" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined" data-icon="format_size">
            format_size
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Appearance</span>
        </button>
      </nav>

      {/* Contents / TOC & Bookmarks Drawer */}
      {activeOverlay === "contents" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setActiveOverlay("none")}
          />
          <section className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant/40 shadow-2xl max-h-[80vh] flex flex-col overflow-hidden text-left">
            {/* Drawer Header */}
            <header className="px-5 pt-4 pb-3 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setContentsTab("toc")}
                  className={`font-label-sm text-xs uppercase tracking-wider pb-1 transition-colors ${
                    contentsTab === "toc"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Chapters ({toc.length})
                </button>
                <button
                  type="button"
                  onClick={() => setContentsTab("bookmarks")}
                  className={`font-label-sm text-xs uppercase tracking-wider pb-1 transition-colors ${
                    contentsTab === "bookmarks"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Bookmarks ({bookmarks.length})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlay("none")}
                aria-label="Close contents"
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {contentsTab === "toc" ? (
                toc.length > 0 ? (
                  toc.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToLocation(item.href)}
                      className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-surface-container-high/60 transition flex items-center justify-between group"
                    >
                      <span className="font-body-ui text-sm text-on-surface group-hover:text-primary line-clamp-1">
                        {item.label?.trim() || `Chapter ${idx + 1}`}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-center py-8 font-body-ui text-xs text-on-surface-variant">
                    No chapter navigation index found in this book.
                  </p>
                )
              ) : bookmarks.length > 0 ? (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => handleJumpToLocation(bm.cfi)}
                    className="w-full py-2.5 px-3 rounded-xl hover:bg-surface-container-high/60 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <p className="font-body-ui-bold text-xs text-primary line-clamp-1">
                        {bm.chapter || "Bookmark"}
                      </p>
                      <p className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                        Page {bm.page || 1} • {Math.round(bm.percentage <= 1 ? bm.percentage * 100 : bm.percentage)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveBookmark(bm.id, e)}
                      aria-label="Delete bookmark"
                      className="p-1 rounded-full text-outline-variant hover:text-error hover:bg-surface-container transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[32px] text-outline-variant mb-2 block">
                    bookmark_border
                  </span>
                  <p className="font-body-ui text-xs text-on-surface-variant">
                    No bookmarks saved yet. Tap the bookmark icon in the top bar while reading to save pages.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Flyleaf Settings Drawer */}
      <SettingsMenu
        open={activeOverlay === "settings"}
        onClose={() => setActiveOverlay("none")}
        settings={readerSettings}
        onChangeSettings={handleSettingsChange}
      />

      {/* AI Assistant Drawer */}
      {activeOverlay === "ai" && (
        <AiDrawer
          isOpen={true}
          open={true}
          onClose={() => {
            setActiveOverlay("none");
            setSelectedData(null);
          }}
          selectedText={selectedData?.text || ""}
          initialTab={aiInitialTab}
          bookTitle={bookMeta?.title || "Current Book"}
          author={bookMeta?.author || "Unknown Author"}
          currentChapter={currentChapter}
          bookId={bookId}
          canvasRef={canvasRef}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}

export default function ReaderPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-surface flex items-center justify-center text-on-surface">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-body-ui text-sm text-on-surface-variant">Opening book...</p>
          </div>
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
