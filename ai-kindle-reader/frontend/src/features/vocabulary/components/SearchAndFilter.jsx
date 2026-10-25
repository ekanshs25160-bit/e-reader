import Chip from '@/components/ui/Chip';

export function SearchAndFilter({
  searchQuery,
  setSearchQuery,
  wordsCount,
  bookFilterChips,
  selectedBook,
  setSelectedBook,
}) {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center">
        <span
          className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          aria-hidden="true"
        >
          search
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search words, definitions, or sentences…"
          type="text"
          className="w-full min-h-[44px] bg-surface-container-low text-on-surface placeholder:text-on-surface-variant border border-outline-variant/30 rounded-full pl-10 pr-10 py-2.5 text-sm font-sans focus:outline-none focus:border-outline-variant transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-1.5 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Clear search"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              close
            </span>
          </button>
        )}
      </div>

      {/* Book Filter Chips */}
      {wordsCount > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 py-1">
          {bookFilterChips.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              count={chip.count}
              selected={selectedBook === chip.id}
              onClick={() => setSelectedBook(chip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
