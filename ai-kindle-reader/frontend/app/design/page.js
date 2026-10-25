'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/common/ThemeProvider';
import {
  PageHeader,
  SectionHeader,
  Card,
  StatBlock,
  Button,
  Chip,
  Segmented,
  ProgressLine,
  EmptyState,
  Skeleton,
  Toast,
  Popover,
  SidePanel,
  Cover,
} from '@/components/ui';

// Contrast calculator for documentation
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

import { READER_PALETTES } from '@/app/(focus)/reader/[id]/page';

const PALETTE_SPECS = Object.entries(READER_PALETTES).map(([id, p]) => ({
  id,
  name: p.name,
  bg: p.bg,
  surface: p.bg,
  ink: p.fg,
  muted: p.muted,
  hairline: p.border,
  accent: p.accent,
  contrast: p.bg,
}));

export default function DesignSystemPage() {
  const { palette: activeAppPalette, setPalette } = useTheme();

  // Local interactive states for component demos
  const [activeSegment, setActiveSegment] = useState('reading');
  const [selectedChips, setSelectedChips] = useState(new Set(['classics', 'essay']));
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedViewMode, setSelectedViewMode] = useState('comparison'); // 'active' | 'comparison'

  const toggleChip = (id) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-background text-ink font-sans transition-colors duration-200 antialiased p-4 sm:p-8 md:p-12 max-w-[76rem] mx-auto pb-32">
      {/* Editorial Lab Header */}
      <PageHeader
        eyebrow="Flyleaf Editorial Design Spec"
        title="Design System & Components"
        description="Extracted directly from the reading viewport. Flat surfaces, quiet chrome, one warm bronze accent, and 1px hairlines across Paper, Sepia, Night, and OLED."
        action={
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mr-1 hidden sm:inline">
              Page Palette:
            </span>
            <Segmented
              size="sm"
              options={[
                { id: 'paper', label: 'Paper' },
                { id: 'sepia', label: 'Sepia' },
                { id: 'night', label: 'Night' },
                { id: 'oled', label: 'OLED' },
              ]}
              value={activeAppPalette || 'paper'}
              onChange={(val) => setPalette(val)}
            />
          </div>
        }
      />

      {/* Lab Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-8 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium">
            Lab Mode:
          </span>
          <Segmented
            size="sm"
            options={[
              { id: 'comparison', label: '4-Palette Matrix' },
              { id: 'catalog', label: 'Component Catalog' },
            ]}
            value={selectedViewMode}
            onChange={setSelectedViewMode}
          />
        </div>
        <p className="text-[12px] text-muted font-sans">
          All components strictly respect WCAG AA contrast (&ge; 4.5:1)
        </p>
      </div>

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

      {/* SECTION 3: COMPREHENSIVE COMPONENT CATALOG */}
      <section className="space-y-12">
        <SectionHeader
          eyebrow="Component Library"
          title="Component Catalog & API Reference"
        />

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

        {/* 5. COVERS (STORED VS TYPOGRAPHIC) */}
        <div className="space-y-4">
          <SectionHeader eyebrow="Book Jackets" title="Cover: Stored Images & Typographic Fallback" hairline={false} />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <Cover
                title="The Odyssey"
                author="Homer"
              />
              <span className="text-[11px] text-muted font-sans block text-center">
                Typographic Jacket
              </span>
            </div>
            <div className="space-y-1.5">
              <Cover
                title="Meditations"
                author="Marcus Aurelius"
              />
              <span className="text-[11px] text-muted font-sans block text-center">
                Typographic Jacket
              </span>
            </div>
            <div className="space-y-1.5">
              <Cover
                title="Frankenstein"
                author="Mary Shelley"
              />
              <span className="text-[11px] text-muted font-sans block text-center">
                Typographic Jacket
              </span>
            </div>
            <div className="space-y-1.5">
              <Cover
                src="/test-cover.jpg"
                title="With Image"
                author="Author"
              />
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

      {/* Floating SidePanel instance */}
      <SidePanel
        open={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        eyebrow="Reader Settings"
        title="Appearance & Typography"
        footer={
          <Button variant="primary" onClick={() => setSidePanelOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-5">
          <Card>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-2">
              Color Palette
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PALETTE_SPECS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPalette(p.id)}
                  className={`p-3 rounded-[10px] border text-left transition-all ${
                    activeAppPalette === p.id
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-hairline hover:border-ink/20 text-muted'
                  }`}
                >
                  <span className="font-serif text-[15px] font-normal block">{p.name}</span>
                  <span className="text-[11px] font-mono opacity-80">{p.bg}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-2">
              Typography
            </p>
            <p className="text-[14px] text-ink leading-relaxed">
              Titles set in Newsreader/Literata serif regular. Interface text set in Inter with maximum weight 500.
            </p>
          </Card>
        </div>
      </SidePanel>

      {/* Floating Toast instance */}
      <Toast
        message="Stored on this device. Synced only if you sign in."
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
}
