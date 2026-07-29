# Theme Context

## Compact Token Summary

- CSS system: Tailwind CSS 4 via `@import "tailwindcss"` and `@theme inline`.
- Component style: local shadcn/Radix primitives with Tailwind classes.
- Fonts: Inter at the root; Figtree and Noto Sans are imported and exposed as theme fonts.
- Base radius: `0.625rem`; derived radii range from `calc(var(--radius) - 4px)` through `calc(var(--radius) + 4px)`.
- Brand palette:
  - `primary-50`: `#F0F9FF`
  - `primary-100`: `#E2E8F0`
  - `primary-200`: `#475569`
  - `primary-400`: `#0369A1`
  - `primary-600`: `#0284C7`
  - `primary-700`: `#0EA5E9`
  - `primary-800`: `#BAE6FD`
  - `primary-900`: `#E0F2FE`
  - `neutral-50`: `#F8FAFC`
- Light semantic tokens: white background/card/popover, near-black foreground, warm-gray border/input, muted gray foreground, red destructive.
- Dark semantic tokens are defined under `.dark`.
- Safe areas: `--sat`, `--sab`, `--sal`, `--sar` map to device safe-area environment variables.
- Body behavior: applies safe-area padding, disables text selection/touch callout, and prevents vertical overscroll.
- Tailwind default `md` remains `768px`; the izin redesign requires an exact route-local `780px` arbitrary breakpoint.

## Raw Sources

- Full global theme and CSS: `src/app/globals.css`
- Root font and viewport setup: `src/app/layout.js`
- No `tailwind.config.*` file is present; Tailwind 4 configuration is CSS-first.
