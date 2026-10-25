# Flyleaf E2E & Smoke Check Suite

This directory documents the end-to-end integration and smoke check suites for Flyleaf.

The executable Playwright check scripts reside in `scripts/`:
- `scripts/reader-check.mjs`: Tests reader layout, zero horizontal clipping, gutter symmetry, neighboring page containment, contrast ratios, and CFI stability across 8 viewport sizes and 4 color palettes (Paper, Sepia, Night, OLED) — 160 automated checks.
- `scripts/ui-check.mjs`: Comprehensive UI inspection suite auditing all application routes (`/`, `/library`, `/browse`, `/stats`, `/vocabulary`, `/settings`, `/book/[id]`, `/reader/[id]`) across mobile, tablet, and desktop viewports in all 4 palettes for zero hardcoded colors, token compliance, and visual regression (417 checks).

### Execution
```bash
npm run check:reader   # Run the 160-check reader layout smoke suite
npm run check:ui       # Run the 417-check design system UI suite
npm run test:e2e       # Run both suites sequentially
```
