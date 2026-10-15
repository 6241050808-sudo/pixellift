# Design Brief

## Direction

PixelLift — a dark, professional image-upscaling studio where the image is the only thing allowed to be vivid.

## Tone

Refined industrial studio tool: near-black neutral surfaces, restrained chrome, one electric-lime accent — the interface recedes so the pixels can speak.

## Differentiation

A neutral checkerboard canvas language that runs through import, comparison, and result zones — turning "transparency" into the app's signature material.

## Color Palette

| Token      | OKLCH        | Role                                            |
| ---------- | ------------ | ----------------------------------------------- |
| background | 0.13 0.004 260 | near-black neutral app surface                |
| foreground | 0.95 0.004 260 | primary text                                  |
| card       | 0.175 0.005 260 | panels, nav, settings surfaces               |
| primary    | 0.88 0.2 118   | single accent — primary actions, active state   |
| accent     | 0.88 0.2 118   | matches primary; used sparingly for highlights  |
| muted      | 0.23 0.006 260 | secondary surfaces, inactive controls           |
| border     | 0.28 0.006 260 | hairline separation between zones               |
| destructive| 0.65 0.19 22   | errors, unsupported file, delete confirmation   |
| success    | 0.72 0.16 150  | completed job status                            |

## Typography

- Display: Space Grotesk — headings, wordmark, result stats (Thai falls back to Noto Sans Thai)
- Body: DM Sans — UI labels, paragraphs, Thai UI text (Noto Sans Thai fallback)
- Mono: Geist Mono — pixel dimensions, file sizes, resolution readouts
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base`

## Elevation & Depth

Flat near-black base with layered cards: `shadow-subtle` for panels, `shadow-elevated` for popovers, and `shadow-canvas` (inset hairline + deep drop) for the image result frame.

## Structural Zones

| Zone    | Background              | Border          | Notes                                              |
| ------- | ----------------------- | --------------- | -------------------------------------------------- |
| Header  | bg-card                 | border-b        | wordmark left, Studio/History nav, auth status right |
| Content | bg-background           | —               | import + settings row, then result canvas section  |
| Canvas  | canvas-checkerboard     | border + shadow-canvas | neutral checkerboard frame isolates the image |
| Footer  | bg-muted/40             | border-t        | local-processing privacy note, minimal             |

## Spacing & Rhythm

Generous 24–40px section gaps; 16px card padding on mobile, 24px on desktop; 8px micro-spacing inside control groups; zones separated by hairline borders, never by color alone.

## Component Patterns

- Buttons: rounded-xl; primary = solid electric-lime with dark text, secondary = muted surface with border, hover lifts with `shadow-elevated` + `transition-smooth`
- Cards: rounded-2xl, `bg-card`, 1px `border-border`, `shadow-subtle`; drop area uses dashed border that turns primary on drag-over
- Badges: pill-shaped, `bg-muted` with `text-muted-foreground`; status badges use success/destructive tints
- Comparison slider: vertical handle with a 2px primary line and a circular grip; divider is draggable, keyboard-accessible

## Motion

- Entrance: `rise-in` (0.45s) for panels and result cards, staggered 60ms
- Hover: `transition-smooth` on all interactive surfaces; primary button brightens
- Decorative: `scan-line` sweep across the canvas during processing; `pulse-soft` on the progress label

## Constraints

- Dark-only professional theme; light tokens exist for AA+ completeness but are not surfaced
- No glow/neon shadows — depth comes from layered neutrals and hairline borders
- Image is always the highest-contrast element; never place a saturated surface behind an image
- Thai UI text must render with full glyph coverage via the Noto Sans Thai fallback chain
- No batch processing or fine-grained sharpness/noise/compression sliders (out of scope)

## Signature Detail

The neutral checkerboard material — appearing at three scales (import thumb, comparison backdrop, result frame) — makes transparency and resolution legible at a glance and gives the studio a recognizable visual signature.
