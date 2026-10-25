import {
  SectionHeader,
  Card,
  Button,
  Chip,
  Segmented,
  ProgressLine,
} from '@/components/ui';

export function ControlsShowcase({
  activeSegment,
  setActiveSegment,
  selectedChips,
  toggleChip,
}) {
  return (
    <>
      {/* 1. BUTTONS & CONTROLS */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Controls" title="Button Variants & Touch Targets" hairline={false} />
        <Card>
          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-3">
                Pill Button Variants (Max weight 500, min 44px touch targets on mobile)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Pill</Button>
                <Button variant="secondary">Secondary Pill</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="icon" aria-label="Settings" icon="tune" />
                <Button variant="icon" aria-label="Bookmark" icon="bookmark" />
                <Button variant="primary" disabled>Disabled Primary</Button>
                <Button variant="secondary" disabled>Disabled Secondary</Button>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-3">
                Button Sizes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary" icon="arrow_back">Small</Button>
                <Button size="md" variant="secondary" icon="download">Medium</Button>
                <Button size="lg" variant="secondary" icon="menu_book">Large</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. CHIPS & SEGMENTED CONTROLS */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Selection" title="Chips & Segmented Tabs" hairline={false} />
        <Card>
          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-3">
                Pill Chips (Unselected vs Selected with 300-weight Checkmark)
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="All Classics"
                  selected={selectedChips.has('classics')}
                  count={42}
                  onClick={() => toggleChip('classics')}
                />
                <Chip
                  label="Philosophy"
                  selected={selectedChips.has('philosophy')}
                  count={18}
                  onClick={() => toggleChip('philosophy')}
                />
                <Chip
                  label="Gothic Fiction"
                  selected={selectedChips.has('gothic')}
                  count={9}
                  onClick={() => toggleChip('gothic')}
                />
                <Chip
                  label="Essays"
                  selected={selectedChips.has('essay')}
                  count={14}
                  onClick={() => toggleChip('essay')}
                />
                <Chip label="Disabled Chip" disabled />
              </div>
            </div>

            <div className="pt-4 border-t border-hairline">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-3">
                Segmented Control
              </p>
              <Segmented
                options={[
                  { id: 'all', label: 'All Titles', badge: 12 },
                  { id: 'reading', label: 'Reading', badge: 3 },
                  { id: 'finished', label: 'Finished', badge: 9 },
                ]}
                value={activeSegment}
                onChange={setActiveSegment}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 4. PROGRESS LINES & ACCENT INDICATORS */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Single Accent Hue" title="ProgressLine (2px & 4px)" hairline={false} />
        <Card>
          <div className="space-y-6 max-w-xl">
            <div>
              <ProgressLine
                value={72}
                max={100}
                thickness="regular"
                label="Chapter IV · Moby Dick"
                showPercentage
              />
            </div>
            <div>
              <ProgressLine
                value={34}
                max={100}
                thickness="thin"
                label="Thin 2px line · Page 184 of 542"
                showPercentage
              />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
