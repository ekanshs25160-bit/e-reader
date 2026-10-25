'use client';

import React, { useState } from 'react';
import { PALETTE_SPECS } from './design-helpers';
import { PaletteMatrix } from './PaletteMatrix';
import { ComponentCatalog } from './ComponentCatalog';
import {
  PageHeader,
  Card,
  Button,
  Segmented,
  Toast,
  SidePanel,
} from '@/components/ui';
import { useTheme } from '@/components/common/ThemeProvider';

export function DesignShowcase() {
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

      {/* SECTION 1 & 2: PALETTE MATRIX & COMPARISON */}
      <PaletteMatrix
        activeAppPalette={activeAppPalette}
        setPalette={setPalette}
        selectedViewMode={selectedViewMode}
      />

      {/* SECTION 3: COMPREHENSIVE COMPONENT CATALOG */}
      <ComponentCatalog
        activeSegment={activeSegment}
        setActiveSegment={setActiveSegment}
        selectedChips={selectedChips}
        toggleChip={toggleChip}
        setToastVisible={setToastVisible}
        popoverOpen={popoverOpen}
        setPopoverOpen={setPopoverOpen}
        setSidePanelOpen={setSidePanelOpen}
      />

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
