import { PALETTE_SPECS, getContrast } from './design-helpers';
import {
  SectionHeader,
  Card,
  StatBlock,
  Button,
  Chip,
  ProgressLine,
  EmptyState,
  Cover,
} from '@/components/ui';

export function PaletteMatrix({
  activeAppPalette,
  setPalette,
  selectedViewMode,
}) {
  return (
    <>
      {/* SECTION 1: PALETTE MATRIX & CONTRAST RATIOS */}
      <section className="space-y-6 mb-14">
        <SectionHeader
          eyebrow="Color & Contrast"
          title="The Four Editorial Palettes"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PALETTE_SPECS.map((pal) => {
            const inkContrast = getContrast(pal.ink, pal.bg);
            const mutedContrast = getContrast(pal.muted, pal.bg);
            const isSelected = activeAppPalette === pal.id;

            return (
              <div
                key={pal.id}
                data-theme={pal.id}
                className={`${pal.id} bg-surface border border-hairline rounded-[12px] p-5 flex flex-col justify-between transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-accent' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif text-[20px] text-ink font-normal">
                      {pal.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPalette(pal.id)}
                      className="text-[10.5px] uppercase tracking-[0.12em] text-accent font-medium hover:underline focus:outline-none"
                    >
                      {isSelected ? 'Active' : 'Apply'}
                    </button>
                  </div>

                  <p className="text-[13px] text-muted leading-relaxed mb-4">
                    Background: <code className="font-mono text-ink text-[12px]">{pal.bg}</code>
                    <br />
                    Ink: <code className="font-mono text-ink text-[12px]">{pal.ink}</code>
                    <br />
                    Accent: <code className="font-mono text-ink text-[12px]">{pal.accent}</code>
                  </p>

                  <div className="space-y-2 pt-2 border-t border-hairline text-[11px] font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Ink on background</span>
                      <span className="tabular-nums font-medium text-ink">
                        {inkContrast}:1 ✅
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Muted on background</span>
                      <span className="tabular-nums font-medium text-muted">
                        {mutedContrast}:1 ✅
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-hairline flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-hairline"
                    style={{ backgroundColor: pal.bg }}
                    title="Background"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-hairline"
                    style={{ backgroundColor: pal.ink }}
                    title="Ink"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-hairline"
                    style={{ backgroundColor: pal.muted }}
                    title="Muted"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-hairline"
                    style={{ backgroundColor: pal.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: 4-PALETTE MATRIX SHOWCASE */}
      {selectedViewMode === 'comparison' && (
        <section className="space-y-8 mb-16">
          <SectionHeader
            eyebrow="Matrix Comparison"
            title="Every Component Rendered Across All 4 Palettes"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {PALETTE_SPECS.map((pal) => (
              <div
                key={pal.id}
                data-theme={pal.id}
                className={`${pal.id} bg-background text-ink border border-hairline rounded-[16px] p-5 space-y-6 transition-colors`}
              >
                {/* Palette Badge */}
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <span className="font-serif text-[18px] text-ink font-normal">
                    {pal.name} Palette
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-medium">
                    100% Theme Match
                  </span>
                </div>

                {/* Card & StatBlock */}
                <Card>
                  <StatBlock value="284" label="Pages read this week" unit="pp" />
                  <div className="mt-4 pt-3 border-t border-hairline">
                    <ProgressLine value={64} max={100} thickness="regular" label="Weekly goal" showPercentage />
                  </div>
                </Card>

                {/* Controls (Buttons & Chips) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm">Primary</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="ghost" size="sm">Ghost</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip label="Fiction" selected={true} />
                    <Chip label="Essays" selected={false} />
                  </div>
                </div>

                {/* Typographic Cover */}
                <div className="w-40 mx-auto">
                  <Cover
                    title="Crime and Punishment"
                    author="Fyodor Dostoevsky"
                  />
                </div>

                {/* Quiet Empty State in Palette */}
                <EmptyState
                  icon="bookmark"
                  title="No bookmarks yet"
                  description="Tap while reading to save memorable passages."
                  action={<Button variant="secondary" size="sm">Add bookmark</Button>}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
