---
name: SDM Handal
description: Sistem manajemen SDM yang presisi dan klinis untuk RS Bhayangkara Nganjuk.
colors:
  primary-sky: "#E0F2FE"
  primary-sky-hover: "#BAE6FD"
  active-cyan: "#0EA5E9"
  brand-cyan: "#0284C7"
  deep-sky-accent: "#0369A1"
  muted-slate: "#475569"
  border-slate: "#E2E8F0"
  pale-cyan: "#F0F9FF"
  neutral-surface: "#F8FAFC"
  destructive-red: "#DC2626"
typography:
  display:
    fontFamily: "Figtree, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Figtree, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Noto Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-cyan}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.destructive-red}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "transparent"
    textColor: "#0F172A"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "#FFFFFF"
    textColor: "#0F172A"
    rounded: "{rounded.lg}"
    padding: "24px"

# Design System: SDM Handal

## Overview

**Creative North Star: "Pusat Layanan SDM Tepercaya"**

SDM Handal should feel like a dependable clinical operations desk: calm enough for sensitive employee work, exact enough for payroll and attendance decisions, and structured enough to make approvals legible. The visual system uses a clean cyan-blue medical palette against pale neutral surfaces, with dark slate text and restrained elevation so information remains the dominant signal.

The interface is operational rather than decorative. Rounded surfaces, compact data typography, clear status color, and responsive navigation create a consistent environment across employee self-service and HRD/IT administration. The tone is precise and clinical: confident through consistency, not through visual noise.

**Key Characteristics:**

- Cyan-blue accents on pale, quiet surfaces.
- Figtree for UI hierarchy and Noto Sans for longer explanatory copy.
- Rounded, tactile controls with visible hover and focus states.
- Dense but breathable dashboard layouts that prioritize scanability.

## Colors

The palette is a vivid cyan-blue system grounded by near-neutral slate surfaces. Accent color is reserved for action, active navigation, focus, and operational status.

### Primary

- **Primary Sky** (`#E0F2FE`): Light brand field for sidebar and primary structural surfaces.
- **Active Cyan** (`#0EA5E9`): Selected navigation and active-state emphasis.
- **Brand Cyan** (`#0284C7`): Primary action, focused borders, and default interactive accent.
- **Deep Sky Accent** (`#0369A1`): High-contrast accent text and strong highlight details.

### Neutral

- **Neutral Surface** (`#F8FAFC`): Page background and quiet application canvas.
- **Pale Cyan** (`#F0F9FF`): Chips, icon containers, and low-emphasis selected surfaces.
- **Border Slate** (`#E2E8F0`): Light boundaries between cards, fields, and navigation regions.
- **Muted Slate** (`#475569`): Secondary labels, metadata, and supporting icon color.
- **Destructive Red** (`#DC2626`): Destructive actions and urgent alerts only.

### Named Rules

**The Clinical Signal Rule.** Use cyan to clarify action or state; do not flood neutral content with accent color.

## Typography

**Display Font:** Figtree (with sans-serif fallback)
**Body Font:** Noto Sans (with sans-serif fallback)
**Label/Mono Font:** Figtree for labels and data values; no separate mono face is established.

**Character:** Figtree gives headings, controls, and data a crisp operational cadence. Noto Sans keeps longer explanations neutral and readable.

### Hierarchy

- **Display** (700, `clamp(2.25rem, 5vw, 3rem)`, 1.1): Page-level titles and high-level dashboard statements.
- **Headline** (700, `1.5rem`, 1.25): Section titles and major card headings.
- **Title** (700, `1rem`, 1.4): Card titles, menu group labels, and data section headings.
- **Body** (400, `0.875rem`, 1.5): Explanatory copy and standard table content.
- **Label** (600, `0.75rem`, 1.35, slight tracking): Table headers, metadata, statuses, and compact controls.

**The Data-First Rule.** Keep labels compact and values easy to scan; reserve display scale for page context, not every card.

## Layout

Desktop dashboard layouts use a persistent `256px` sidebar with a flexible content region. On smaller screens the sidebar becomes an off-canvas drawer with bottom navigation available for frequent actions. Main content sits on a pale neutral canvas, with white cards and panels providing local grouping.

The spacing rhythm is built from 4px increments, with 8px control gaps, 16px standard insets, 24px card padding, and 32px section separation. Tables and administrative views may become dense, but controls retain enough breathing room for touch use.

## Elevation & Depth

The system uses a hybrid of tonal layering and restrained shadows. White cards sit above the neutral canvas with light borders and small shadows; hover may add a subtle lift (`translateY(-2px)` with a medium shadow). Modals and dropdowns use stronger shadows to establish temporary depth, while the default page remains quiet.

### Shadow Vocabulary

- **Card rest:** `0 1px 3px rgba(15, 23, 42, 0.08)` for separation without drama.
- **Card hover:** `0 4px 12px rgba(15, 23, 42, 0.12)` with a subtle upward shift.
- **Overlay:** `0 12px 32px rgba(15, 23, 42, 0.18)` for modals and menus.

**The Quiet Surface Rule.** Depth should explain hierarchy or interaction state, never decorate an otherwise flat dashboard.

## Shapes

The form language uses gently curved corners rather than pills. Small controls use 4px radii, inputs and buttons use 8px, cards and dialogs use 12px, and larger feature containers may use 16px. Borders are light slate and consistent within a view. Status chips may be fully rounded when their compact shape communicates a discrete state.

## Components

### Buttons

- **Shape:** Compact, gently rounded controls (8px), with 36–40px default height.
- **Primary:** Brand cyan background with white text; medium-weight Figtree label; 8px vertical and 16px horizontal padding.
- **Hover / Focus:** Darker cyan or slate hover treatment; visible cyan focus ring; disabled state uses pale cyan or reduced opacity while preserving legibility.
- **Secondary / Ghost:** Neutral or outlined surfaces for lower-priority actions; ghost controls gain a pale surface on hover.

### Chips

- **Style:** Small status or filter surfaces using pale cyan, slate, green, amber, or red semantic backgrounds with clear text contrast.
- **State:** Selected chips use a stronger cyan edge or fill; status chips are compact and may use a full pill radius.

### Cards / Containers

- **Corner Style:** Standard 12px radius; larger dashboard widgets may use 16px.
- **Background:** White card against `#F8FAFC` page canvas.
- **Shadow Strategy:** Light rest shadow and restrained hover lift; borders remain present for structure.
- **Border:** `#E2E8F0` or a similarly quiet slate boundary.
- **Internal Padding:** 24px standard; 16px for compact data regions.

### Inputs / Fields

- **Style:** Transparent or white field with a light border, 8px radius, 36px default height, and 12px horizontal padding.
- **Focus:** Border shifts to the brand cyan with a soft cyan focus ring.
- **Error / Disabled:** Destructive red for invalid state; disabled fields reduce opacity and pointer interaction without becoming unreadably gray.

### Navigation

- **Style:** Persistent 256px sidebar on desktop with grouped menu items, Lucide-style SVG icons, and compact Figtree labels.
- **Active:** Pale or active cyan highlight with stronger accent text/icon; inactive items stay slate and gain a quiet hover surface.
- **Mobile:** Off-canvas drawer plus bottom navigation for frequent employee actions.

### Data Tables

Tables use 12px uppercase or tracked labels for headers, 14px medium-weight values, restrained row separators, and semantic status chips. Filters should remain near the table and use the same field language as forms.

## Do's and Don'ts

### Do:

- **Do** use cyan-blue as a purposeful action and state signal.
- **Do** preserve the Figtree/Noto Sans pairing and the compact data hierarchy.
- **Do** provide visible hover, focus, disabled, and error states for interactive controls.
- **Do** use Lucide or equivalent SVG icons with consistent sizing instead of text glyphs.
- **Do** maintain WCAG AA contrast for body copy and important statuses.

### Don't:

- **Don't** introduce AI-slop purple, blue, or pink gradients.
- **Don't** use emojis as structural navigation icons.
- **Don't** mix sharp corners and ultra-round shapes within the same view.
- **Don't** mix raw hex and semantic primary tokens for the same role in one component.
- **Don't** make interactive surfaces visually static or remove their focus treatment.
