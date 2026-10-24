"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReaderCanvas from "@/components/ReaderCanvas";
import SettingsMenu from "@/components/SettingsMenu";
import AiDrawer from "@/components/AiDrawer";
import PageFurniture from "@/components/reader/PageFurniture";
import EdgeArrows from "@/components/reader/EdgeArrows";
import ContentsPopover from "@/components/reader/ContentsPopover";
import HighlightsPopover from "@/components/reader/HighlightsPopover";
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
  getStatsSummary,
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

const DEMO_FALLBACK_CONTENT = {
  volume: "Volume I",
  chapter: "CHAPTER I.",
  paragraphs: [
    "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
    "“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”",
    "Mr. Bennet replied that he had not.",
    "“But it is,” returned she; “for Mrs. Long has just been here, and she told me all about it.”",
    "Mr. Bennet made no answer.",
    "“Do you not want to know who has taken it?” cried his wife impatiently.",
    "“You want to tell me, and I have no objection to hearing it.”",
    "This was invitation enough.",
  ],
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

export const READER_PALETTES = {
  paper: {
    name: "Paper",
    bg: "#FAF9F6",
    fg: "#152A41",
    muted: "#43474D",
    border: "rgba(21, 42, 65, 0.15)",
    accent: "#855224",
  },
  sepia: {
    name: "Sepia",
    bg: "#F4ECD8",
    fg: "#2C2214",
    muted: "#5B472C",
    border: "rgba(91, 71, 44, 0.20)",
    accent: "#7A491B",
  },
  night: {
    name: "Night",
    bg: "#141824",
    fg: "#F0F2F5",
    muted: "#A0AEC0",
    border: "rgba(255, 255, 255, 0.12)",
    accent: "#E2B170",
  },
  oled: {
    name: "OLED",
    bg: "#000000",
    fg: "#EDEDED",
    muted: "#A0A0A0",
    border: "rgba(255, 255, 255, 0.15)",
    accent: "#E2B170",
  },
};

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

  // User reading pace (defaults to 220 WPM, updated from measured session history)
  const [userWpm, setUserWpm] = useState(220);

  // End-of-chapter 2-second non-modal hint banner
  const [endOfChapterHint, setEndOfChapterHint] = useState(false);
  const endOfChapterTimerRef = useRef(null);
  const lastSeenEndOfChapterKeyRef = useRef("");

  // Reader appearance & typography settings (responsive defaults: 18/19/20px, line-height 1.6, align auto)
  const [readerSettings, setReaderSettings] = useState({
    palette: "paper",
    fontSize: null,
    typeface: "literata",
    align: "auto",
    lineHeight: "1.6",
    margins: "normal",
  });

  // Bookmarks and Highlights
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState("#F3D382");

  // UI Overlays & HUD: showHud defaults to false (controls hidden), toggled when tapping center
  const [showHud, setShowHud] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState("none"); // "none" | "settings" | "ai" | "contents"
  const [aiInitialTab, setAiInitialTab] = useState("subtext");
  const [contentsTab, setContentsTab] = useState("toc"); // "toc" | "bookmarks"

  const [isShortLandscape, setIsShortLandscape] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [isSysDark, setIsSysDark] = useState(false);
  const [isMouseInWindow, setIsMouseInWindow] = useState(false);
  const hudIdleTimerRef = useRef(null);
  const cursorIdleTimerRef = useRef(null);
  const contentsBtnRef = useRef(null);
  const highlightsBtnRef = useRef(null);
  const activeOverlayRef = useRef(activeOverlay);
  activeOverlayRef.current = activeOverlay;

  const [windowDims, setWindowDims] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateDims = () => {
      setWindowDims({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    window.addEventListener("orientationchange", updateDims);
    return () => {
      window.removeEventListener("resize", updateDims);
      window.removeEventListener("orientationchange", updateDims);
    };
  }, []);

  const isTwoPageSpread = windowDims.width >= 1100 && windowDims.width > windowDims.height;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    setIsShortLandscape(mq.matches);
    const handler = (e) => setIsShortLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSysDark(mq.matches);
    const handler = (e) => setIsSysDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const chosenPalette = readerSettings?.palette || readerSettings?.theme || "paper";
  const effectivePaletteId =
    chosenPalette === "auto" ? (isSysDark ? "night" : "paper") : chosenPalette;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (
      effectivePaletteId === "night" ||
      effectivePaletteId === "oled" ||
      effectivePaletteId === "dark"
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [effectivePaletteId]);

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

    if (bookId === "demo" || bookId === "sample") {
      setBookMeta({
        id: bookId,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        volume: "Volume I",
        chapter: "CHAPTER I.",
      });
      setBookBlob(null);
      setIsNotDownloaded(false);
      setPageInfo({ current: 3, total: 547 });
      setToc([
        { label: "Volume I · Chapter I", href: "#ch1" },
        { label: "Volume I · Chapter II", href: "#ch2" },
        { label: "Volume I · Chapter III", href: "#ch3" },
      ]);
      setLoadingDb(false);
      return;
    }

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

  // 2. Load Bookmarks, Highlights, Reader Settings, and Session Telemetry on Mount
  useEffect(() => {
    if (!bookId) return;
    let active = true;

    async function loadAuxiliaryData() {
      try {
        const [savedBookmarks, savedHighlights, savedSettings, statsSummary] =
          await Promise.all([
            getBookmarks(bookId),
            getHighlights(bookId),
            getReaderSettings(),
            getStatsSummary(),
          ]);

        if (!active) return;
        if (Array.isArray(savedBookmarks)) setBookmarks(savedBookmarks);
        if (Array.isArray(savedHighlights)) setHighlights(savedHighlights);
        if (savedSettings) {
          setReaderSettings((prev) => ({
            ...prev,
            ...savedSettings,
          }));
        } else {
          // Defaults for new users: 18px on phone, 19px on tablet, 20px on desktop; line height 1.6; align auto
          const w = typeof window !== "undefined" ? window.innerWidth : 1024;
          const defSize = w < 768 ? 18 : w < 1024 ? 19 : 20;
          setReaderSettings((prev) => ({
            ...prev,
            fontSize: defSize,
            lineHeight: "1.6",
            align: "auto",
            typeface: "literata",
            palette: "paper",
          }));
        }

        // Derive user WPM from reading session history if enough data exists
        const totalSecs = statsSummary?.totalSeconds || 0;
        const totalPgs = statsSummary?.totalPagesTurned || 0;
        if (totalSecs >= 180 && totalPgs >= 3) {
          const estimatedWords = totalPgs * 260;
          const paceWpm = Math.round(estimatedWords / (totalSecs / 60));
          if (paceWpm >= 100 && paceWpm <= 500) {
            setUserWpm(paceWpm);
          }
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

  const handleDeleteHighlight = useCallback(async (highlightId) => {
    try {
      await removeHighlight(highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err) {
      console.error("[ReaderPage] Failed to remove highlight:", err);
    }
  }, []);

  // Pointer activity tracker: handles toolbar reveal on mousemove or top 80px, auto-hide after 2.5s, edge arrow fade
  const registerPointerActivity = useCallback((e) => {
    lastInteractionRef.current = Date.now();
    setIsMouseInWindow(true);
    setCursorHidden(false);
    clearTimeout(cursorIdleTimerRef.current);

    // After 2.5 seconds idle without pointer motion, hide cursor
    cursorIdleTimerRef.current = setTimeout(() => {
      setCursorHidden(true);
    }, 2500);

    const clientY = e?.clientY;
    const isTop80 = typeof clientY === "number" && clientY <= 80;

    // Show toolbar when mouse moves or within top 80px
    setShowHud(true);
    clearTimeout(hudIdleTimerRef.current);

    // If within top 80px or a popover is open, keep toolbar visible; otherwise auto-hide after 2.5s
    if (!isTop80) {
      hudIdleTimerRef.current = setTimeout(() => {
        if (activeOverlayRef.current === "none") {
          setShowHud(false);
        }
      }, 2500);
    }
  }, []);

  useEffect(() => {
    const handleMouseLeave = () => {
      setIsMouseInWindow(false);
      if (activeOverlayRef.current === "none") {
        clearTimeout(hudIdleTimerRef.current);
        hudIdleTimerRef.current = setTimeout(() => {
          if (activeOverlayRef.current === "none") {
            setShowHud(false);
          }
        }, 1000);
      }
    };
    const handleMouseEnter = () => {
      setIsMouseInWindow(true);
    };

    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mousemove", registerPointerActivity);
    return () => {
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mousemove", registerPointerActivity);
      clearTimeout(hudIdleTimerRef.current);
      clearTimeout(cursorIdleTimerRef.current);
    };
  }, [registerPointerActivity]);

  useEffect(() => {
    if (activeOverlay !== "none") {
      setShowHud(true);
      clearTimeout(hudIdleTimerRef.current);
    }
  }, [activeOverlay]);

  // Fullscreen state and sync
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Close selection card on window wheel or scroll
  useEffect(() => {
    const handleScrollOrWheel = () => {
      if (selectedData) {
        setSelectedData(null);
      }
    };
    window.addEventListener("wheel", handleScrollOrWheel, { passive: true });
    window.addEventListener("scroll", handleScrollOrWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleScrollOrWheel);
      window.removeEventListener("scroll", handleScrollOrWheel);
    };
  }, [selectedData]);

  // Comprehensive keyboard shortcut navigation
  const handleKeyDown = useCallback(
    (e) => {
      lastInteractionRef.current = Date.now();
      setCursorHidden(false);

      const target = e.target;
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;
      const tag = (target?.tagName || activeEl?.tagName || "").toUpperCase();
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          if (activeOverlay !== "none") {
            setActiveOverlay("none");
          } else if (selectedData) {
            setSelectedData(null);
          } else {
            setShowHud(false);
          }
          break;
        case "f":
        case "F":
          handleToggleFullscreen();
          break;
        case "c":
        case "C":
          setActiveOverlay((prev) => (prev === "contents" ? "none" : "contents"));
          break;
        case "a":
        case "A":
          setActiveOverlay((prev) => (prev === "settings" ? "none" : "settings"));
          break;
        case "i":
        case "I":
          setActiveOverlay((prev) => (prev === "ai" ? "none" : "ai"));
          break;
        case "b":
        case "B":
          handleToggleBookmark();
          break;
        case "ArrowRight":
        case "PageDown":
          canvasRef.current?.next();
          break;
        case "ArrowLeft":
        case "PageUp":
          canvasRef.current?.prev();
          break;
        case " ":
          e.preventDefault();
          if (e.shiftKey) {
            canvasRef.current?.prev();
          } else {
            canvasRef.current?.next();
          }
          break;
        default:
          break;
      }
    },
    [activeOverlay, selectedData, handleToggleBookmark]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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

  // Derive chapter subtitle ("Chapter N of total" or chapter title)
  const chapterSubtitle = (() => {
    if (toc && toc.length > 0 && currentChapter) {
      const idx = toc.findIndex(
        (t) => t.label?.trim().toLowerCase() === currentChapter.trim().toLowerCase()
      );
      if (idx !== -1) {
        return `Chapter ${idx + 1} of ${toc.length} · ${currentChapter}`;
      }
    }
    if (currentChapter) {
      return currentChapter;
    }
    if (pageInfo.total > 1) {
      return `Page ${pageInfo.current} of ${pageInfo.total}`;
    }
    return null;
  })();

  // Chapter words remaining and time-to-read calculation matching design 03
  const chapterWordsRemaining = (() => {
    const pagesRemaining = Math.max(0, (pageInfo.total || 1) - (pageInfo.current || 1));
    const rawText = canvasRef.current?.getChapterText?.() || "";
    if (rawText && rawText.length > 80) {
      const words = rawText.trim().split(/\s+/).filter(Boolean).length;
      if (words > 40) {
        const fractionRemaining = Math.max(
          0,
          ((pageInfo.total || 1) - (pageInfo.current || 1)) / Math.max(1, pageInfo.total || 1)
        );
        return Math.round(words * fractionRemaining);
      }
    }
    return pagesRemaining * 260;
  })();

  const minutesLeftInChapter = Math.max(1, Math.ceil(chapterWordsRemaining / (userWpm || 220)));

  const chapterDisplayName = (() => {
    if (currentChapter && currentChapter.trim()) {
      const clean = currentChapter.trim();
      return clean.length > 28 ? clean.slice(0, 26) + "…" : clean;
    }
    if (toc && toc.length > 0) {
      return `Chapter ${Math.min(toc.length, Math.max(1, pageInfo.current))}`;
    }
    return "Chapter I";
  })();

  const chapterProgressPercent = Math.max(
    2,
    Math.min(
      100,
      Math.round(((pageInfo.current || 1) / Math.max(1, pageInfo.total || 1)) * 100)
    )
  );

  const isContentsOpen = activeOverlay === "contents";
  const isSettingsOpen = activeOverlay === "settings";
  const isAiOpen = activeOverlay === "ai";

  const readingAreaClass = (() => {
    if (isSettingsOpen) {
      return "max-md:h-[42dvh] md:mr-[380px] md:w-[calc(100vw-380px)] h-dvh";
    }
    if (isAiOpen) {
      return "max-md:h-[52dvh] md:mr-[420px] md:w-[calc(100vw-420px)] h-dvh";
    }
    return "w-full h-dvh";
  })();

  const headerBarClass = (() => {
    if (isSettingsOpen) {
      return "md:w-[calc(100vw-380px)] w-full";
    }
    if (isAiOpen) {
      return "md:w-[calc(100vw-420px)] w-full";
    }
    return "w-full";
  })();

  const bottomBarClass = (() => {
    if (isSettingsOpen) {
      return "md:w-[calc(100vw-380px)] w-full max-md:hidden";
    }
    if (isAiOpen) {
      return "md:w-[calc(100vw-420px)] w-full max-md:hidden";
    }
    return "w-full";
  })();

  // Anchored card positioning logic (Requirement 2)
  const cardPosition = (() => {
    if (typeof window === "undefined") return { mode: "mobile" };
    const isMobile = window.innerWidth < 768;
    if (isMobile || !selectedData?.selectionRect) {
      return { mode: "mobile" };
    }

    const rect = selectedData.selectionRect;
    const cardWidth = Math.min(380, window.innerWidth - 16);
    const cardHeight = 250;
    const margin = 8;

    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, left));

    let top = rect.bottom + 10;
    let isAbove = false;
    if (top + cardHeight > window.innerHeight - margin) {
      top = rect.top - cardHeight - 10;
      isAbove = true;
    }
    top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, top));

    return { mode: "anchored", left, top, width: cardWidth, isAbove };
  })();

  const currentPalette =
    READER_PALETTES[effectivePaletteId] || READER_PALETTES.paper;

  const readerRootStyle = {
    "--reader-bg": currentPalette.bg,
    "--reader-fg": currentPalette.fg,
    "--reader-muted": currentPalette.muted,
    "--reader-border": currentPalette.border,
    "--reader-accent": currentPalette.accent,
    backgroundColor: "var(--reader-bg)",
    color: "var(--reader-fg)",
  };

  return (
    <div style={readerRootStyle} className="relative w-full h-dvh overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: "var(--reader-bg)",
            borderColor: "var(--reader-border)",
            color: "var(--reader-fg)",
          }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border font-label-md text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none transition-all"
        >
          {toastMessage}
        </div>
      )}

      {/* Active Reading Area: Live reflow viewport. Shrinks above bottom sheet on phone, shrinks side-by-side with docked panels on desktop */}
      <div className={`relative transition-all duration-300 flex flex-col ${readingAreaClass}`}>
        {/* Top progress capsule visible when controls are hidden */}
        {!showHud && activeOverlay === "none" && !selectedData && (
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Reading progress: ${pct}%`}
            style={{
              backgroundColor: "var(--reader-bg)",
              borderColor: "var(--reader-border)",
            }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-30 max-w-[68ch] w-[92vw] h-[6px] rounded-full p-[1px] backdrop-blur-sm border pointer-events-none transition-all duration-300 shadow-xs"
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: "var(--reader-accent)",
                width: `${Math.max(2, Math.min(100, pct))}%`,
              }}
            />
          </div>
        )}

        {/* Toolbar visibility condition: shown on pointer activity / top 80px or while popovers are open */}
        {(() => null)()}
        <header
          style={{
            backgroundColor: "var(--reader-bg)",
            borderColor: "var(--reader-border)",
            color: "var(--reader-fg)",
          }}
          className={`fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 sm:px-6 ${
            isShortLandscape ? "h-9" : "h-14"
          } bg-opacity-90 backdrop-blur-md border-b shadow-sm transition-all duration-300 ease-in-out ${headerBarClass} ${
            showHud || activeOverlay !== "none"
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          {/* Leading Actions: Back, Contents, Highlights and Notes */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => router.push("/library")}
              aria-label="Return to library"
              title="Return to library"
              style={{ color: "var(--reader-fg)" }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">
                arrow_back
              </span>
            </button>

            <button
              ref={contentsBtnRef}
              type="button"
              onClick={() => setActiveOverlay((prev) => (prev === "contents" ? "none" : "contents"))}
              aria-label="Contents (C)"
              title="Contents (C)"
              style={{
                color: activeOverlay === "contents" ? "var(--reader-accent)" : "var(--reader-fg)",
                backgroundColor: activeOverlay === "contents" ? "var(--reader-accent-alpha, rgba(133,82,36,0.12))" : "transparent",
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="menu_book">
                menu_book
              </span>
            </button>

            <button
              ref={highlightsBtnRef}
              type="button"
              onClick={() => setActiveOverlay((prev) => (prev === "highlights" ? "none" : "highlights"))}
              aria-label="Highlights and notes"
              title="Highlights and notes"
              style={{
                color: activeOverlay === "highlights" ? "var(--reader-accent)" : "var(--reader-fg)",
                backgroundColor: activeOverlay === "highlights" ? "var(--reader-accent-alpha, rgba(133,82,36,0.12))" : "transparent",
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="rate_review">
                rate_review
              </span>
            </button>
          </div>

          {/* Title / Brand Pill with Chapter Subtitle */}
          <div className="flex flex-col items-center justify-center max-w-[45vw] sm:max-w-md min-w-0">
            <div
              style={{
                backgroundColor: "var(--reader-bg)",
                borderColor: "var(--reader-border)",
              }}
              className="flex items-center px-3.5 py-0.5 rounded-full border shadow-xs max-w-full truncate"
            >
              <span
                style={{ color: "var(--reader-fg)" }}
                className="font-headline-sm text-label-md tracking-normal font-medium truncate"
              >
                {bookMeta?.title || "Reading"}
              </span>
              {bookMeta?.author && (
                <>
                  <span style={{ color: "var(--reader-muted)" }} className="mx-1.5 text-[10px] shrink-0">•</span>
                  <span
                    style={{ color: "var(--reader-muted)" }}
                    className="font-label-md text-caption truncate shrink-0"
                  >
                    {bookMeta.author}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Trailing Actions: Search (disabled) + Appearance + Bookmark + Fullscreen */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled
              aria-label="Search"
              title="Search (Coming soon)"
              style={{ color: "var(--reader-fg)" }}
              className="w-10 h-10 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed select-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="search">
                search
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOverlay((prev) => (prev === "settings" ? "none" : "settings"))}
              aria-label="Appearance settings (A)"
              title="Appearance settings (A)"
              style={{
                color: activeOverlay === "settings" ? "var(--reader-accent)" : "var(--reader-fg)",
                backgroundColor: activeOverlay === "settings" ? "var(--reader-accent-alpha, rgba(133,82,36,0.12))" : "transparent",
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span style={{ color: "var(--reader-fg)" }} className="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
            </button>

            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-label={isCurrentBookmarked ? "Remove bookmark (B)" : "Bookmark this page (B)"}
              title={isCurrentBookmarked ? "Remove bookmark (B)" : "Bookmark this page (B)"}
              style={{ color: isCurrentBookmarked ? "var(--reader-accent)" : "var(--reader-fg)" }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isCurrentBookmarked ? "fill-icon" : ""
                }`}
                data-icon="bookmark"
                style={{
                  fontVariationSettings: isCurrentBookmarked ? "'FILL' 1" : "'FILL' 0",
                  color: isCurrentBookmarked ? "var(--reader-accent)" : "var(--reader-fg)",
                }}
              >
                bookmark
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
              title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
              style={{ color: "var(--reader-fg)" }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon={isFullscreen ? "fullscreen_exit" : "fullscreen"}>
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </header>

        {/* Contents Popover anchored under Contents button */}
        <ContentsPopover
          isOpen={activeOverlay === "contents"}
          onClose={() => setActiveOverlay("none")}
          toc={toc}
          currentChapter={currentChapter}
          onSelectChapter={(href) => handleJumpToLocation(href)}
          anchorRef={contentsBtnRef}
        />

        {/* Highlights & Notes Popover anchored under Highlights button */}
        <HighlightsPopover
          isOpen={activeOverlay === "highlights"}
          onClose={() => setActiveOverlay("none")}
          highlights={highlights}
          onSelectHighlight={(cfi) => handleJumpToLocation(cfi)}
          onDeleteHighlight={handleDeleteHighlight}
          anchorRef={highlightsBtnRef}
        />

        {/* Desktop Side Margin Edge Navigation Arrows */}
        <EdgeArrows
          onPrev={() => canvasRef.current?.prev()}
          onNext={() => canvasRef.current?.next()}
          isAtStart={pageInfo.current <= 1 && currentProgress <= 0}
          isAtEnd={currentProgress >= 1}
          isMouseInWindow={isMouseInWindow}
        />

        {/* Desktop & Responsive Page Furniture (Running Head & Tabular Page Numbers) */}
        <PageFurniture
          isTwoPage={isTwoPageSpread}
          bookTitle={bookMeta?.title || "Flyleaf"}
          chapterTitle={chapterDisplayName || currentChapter || ""}
          currentPage={pageInfo.current}
          totalPages={pageInfo.total}
          pagesLeftInChapter={Math.max(0, pageInfo.total - pageInfo.current)}
          isLastPageInChapter={pageInfo.current >= pageInfo.total && pageInfo.total > 1}
          showToolbar={showHud || activeOverlay !== "none"}
          pageWidth={isTwoPageSpread ? Math.min(windowDims.width - 96, 1200) : Math.min(windowDims.width - 96, 704)}
        />

        {/* Main Kindle EPUB Canvas */}
        <ReaderCanvas
          ref={canvasRef}
          bookBlob={bookBlob}
          fallbackContent={DEMO_FALLBACK_CONTENT}
          initialCfi={targetCfi || bookMeta?.lastReadCfi}
          settings={readerSettings}
          highlights={highlights}
          cursorHidden={cursorHidden && !showHud && activeOverlay === "none" && !selectedData}
          isShortLandscape={isShortLandscape}
          onKeyDown={handleKeyDown}
          onIframeMouseMove={registerPointerActivity}
          onUserInteraction={registerPointerActivity}
          onToggleMenu={handleToggleHud}
          onNavigationLoaded={(loadedToc) => {
            if (Array.isArray(loadedToc)) setToc(loadedToc);
          }}
          onLocationChange={({ cfi, progress, chapter, page, totalPages, isLastPageInChapter, isResize }) => {
            if (cfi) setCurrentCfi(cfi);
            if (progress !== undefined) setCurrentProgress(progress);
            if (chapter) setCurrentChapter(chapter);
            if (page) setPageInfo({ current: page, total: totalPages || pageInfo.total });

            // End-of-chapter 2-second non-modal hint banner
            const isLast =
              isLastPageInChapter ||
              (page && totalPages && totalPages > 1 && page === totalPages);
            if (isLast) {
              const locKey = `${chapter || ""}-${page}-${totalPages}`;
              if (lastSeenEndOfChapterKeyRef.current !== locKey) {
                lastSeenEndOfChapterKeyRef.current = locKey;
                setEndOfChapterHint(true);
                clearTimeout(endOfChapterTimerRef.current);
                endOfChapterTimerRef.current = setTimeout(() => {
                  setEndOfChapterHint(false);
                }, 2000);
              }
            } else {
              if (endOfChapterHint) {
                setEndOfChapterHint(false);
                clearTimeout(endOfChapterTimerRef.current);
              }
            }

            // Dismiss any active word selection popover on page turn
            setSelectedData(null);

            lastInteractionRef.current = Date.now();

            // Count page flips after initial load
            if (isInitialLocationRef.current) {
              isInitialLocationRef.current = false;
            } else if (!isResize) {
              uncommittedPagesRef.current += 1;
            }

            if (!isResize) {
              saveReadingLocation(bookId, cfi, progress, chapter, page, totalPages);
            }
          }}
          onTextSelect={(selection) => {
            lastInteractionRef.current = Date.now();
            setSelectedData(selection);
          }}
        />

      {/* Reading Progress Subtle Indicator Bar matching designs/03-reader-viewport.html */}
      {activeOverlay === "none" && !selectedData && (
        <div
          aria-label={`${minutesLeftInChapter} minutes left in ${chapterDisplayName}`}
          style={{ color: "var(--reader-muted)" }}
          className={`fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-center space-y-1 text-center transition-all duration-300 w-[92vw] max-w-xs ${
            showHud
              ? isShortLandscape
                ? "bottom-12"
                : "bottom-18"
              : isShortLandscape
              ? "bottom-1.5"
              : "bottom-3"
          }`}
        >
          <div
            style={{ backgroundColor: "var(--reader-border)" }}
            className="w-full max-w-xs rounded-full h-1 overflow-hidden"
          >
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: "var(--reader-accent)",
                width: `${chapterProgressPercent}%`,
              }}
            />
          </div>
          <span
            style={{ color: "var(--reader-muted)" }}
            className="font-label-sm text-[10px] tracking-widest uppercase truncate max-w-full"
          >
            {pageInfo.current === pageInfo.total && pageInfo.total > 1
              ? `< 1 minute left in ${chapterDisplayName}`
              : `${minutesLeftInChapter} minute${minutesLeftInChapter === 1 ? "" : "s"} left in ${chapterDisplayName}`}
          </span>
        </div>
      )}

      {/* End of Chapter 2-second Non-Modal Hint Banner */}
      {endOfChapterHint && activeOverlay === "none" && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "var(--reader-bg)",
            borderColor: "var(--reader-border)",
            color: "var(--reader-fg)",
          }}
          className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full border font-label-md text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none transition-all duration-200 flex items-center gap-2 select-none"
        >
          <span
            style={{ color: "var(--reader-accent)" }}
            className="material-symbols-outlined text-[16px]"
          >
            arrow_forward
          </span>
          <span>End of chapter · swipe or press → to continue</span>
        </div>
      )}

      {/* Floating Selection & Dictionary Popover Card matching designs/03-reader-viewport.html */}
      {selectedData?.text && activeOverlay === "none" && (
        <section
          style={
            cardPosition.mode === "anchored"
              ? {
                  position: "fixed",
                  left: `${cardPosition.left}px`,
                  top: `${cardPosition.top}px`,
                  width: `${cardPosition.width}px`,
                  zIndex: 40,
                  backgroundColor: "var(--reader-bg)",
                  borderColor: "var(--reader-border)",
                  color: "var(--reader-fg)",
                }
              : {
                  backgroundColor: "var(--reader-bg)",
                  borderColor: "var(--reader-border)",
                  color: "var(--reader-fg)",
                }
          }
          className={`${
            cardPosition.mode === "anchored"
              ? "rounded-xl backdrop-blur-xl border editorial-shadow transition-all duration-150 overflow-hidden text-left shadow-2xl"
              : "fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm rounded-xl backdrop-blur-xl border editorial-shadow transition-all duration-200 overflow-hidden text-left shadow-2xl"
          }`}
        >
          {/* Subtle directional indicator */}
          <div
            style={{
              backgroundColor: "var(--reader-bg)",
              borderColor: "var(--reader-border)",
            }}
            className={`w-3 h-3 border-t border-l transform rotate-45 shadow-sm ${
              cardPosition.mode === "anchored" && cardPosition.isAbove
                ? "hidden"
                : "mx-auto -mt-1.5"
            }`}
          />

          {/* Dictionary or Passage Header */}
          <div
            style={{ borderColor: "var(--reader-border)" }}
            className="px-4 pt-3 pb-3 border-b"
          >
            {selectedData.text.trim().split(/\s+/).length <= 2 ? (
              /* Single Word Header */
              <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-2 truncate pr-2">
                  <span
                    style={{ color: "var(--reader-fg)" }}
                    className="font-headline-md text-headline-sm font-medium tracking-tight truncate max-w-[170px]"
                  >
                    {wordMeaning?.word || selectedData.text}
                  </span>
                  {wordMeaning?.phonetic && (
                    <span
                      style={{ color: "var(--reader-muted)" }}
                      className="text-caption font-mono"
                    >
                      {wordMeaning.phonetic}
                    </span>
                  )}
                  {wordMeaning && (
                    <button
                      type="button"
                      onClick={handlePronounce}
                      aria-label="Listen to pronunciation"
                      style={{ color: "var(--reader-muted)" }}
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
                    style={{
                      backgroundColor: "var(--reader-border)",
                      color: "var(--reader-fg)",
                    }}
                    className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase font-medium"
                  >
                    {wordMeaning?.partOfSpeech || "word"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedData(null)}
                    aria-label="Dismiss selection"
                    style={{ color: "var(--reader-muted)" }}
                    className="hover:opacity-80 transition-opacity p-1.5 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]" data-icon="close">
                      close
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Highlighted Passage Header */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5" style={{ color: "var(--reader-accent)" }}>
                  <span className="material-symbols-outlined text-[16px]" data-icon="format_quote">
                    format_quote
                  </span>
                  <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold">
                    Highlighted Passage
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    style={{
                      backgroundColor: "var(--reader-border)",
                      color: "var(--reader-fg)",
                    }}
                    className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase font-medium"
                  >
                    {selectedData.text.trim().split(/\s+/).length} words
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedData(null)}
                    aria-label="Dismiss selection"
                    style={{ color: "var(--reader-muted)" }}
                    className="hover:opacity-80 transition-opacity p-1.5 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]" data-icon="close">
                      close
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Definitions or Passage Body */}
            {selectedData.text.trim().split(/\s+/).length <= 2 ? (
              loadingMeaning ? (
                <div
                  style={{ color: "var(--reader-muted)" }}
                  className="py-2.5 flex items-center gap-2 text-caption font-body-ui"
                >
                  <span
                    style={{ borderColor: "var(--reader-fg)" }}
                    className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  />
                  <span>Looking up definition...</span>
                </div>
              ) : wordMeaning?.definitions?.length > 0 ? (
                <ol
                  style={{ color: "var(--reader-muted)" }}
                  className="mt-2.5 space-y-1.5 text-caption font-body-ui list-decimal list-inside leading-snug max-h-28 overflow-y-auto"
                >
                  {wordMeaning.definitions.map((def, idx) => (
                    <li key={idx}>
                      <span style={{ color: "var(--reader-fg)" }} className="font-medium">{def.split(" ")[0]}</span>{" "}
                      <span>{def.split(" ").slice(1).join(" ")}</span>
                    </li>
                  ))}
                </ol>
              ) : wordMeaning?.definition ? (
                <p
                  style={{ color: "var(--reader-muted)" }}
                  className="mt-2 text-caption font-body-ui leading-snug"
                >
                  {wordMeaning.definition}
                </p>
              ) : (
                <p
                  style={{ color: "var(--reader-muted)" }}
                  className="mt-2 text-caption font-body-ui leading-snug italic"
                >
                  “{selectedData.text}”
                </p>
              )
            ) : (
              <div className="mt-2 max-h-24 overflow-y-auto hide-scrollbar">
                <p
                  style={{ color: "var(--reader-fg)" }}
                  className="font-body-reading text-[13.5px] leading-[22px] italic select-text text-left"
                >
                  “{selectedData.text.trim().replace(/^["“'”]+|["“'”]+$/g, '').trim()}”
                </p>
              </div>
            )}
          </div>

          {/* Color Highlight Swatches */}
          <div
            style={{ borderColor: "var(--reader-border)" }}
            className="px-4 py-2 border-b flex items-center justify-between"
          >
            <div className="flex items-center space-x-1.5">
              <span
                style={{ color: "var(--reader-muted)" }}
                className="font-label-sm text-caption tracking-wider uppercase text-[10px]"
              >
                Highlight
              </span>
              {/* Swatches with 44px touch targets */}
              <div className="flex items-center space-x-0.5 ml-1">
                {/* Ochre */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#F3D382")}
                  aria-label="Warm Ochre Highlight"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-[#F3D382] flex items-center justify-center shadow-xs transition-transform ${
                      activeHighlightColor === "#F3D382"
                        ? "border-2 border-primary"
                        : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                    }`}
                  >
                    {activeHighlightColor === "#F3D382" && (
                      <span className="material-symbols-outlined text-[14px] font-bold" style={{ color: "inherit" }} data-icon="check">
                        check
                      </span>
                    )}
                  </span>
                </button>
                {/* Rose */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#F8B4B4")}
                  aria-label="Soft Rose Highlight"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-[#F8B4B4] flex items-center justify-center shadow-xs transition-transform ${
                      activeHighlightColor === "#F8B4B4"
                        ? "border-2 border-primary"
                        : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                    }`}
                  >
                    {activeHighlightColor === "#F8B4B4" && (
                      <span className="material-symbols-outlined text-[14px] font-bold" style={{ color: "inherit" }} data-icon="check">
                        check
                      </span>
                    )}
                  </span>
                </button>
                {/* Sky Blue */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#A7D2FB")}
                  aria-label="Sky Blue Highlight"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-[#A7D2FB] flex items-center justify-center shadow-xs transition-transform ${
                      activeHighlightColor === "#A7D2FB"
                        ? "border-2 border-primary"
                        : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                    }`}
                  >
                    {activeHighlightColor === "#A7D2FB" && (
                      <span className="material-symbols-outlined text-[14px] font-bold" style={{ color: "inherit" }} data-icon="check">
                        check
                      </span>
                    )}
                  </span>
                </button>
                {/* Sage Green */}
                <button
                  type="button"
                  onClick={() => handleAddHighlight("#B7DEBD")}
                  aria-label="Sage Green Highlight"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-[#B7DEBD] flex items-center justify-center shadow-xs transition-transform ${
                      activeHighlightColor === "#B7DEBD"
                        ? "border-2 border-primary"
                        : "border border-black/5 hover:ring-2 hover:ring-outline-variant/50"
                    }`}
                  >
                    {activeHighlightColor === "#B7DEBD" && (
                      <span className="material-symbols-outlined text-[14px] font-bold" style={{ color: "inherit" }} data-icon="check">
                        check
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
            {/* Underline Toggle */}
            <button
              type="button"
              onClick={() => handleAddHighlight("underline")}
              aria-label="Underline text"
              style={{
                backgroundColor: "var(--reader-border)",
                borderColor: "var(--reader-border)",
                color: "var(--reader-fg)",
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="font-headline-sm text-label-md underline font-semibold leading-none">
                U
              </span>
            </button>
          </div>

          {/* 5-Column Quick Actions Grid with 44px Touch Targets */}
          <div
            style={{
              backgroundColor: "var(--reader-bg)",
              borderColor: "var(--reader-border)",
            }}
            className="grid grid-cols-5 divide-x text-center py-1"
          >
            <button
              type="button"
              onClick={handleKeep}
              aria-label="Keep word or passage note"
              title="Keep note"
              style={{ color: "var(--reader-muted)", borderColor: "var(--reader-border)" }}
              className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="sticky_note_2">
                sticky_note_2
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Keep</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              title="Copy to clipboard"
              style={{ color: "var(--reader-muted)", borderColor: "var(--reader-border)" }}
              className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="content_copy">
                content_copy
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Copy</span>
            </button>
            <button
              type="button"
              onClick={handleExplain}
              aria-label="Explain with AI"
              title="Explain with AI"
              style={{ color: "var(--reader-accent)", borderColor: "var(--reader-border)" }}
              className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
                auto_awesome
              </span>
              <span className="font-label-sm text-[10px] mt-0.5 font-medium">Explain</span>
            </button>
            <button
              type="button"
              onClick={handleContext}
              aria-label="Historical context with AI"
              title="Context with AI"
              style={{ color: "var(--reader-muted)", borderColor: "var(--reader-border)" }}
              className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="history_edu">
                history_edu
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Context</span>
            </button>
            <button
              type="button"
              onClick={handleFind}
              aria-label="Search on Google"
              title="Search on Google"
              style={{ color: "var(--reader-muted)", borderColor: "var(--reader-border)" }}
              className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="search">
                search
              </span>
              <span className="font-label-sm text-[10px] mt-0.5">Find</span>
            </button>
          </div>
        </section>
      )}

      {/* BottomNavBar: Fixed h-16 (or h-10 in short landscape) matching designs/03-reader-viewport.html */}
      <nav
        style={{
          backgroundColor: "var(--reader-bg)",
          borderColor: "var(--reader-border)",
          color: "var(--reader-fg)",
        }}
        className={`fixed bottom-0 left-0 z-40 flex justify-between items-center px-gutter ${
          isShortLandscape ? "h-10" : "h-16"
        } bg-opacity-90 backdrop-blur-md border-t shadow-sm transition-all duration-300 ease-in-out ${bottomBarClass} ${
          showHud
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Item 1: Contents */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === "contents" ? "none" : "contents"))}
          aria-label="Table of contents (C)"
          title="Table of contents (C)"
          style={{ color: isContentsOpen ? "var(--reader-accent)" : "var(--reader-muted)" }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span style={{ color: "inherit" }} className="material-symbols-outlined" data-icon="menu_book">
            menu_book
          </span>
          <span style={{ color: "inherit" }} className="font-label-sm text-label-sm mt-0.5">Contents</span>
        </button>

        {/* Item 2: Active Reading Progress */}
        <button
          type="button"
          onClick={handleToggleHud}
          aria-label={`Reading progress: Page ${pageInfo.current} of ${pageInfo.total}, ${pct}%`}
          title={`Reading progress: Page ${pageInfo.current} of ${pageInfo.total} · ${pct}%`}
          style={{ color: "var(--reader-fg)" }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center font-medium hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <div className="flex items-center space-x-1.5">
            <span
              style={{ color: "var(--reader-accent)" }}
              className="material-symbols-outlined text-[16px]"
              data-icon="article"
            >
              article
            </span>
            <span style={{ color: "var(--reader-fg)" }} className="font-label-sm text-[11px] tracking-wider font-semibold">
              PAGE {pageInfo.current} OF {pageInfo.total} · {pct}%
            </span>
          </div>
          {/* Mini Progress Pip */}
          <div
            style={{ backgroundColor: "var(--reader-border)" }}
            className="w-16 h-1 rounded-full mt-1 overflow-hidden"
          >
            <div
              style={{
                backgroundColor: "var(--reader-accent)",
                width: `${Math.max(2, Math.min(100, pct))}%`,
              }}
              className="h-full rounded-full transition-all duration-300"
            />
          </div>
        </button>

        {/* Item 3: Appearance */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === "settings" ? "none" : "settings"))}
          aria-label="Appearance settings (A)"
          title="Appearance settings (A)"
          style={{ color: isSettingsOpen ? "var(--reader-accent)" : "var(--reader-muted)" }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span style={{ color: "inherit" }} className="material-symbols-outlined" data-icon="format_size">
            format_size
          </span>
          <span style={{ color: "inherit" }} className="font-label-sm text-label-sm mt-0.5">Appearance</span>
        </button>
      </nav>
      </div>

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
