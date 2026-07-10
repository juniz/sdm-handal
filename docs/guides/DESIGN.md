# SDM Handal — UI/UX Design System & Guidelines

This document establishes the official design system for the **SDM Handal** (Sistem Manajemen SDM) platform of RS Bhayangkara Nganjuk. All new developments, modules, and UI refactorings must adhere to these tokens, component styles, and patterns to maintain consistency, accessibility, and visual quality.

---

## 🎨 Color System (Cyan Blue — Deep Sky)

SDM Handal uses a vivid, modern Cyan Blue palette anchored on `#00BFFF` (Deep Sky Blue). The palette pairs a near-black dark navy as the sidebar/header background with energetic cyan tones across interactive elements. Designed to feel clean, precise, and medical-grade — without the heaviness of classical azure.

| Variable | Color Role / Description | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `primary-900` | **Primary Sky / Background** | `#E0F2FE` | Sidebar background, primary brand headers, light surfaces |
| `primary-800` | **Primary Sky Hover** | `#BAE6FD` | Hover backgrounds on sidebar, deep card fills |
| `primary-700` | **Active Item Highlight** | `#0EA5E9` | Selected state backgrounds, active navigation elements |
| `primary-600` | **Primary Brand** | `#0284C7` | Primary CTA, focused borders, default accents |
| `primary-400` | **Primary Vivid Accent** | `#0369A1` | Highlights, primary active text - main brand accent |
| `primary-200` | **Primary Muted** | `#475569` | Muted labels, secondary icons, slate-600 details |
| `primary-100` | **Primary Border** | `#E2E8F0` | Borders on light surfaces, light background boundaries |
| `primary-50` | **Primary Pale / BG Chip** | `#F0F9FF` | Active item highlight, chip background, icon containers |
| `neutral-50` | **Muted Neutral BG** | `#F8FAFC` | Page body background, slate-like clean layouts |
| `accent` | **Accent / CTA / Alert** | `#DC2626` | Destructive actions, urgent alerts, notifications |

---

## ✍️ Typography & Font Pairing

To avoid the default generic AI look, we pair **Figtree** for UI elements, labels, headings, and data values, with **Noto Sans** for body paragraphs and long text.

*   **UI Headings & Data Fields**: `Figtree`, sans-serif (`var(--font-figtree)`)
*   **Body Copy & Explanatory Text**: `Noto Sans`, sans-serif (`var(--font-noto-sans)`)

### Hierarchy Guidelines:
1.  **Display H1**: `text-4xl md:text-5xl font-bold tracking-tight text-primary-900`
2.  **Section Title H2**: `text-2xl font-bold tracking-tight text-gray-900`
3.  **Subtitles**: `text-base text-gray-500 font-normal`
4.  **Tables / Data**: `text-sm font-medium text-gray-900` for values, `text-xs font-semibold text-gray-500 uppercase` for headers.

---

## 🔲 Spacing & Shapes (Layout Rhythm)

Consistency in spacing and rounding is vital to prevent layout jank.

*   **Corner Radii Scale**:
    *   `radius-sm` (4px): Small buttons, tags, internal elements.
    *   `radius-md` (8px): Inputs, tooltips, secondary buttons.
    *   `radius-lg` (12px): Standard cards, modal boxes, dropdown panels.
    *   `radius-xl` (16px): Large feature cards, dashboard widgets, sidebar sections.
*   **Tactile Hover Scale**:
    *   Hover transition speed: `transition-all duration-200 ease-out`
    *   Card elevation: `hover:-translate-y-0.5 hover:shadow-md`

---

## 🧩 Core Component Design Rules

### 1. Persistent Dashboard Sidebar
*   **Width**: Fixed at `256px` (`w-64`) on screens `md` and above.
*   **Desktop Layout**: Always visible, not collapsible on desktop, with main content shifted right `md:ml-64`.
*   **Mobile Layout**: Slide-in menu toggled by a hamburger menu icon, featuring an overlay backdrop.
*   **Visual Structure**:
    *   Header: App Branding (Hospital/Health motif) + App Name ("SDM Handal").
    *   Middle: Navigation links grouped by category with uppercase, tracking-wider labels in `primary-400`.
    *   Footer: Current user details (avatar, name, role) + clean Logout button.
*   **Active Indicator**: Left border (`border-l-4 border-primary-400`) + background color (`bg-primary-800`).

### 2. Form Inputs
*   Label goes **ABOVE** the input field, styled as `text-xs font-semibold text-gray-700 mb-1.5`.
*   Inputs must have a subtle gray border: `border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600`.
*   Error messages go **BELOW** the input: `text-xs text-red-600 mt-1`.

### 3. Data Tables
*   Clean borderless style: `divide-y divide-gray-100`.
*   Column Headers: uppercase `text-xs font-semibold text-gray-500 tracking-wider bg-gray-50/50 py-3 px-4`.
*   Rows: `hover:bg-gray-50/30 transition-colors`.

### 4. Module Page Headers (Section Hero)
Each module's main page starts with a dark navy hero banner to anchor the context clearly.
*   **Background**: Solid `bg-[#04213D]` with a subtle `bg-[#00BFFF]/20` radial blur for depth.
*   **Structure**: Left side contains a category eyebrow label + page `<h1>` + short subtitle. Right side holds the primary filter control (e.g., date picker).
*   **Eyebrow Label**: `text-[10px] font-bold text-[#6DD9F8] uppercase tracking-widest font-mono`
*   **Page Title**: `text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-white leading-tight`
*   **Subtitle**: `text-[#B2EDFC] text-sm font-medium`
*   **Date Pill**: `bg-white/10 hover:bg-white/[0.14] rounded-xl border border-white/20 px-4 py-2.5` with a `CalendarIcon` in `#6DD9F8`.

### 5. Information Cards (Status / KPI Cards)
Used in sidebar columns of data-entry modules.
*   **Base**: `bg-white border border-slate-200/60 rounded-2xl shadow-sm` with `divide-y divide-slate-100`.
*   **Card Header Row**: `px-5 py-4 flex justify-between items-center` — title in `font-bold text-slate-800 font-figtree text-sm`, right-aligned status badge.
*   **Card Body**: `px-5 py-4 space-y-4`.
*   **Micro-Labels**: `text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block mb-1` — used before any data value.
*   **Score Chip Background**: `bg-[#E0F7FE] border border-[#B2EDFC]` (Cyan pale tones).

### 6. KPI / Score Cards
For live score estimations and numeric KPI widgets.
*   **Border**: `border border-[#B2EDFC]` (cyan pale border).
*   **Top Accent Strip**: `h-1 bg-gradient-to-r from-[#00BFFF] via-[#0090CC] to-[#00BFFF]` — top-edge stripe.
*   **Inner Grid Cells**: `bg-[#E0F7FE] border border-[#B2EDFC] rounded-xl text-center p-3`.
*   **Cell Labels**: `text-[9px] text-[#063354] block uppercase font-bold tracking-widest font-mono`.
*   **Cell Values**: `text-2xl font-black text-[#04213D] font-figtree`.
*   **Total Score**: Large `text-4xl font-black text-[#00BFFF] font-figtree`, right-aligned in a border-top footer row.
*   **Score Formula Hint**: `text-[10px] text-slate-400` shown below the total label.

### 7. Activity / Task List Items
Used in daily performance input forms.
*   **Item Container**: `py-3.5 px-4 rounded-xl border-l-4` — left border signals completion state.
*   **Incomplete Item**: `border-slate-200 bg-[#F8FAFC] hover:border-[#00BFFF] hover:bg-[#E0F7FE]/40` — hover shifts to cyan blue.
*   **Complete Item**: `border-emerald-500 bg-emerald-50/30`.
*   **Task Title**: `text-sm font-semibold text-slate-800 leading-snug`; on completion: `line-through text-slate-400`.
*   **Delete Button**: `opacity-0 group-hover:opacity-100 focus:opacity-100` — use `group` on the item row; icon button uses `text-slate-300 hover:text-red-500 hover:bg-red-50`.

### 8. Status Badges (Record Lifecycle)
Inline badges indicate the workflow state of submitted records.
*   **Draft**: `bg-slate-50 text-slate-700 border-slate-200` — neutral, not prominent.
*   **Submitted / Pending**: `bg-amber-50 text-amber-800 border-amber-200 animate-pulse`.
*   **Approved**: `bg-emerald-50 text-emerald-800 border-emerald-200`.
*   **Revisi (Rejected)**: `bg-rose-50 text-rose-800 border-rose-200`.
*   Common badge anatomy: `px-2.5 py-1 text-xs font-bold rounded-full border font-figtree uppercase tracking-wider`.

### 9. Inline Add Forms
Used in data-entry modules where items are appended inline.
*   Wrap in a `bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-4` container.
*   Inputs inside use: `focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/10` for consistent cyan focus rings.
*   Submit button: `bg-[#0090CC] hover:bg-[#063354] disabled:bg-[#B2EDFC]` — disabled state uses the pale cyan, not grey.

---

## 🚫 Style Anti-Patterns (Banned Actions)

*   ❌ **AI Slop Purple/Blue/Pink Gradients** — The primary brand color is clean Azure Blue, not neon purple.
*   ❌ **Emojis as structural navigation icons** — Always use official SVG icons (Lucide/Tabler) instead.
*   ❌ **Low Contrast / Low Legibility Text** — Ensure all body copy passes WCAG AA contrast (4.5:1 ratio).
*   ❌ **Missing Hover States** — Interactive elements must respond to hover (bg change, scale, or elevation).
*   ❌ **Inconsistent Borders** — Don't mix sharp corners (`rounded-none`) with ultra-round (`rounded-3xl`) within the same view.
*   ❌ **Generic Placeholder Avatars** — Use user name initials or official graphic silhouettes.
*   ❌ **Using `rose-*` / `red-*` inconsistently** — Use `red-*` for destructive actions and `rose-*` only for secondary warning highlights. Pick one semantic and stick to it within a module.
*   ❌ **`primary-*` class tokens mixing with raw hex** — When using raw hex colors (e.g. `#00BFFF`), be consistent within a component. Don't mix `text-primary-400` and `text-[#00BFFF]` in the same file for the same semantic role.

