import { TOPICS } from '../constants';
import Chip from '@/components/ui/Chip';

export function BrowseSearchHeader({
  searchQuery,
  setSearchQuery,
  isSearching,
  isSearchMode,
  selectedTopic,
  setSelectedTopic,
  onClearSearch,
}) {
  return (
    <div className="space-y-4 max-w-[40rem]">
      <div className="relative flex items-center">
        <span
          className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
          aria-hidden="true"
        >
          search
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search title, author, or subject…"
          type="text"
          className="w-full min-h-[44px] bg-surface-container-low text-on-surface placeholder:text-on-surface-variant border border-outline-variant/30 rounded-full pl-10 pr-10 py-2.5 text-sm font-sans focus:outline-none focus:border-outline-variant transition-colors"
        />
        {isSearching ? (
          <span className="absolute right-4 w-2 h-2 rounded-full bg-accent animate-pulse" aria-label="Searching…" />
        ) : searchQuery ? (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-1.5 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-muted hover:text-ink transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              close
            </span>
          </button>
        ) : null}
      </div>

      {/* Topic Chips */}
      {!isSearchMode && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 py-1">
          {TOPICS.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              selected={selectedTopic === topic}
              onClick={() => setSelectedTopic(topic)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
