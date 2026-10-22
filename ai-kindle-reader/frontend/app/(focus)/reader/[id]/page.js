"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReaderCanvas from "@/components/ReaderCanvas";
import SettingsMenu from "@/components/SettingsMenu";
import AiDrawer from "@/components/AiDrawer";
import {
  getBookBlob,
  getBookMeta,
  saveReadingLocation,
  saveVocabularyWord,
} from "@/utils/db";
import { booksData } from "@/utils/booksData";

// Reliable CORS-friendly public EPUB fallback so demo books ALWAYS open and flip pages
const FALLBACK_EPUB_URL = "https://s3.amazonaws.com/moby-dick/moby-dick.epub";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = decodeURIComponent(params?.id || "");

  const [bookMeta, setBookMeta] = useState(null);
  const [bookBlob, setBookBlob] = useState(null);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Reader appearance states
  const [theme, setTheme] = useState("night");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("serif");

  // UI Overlay state: "none" | "hud" | "settings" | "ai"
  const [activeOverlay, setActiveOverlay] = useState("none");

  // Word Lookup & Selection states
  const [selectedData, setSelectedData] = useState(null); // { text, contextSentence }
  const [wordMeaning, setWordMeaning] = useState(null);
  const [loadingMeaning, setLoadingMeaning] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // 1. Load book from IndexedDB (or fallback to sample EPUB if clicking a mock book)
  useEffect(() => {
    if (!bookId) return;

    async function loadBook() {
      setLoadingDb(true);
      try {
        const [meta, blob] = await Promise.all([
          getBookMeta(bookId),
          getBookBlob(bookId),
        ]);

        if (blob) {
          setBookMeta(meta || { id: bookId, title: "Saved Book", author: "Unknown" });
          setBookBlob(blob);
        } else {
          // Check if it's a static mock book from booksData.js
          const mockBook = Array.isArray(booksData)
            ? booksData.find((b) => String(b.id) === String(bookId))
            : null;

          setBookMeta(
            mockBook ||
              meta || {
                id: bookId,
                title: "Classic Sample Edition",
                author: "Herman Melville",
              }
          );
          setFallbackUrl(FALLBACK_EPUB_URL);
        }
      } catch (err) {
        console.error("Error loading book from DB:", err);
        setFallbackUrl(FALLBACK_EPUB_URL);
      } finally {
        setLoadingDb(false);
      }
    }

    loadBook();
  }, [bookId]);

  // 2. Automatically fetch Dictionary Meaning when 1-2 words are selected
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
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data[0]?.meanings?.[0]) {
            const firstMeaning = data[0].meanings[0];
            setWordMeaning({
              word: data[0].word,
              phonetic: data[0].phonetic || "",
              partOfSpeech: firstMeaning.partOfSpeech,
              definition:
                firstMeaning.definitions?.[0]?.definition ||
                "No definition found.",
            });
          } else {
            setWordMeaning({
              word: cleanWord,
              partOfSpeech: "phrase",
              definition: "Tap 'Ask AI' below for contextual meaning.",
            });
          }
        })
        .catch(() => {
          setWordMeaning({
            word: cleanWord,
            partOfSpeech: "lookup",
            definition: "Offline or not found in standard dictionary. Tap 'Ask AI'.",
          });
        })
        .finally(() => setLoadingMeaning(false));
    } else {
      setWordMeaning(null);
    }
  }, [selectedData]);

  // 3. Save word to localForage Vocabulary store
  async function handleSaveVocab() {
    if (!wordMeaning) return;
    await saveVocabularyWord({
      word: wordMeaning.word,
      definition: wordMeaning.definition,
      contextSentence: selectedData?.contextSentence || "",
      bookId,
      bookTitle: bookMeta?.title || "Book",
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }

  if (loadingDb) {
    return (
      <div className="w-full h-dvh bg-black text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400 animate-pulse">Loading reader...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden select-none">
      {/* Top HUD Bar (Toggled by tapping center of screen) */}
      {activeOverlay !== "none" && (
        <header className="fixed top-0 inset-x-0 z-30 h-14 px-4 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white">
          <button
            onClick={() => router.push("/library")}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            ← Library
          </button>
          <div className="text-center truncate px-2">
            <p className="text-xs font-semibold truncate max-w-[200px]">
              {bookMeta?.title || "Reading"}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {bookMeta?.author}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setActiveOverlay(
                  activeOverlay === "settings" ? "hud" : "settings"
                )
              }
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-serif font-bold"
            >
              Aa
            </button>
            <button
              onClick={() =>
                setActiveOverlay(activeOverlay === "ai" ? "hud" : "ai")
              }
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium"
            >
              ✨ AI
            </button>
          </div>
        </header>
      )}

      {/* Main Kindle EPUB Canvas */}
      <ReaderCanvas
        bookBlob={bookBlob}
        fallbackUrl={fallbackUrl}
        initialCfi={bookMeta?.lastReadCfi}
        theme={theme}
        fontSize={fontSize}
        fontFamily={fontFamily}
        onToggleMenu={() =>
          setActiveOverlay((prev) => (prev === "none" ? "hud" : "none"))
        }
        onLocationChange={({ cfi, progress, chapter }) => {
          saveReadingLocation(bookId, cfi, progress, chapter);
        }}
        onTextSelect={(selection) => {
          setSelectedData(selection);
        }}
      />

      {/* Instant Word Meaning & AI Selection Popup Card */}
      {selectedData?.text && (
        <div className="fixed bottom-6 inset-x-4 z-40 max-w-md mx-auto bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
                {wordMeaning ? `Dictionary • ${wordMeaning.partOfSpeech}` : "Selected Passage"}
              </span>
              <h4 className="text-base font-bold mt-0.5 line-clamp-1">
                “{selectedData.text}”
              </h4>
            </div>
            <button
              onClick={() => setSelectedData(null)}
              className="text-zinc-400 hover:text-white text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>

          {loadingMeaning && (
            <p className="text-xs text-zinc-400 py-2">Looking up definition...</p>
          )}

          {wordMeaning && !loadingMeaning && (
            <p className="text-xs text-zinc-200 leading-relaxed mb-3">
              {wordMeaning.definition}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {wordMeaning && (
              <button
                onClick={handleSaveVocab}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition"
              >
                {savedToast ? "✓ Saved to Vocab!" : "+ Save Word"}
              </button>
            )}
            <button
              onClick={() => setActiveOverlay("ai")}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium transition"
            >
              ✨ Ask AI to Explain
            </button>
          </div>
        </div>
      )}

      {/* "Aa" Typography & Theme Drawer */}
      {activeOverlay === "settings" && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-5 text-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Reading Appearance
            </span>
            <button
              onClick={() => setActiveOverlay("none")}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Done
            </button>
          </div>

          {/* Theme Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { id: "day", label: "Day", bg: "#FDFBF7", text: "#111111" },
              { id: "sepia", label: "Sepia", bg: "#F4ECD8", text: "#2C2214" },
              { id: "night", label: "Night", bg: "#000000", text: "#A0A0A0" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{ backgroundColor: t.bg, color: t.text }}
                className={`py-2.5 rounded-xl text-xs font-semibold border ${
                  theme === t.id ? "ring-2 ring-blue-500 border-transparent" : "border-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Font Family */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setFontFamily("serif")}
              className={`py-2 rounded-xl text-xs font-serif border ${
                fontFamily === "serif"
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white border-white/10"
              }`}
            >
              Serif (Kindle)
            </button>
            <button
              onClick={() => setFontFamily("sans")}
              className={`py-2 rounded-xl text-xs font-sans border ${
                fontFamily === "sans"
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white border-white/10"
              }`}
            >
              Sans-Serif
            </button>
          </div>

          {/* Font Size Step Controls */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-2">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              className="px-4 py-1.5 rounded-lg bg-white/10 text-sm font-bold"
            >
              A-
            </button>
            <span className="text-xs text-zinc-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
              className="px-4 py-1.5 rounded-lg bg-white/10 text-sm font-bold"
            >
              A+
            </button>
          </div>
        </div>
      )}

      {/* AI Assistant Drawer */}
      {activeOverlay === "ai" && (
        <AiDrawer
          isOpen={true}
          onClose={() => setActiveOverlay("none")}
          selectedText={selectedData?.text || ""}
          bookTitle={bookMeta?.title || "Current Book"}
          author={bookMeta?.author || "Unknown Author"}
        />
      )}
    </div>
  );
}
