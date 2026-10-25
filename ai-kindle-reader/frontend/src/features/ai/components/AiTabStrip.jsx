export function AiTabStrip({
  activeTab,
  onTabChange,
  savedJournal,
  isShortSnippet,
  cleanWord,
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {/* Explain Subtext */}
      <button
        type="button"
        onClick={() => onTabChange('subtext')}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
          activeTab === 'subtext'
            ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
            : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span
          className="material-symbols-outlined text-[15px] text-secondary-fixed"
          data-icon="sparkles"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span>Explain Subtext</span>
      </button>

      {/* Chapter Summary */}
      <button
        type="button"
        onClick={() => onTabChange('summary')}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
          activeTab === 'summary'
            ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
            : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-[15px]" data-icon="menu_book">
          menu_book
        </span>
        <span>Chapter Summary</span>
      </button>

      {/* Author & Era */}
      <button
        type="button"
        onClick={() => onTabChange('author')}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
          activeTab === 'author'
            ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
            : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-[15px]" data-icon="travel_explore">
          travel_explore
        </span>
        <span>Author &amp; Era</span>
      </button>

      {/* Save to Journal */}
      <button
        type="button"
        onClick={() => onTabChange('journal')}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
          savedJournal
            ? 'bg-secondary-container/60 border border-secondary text-on-secondary-container font-semibold'
            : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span
          className="material-symbols-outlined text-[15px]"
          data-icon="bookmark_add"
          style={{ fontVariationSettings: savedJournal ? "'FILL' 1" : "'FILL' 0" }}
        >
          bookmark_add
        </span>
        <span>{savedJournal ? 'Saved to Journal ✓' : 'Save to Journal'}</span>
      </button>

      {/* Optional Define Tab if short snippet */}
      {isShortSnippet && (
        <button
          type="button"
          onClick={() => onTabChange('define')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
            activeTab === 'define'
              ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
              : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]" data-icon="dictionary">
            menu_book
          </span>
          <span>Define &ldquo;{cleanWord}&rdquo;</span>
        </button>
      )}
    </div>
  );
}
