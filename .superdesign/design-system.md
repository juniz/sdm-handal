# SDM Handal Design System

## Product

SDM Handal is an Indonesian hospital employee-management PWA. Interfaces prioritize operational clarity, readable Indonesian labels, touch-friendly controls, and reliable use on mobile devices.

## Foundations

- Primary typeface: Inter; Figtree is used selectively in the dashboard shell.
- Base background: white or slate-50.
- Brand color family: sky blue (`#0369A1`, `#0284C7`, `#0EA5E9`) with very light blue surfaces (`#F0F9FF`, `#E0F2FE`).
- Text: near-black for primary content, slate gray for secondary content.
- Borders: subtle warm-gray semantic border token.
- Base radius: `10px`; larger application surfaces commonly use `12–16px`.
- Motion: short fades and restrained transitions; interaction clarity takes precedence over decoration.

## Mobile iOS Extension for `/dashboard/izin`

Below `780px` only:

- Use iOS system surfaces: `#f2f2f7` page background, white grouped inset sections, `#1c1c1e` primary text, `#6e6e73` secondary text, and `#007aff` primary action.
- Use a compact large-title header and inset segmented control.
- Interactive controls must be at least `44px` high.
- Use subtle separators and minimal shadow.
- The primary submit action is full width and safe-area aware.
- History uses settings-style disclosure rows.

At `780px` and above, preserve the existing blue-gradient card presentation.

## Semantic States

- Processing: amber background and readable amber/brown text plus a visible status label.
- Approved: green background and readable green text plus a visible status label.
- Rejected: red background and readable red text plus a visible status label.
- Validation: red helper text immediately below the invalid field.
- Informational notice: light blue surface, blue icon, and readable dark-blue text.
