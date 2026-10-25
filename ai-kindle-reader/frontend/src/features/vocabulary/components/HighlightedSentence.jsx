export function HighlightedSentence({ sentence, word }) {
  if (!sentence) return null;
  if (!word) {
    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
        “{sentence}”
      </p>
    );
  }

  try {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = sentence.split(regex);

    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
        “
        {parts.map((part, idx) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <span
              key={idx}
              className="underline decoration-accent underline-offset-4 text-ink font-serif italic font-normal"
            >
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
        ”
      </p>
    );
  } catch {
    return (
      <p className="font-serif italic text-[15px] text-ink leading-relaxed">
        “{sentence}”
      </p>
    );
  }
}
