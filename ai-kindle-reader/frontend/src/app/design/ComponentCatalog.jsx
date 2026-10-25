import { ControlsShowcase } from './ControlsShowcase';
import {
  SectionHeader,
  Card,
  StatBlock,
  Button,
  EmptyState,
  Skeleton,
  Popover,
  Cover,
} from '@/components/ui';

export function ComponentCatalog({
  activeSegment,
  setActiveSegment,
  selectedChips,
  toggleChip,
  setToastVisible,
  popoverOpen,
  setPopoverOpen,
  setSidePanelOpen,
}) {
  return (
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Component Library"
        title="Component Catalog & API Reference"
      />

      {/* Buttons, Chips, Segmented, Progress */}
      <ControlsShowcase
        activeSegment={activeSegment}
        setActiveSegment={setActiveSegment}
        selectedChips={selectedChips}
        toggleChip={toggleChip}
      />

      {/* 3. STATBLOCKS & CARDS */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Surfaces & Metrics" title="Cards & StatBlocks" hairline={false} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <StatBlock value="48m" label="Daily reading time" subtext="8m ahead of daily pace" />
          </Card>
          <Card>
            <StatBlock value="14" label="Books in vault" unit="titles" subtext="All stored offline" />
          </Card>
          <Card>
            <StatBlock value="3,412" label="Total pages turned" unit="pp" subtext="Across 18 sessions" />
          </Card>
          <Card interactive onClick={() => setToastVisible(true)}>
            <StatBlock value="82" label="Vocabulary words" unit="terms" subtext="Tap card to test toast" />
          </Card>
        </div>
      </div>

      {/* 5. COVERS (STORED VS TYPOGRAPHIC) */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Book Jackets" title="Cover: Stored Images & Typographic Fallback" hairline={false} />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <Cover title="The Odyssey" author="Homer" />
            <span className="text-[11px] text-muted font-sans block text-center">
              Typographic Jacket
            </span>
          </div>
          <div className="space-y-1.5">
            <Cover title="Meditations" author="Marcus Aurelius" />
            <span className="text-[11px] text-muted font-sans block text-center">
              Typographic Jacket
            </span>
          </div>
          <div className="space-y-1.5">
            <Cover title="Frankenstein" author="Mary Shelley" />
            <span className="text-[11px] text-muted font-sans block text-center">
              Typographic Jacket
            </span>
          </div>
          <div className="space-y-1.5">
            <Cover src="/test-cover.jpg" title="With Image" author="Author" />
            <span className="text-[11px] text-muted font-sans block text-center">
              Graceful Image Fallback
            </span>
          </div>
        </div>
      </div>

      {/* 6. EMPTY STATES & SKELETONS */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Placeholders" title="EmptyState & Skeleton Loaders" hairline={false} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmptyState
            icon="auto_stories"
            title="Your desk is clear"
            description="Upload an EPUB from your files or explore public domain titles in The Commons."
            action={<Button variant="primary">Browse catalog</Button>}
          />

          <Card className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium">
              Skeleton Shimmer (Zero Layout Shift)
            </p>
            <div className="space-y-3">
              <Skeleton variant="title" width="60%" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="85%" />
              <div className="pt-2 flex gap-2">
                <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
                <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 7. FLOATING OVERLAYS (POPOVER, SIDE PANEL & TOAST) */}
      <div className="space-y-4">
        <SectionHeader eyebrow="Overlays" title="Floating Popover, SidePanel & Toast" hairline={false} />
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            {/* Popover Demo */}
            <Popover
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              trigger={
                <Button
                  variant="secondary"
                  icon="tune"
                  onClick={() => setPopoverOpen((p) => !p)}
                >
                  Open Popover
                </Button>
              }
            >
              <div className="space-y-2.5">
                <div className="border-b border-hairline pb-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-medium">
                    Reading Density
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] text-ink hover:bg-hairline/20 transition-colors"
                >
                  Comfortable (19px)
                </button>
                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] text-ink hover:bg-hairline/20 transition-colors"
                >
                  Compact (16px)
                </button>
              </div>
            </Popover>

            {/* SidePanel Demo */}
            <Button
              variant="secondary"
              icon="menu"
              onClick={() => setSidePanelOpen(true)}
            >
              Open Side Panel
            </Button>

            {/* Toast Demo */}
            <Button
              variant="secondary"
              icon="notifications"
              onClick={() => setToastVisible(true)}
            >
              Show Toast
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
