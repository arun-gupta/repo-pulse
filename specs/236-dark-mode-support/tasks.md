# Tasks: Dark Mode Support

**Branch**: `88-add-dark-mode-support`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Tasks are ordered for execution. `[P]` marks tasks that can run in parallel with the previous task.

## T001 — Configure Tailwind v4 dark variant in globals.css
Add `@custom-variant dark (&:where(.dark, .dark *));` near the top of `app/globals.css`. Add a `.dark` selector block that overrides `--background` and `--foreground` so the existing CSS variables flip when the class is present (and remove the now-redundant `@media (prefers-color-scheme: dark)` block — system preference is now handled by the ThemeProvider).
**File**: `app/globals.css`

## T002 — Create ThemeProvider client component
Add `components/theme/ThemeProvider.tsx`:
- `'use client'`
- React context exposing `{ theme: 'light'|'dark', choice: 'light'|'dark'|'system', setChoice }`
- on mount: read `localStorage.getItem('repopulse-theme')`. If `'light'|'dark'` → use it; else → `matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
- on `setChoice('light'|'dark')`: persist + apply class
- on system-pref change: only re-apply when no stored choice
- wrap all `localStorage` access in try/catch (graceful degradation)
- effect synchronizes `document.documentElement.classList` with `theme`

**File**: `components/theme/ThemeProvider.tsx`

## T003 — Add inline pre-hydration script + mount provider in layout
Update `app/layout.tsx`:
- add `suppressHydrationWarning` to `<html>`
- inject inline `<script>` in `<head>` that reads localStorage / prefers-color-scheme and adds the `dark` class synchronously
- wrap `{children}` in `<ThemeProvider>`

**File**: `app/layout.tsx`

## T004 [P] — Create ThemeToggle component
Add `components/theme/ThemeToggle.tsx`:
- consumes `useTheme()`
- renders a `<button>` with sun (when dark) / moon (when light) inline SVG
- `aria-label` reflects the action; `title` shows it on hover
- click toggles between `'light'` and `'dark'` via `setChoice`
- styled to fit alongside the existing GitHub icon button in the header (rounded, sky-700 border in light, slate border in dark)

**File**: `components/theme/ThemeToggle.tsx`

## T005 — Render ThemeToggle in ResultsShell header (desktop + mobile menu)
Add `<ThemeToggle />` next to the GitHub icon in the desktop nav and as an entry in the mobile dropdown.

**File**: `components/app-shell/ResultsShell.tsx`

## T006 — Render ThemeToggle on the repo input / home view
Identify the home / input page header (likely `app/page.tsx` or similar). Render the toggle there too so the user can switch theme before running an analysis.

**File**: `app/page.tsx` (locate during implementation; the toggle must be available on every view per FR-001)

## T007 — Apply `dark:` variants to ResultsShell header & body
Add dark variants to: outer `<main>` background, header background, badge buttons, mobile menu panel, divider lines, body container, scoring stale alert.

**File**: `components/app-shell/ResultsShell.tsx`

## T008 — Apply `dark:` variants to scorecard / metric cards / score badge
**Files**: `components/metric-cards/MetricCard.tsx`, `MetricCardsOverview.tsx`, `ScoreBadge.tsx`

## T009 — Apply `dark:` variants to ResultsTabs
**File**: `components/app-shell/ResultsTabs.tsx`

## T010 [P] — Apply `dark:` variants to baseline page and missing-data panel
**Files**: `app/baseline/page.tsx` (and any imported partials), the missing-data panel component.

## T011 — Tests for ThemeProvider
Vitest + RTL:
- defaults to `light` when matchMedia returns no, `dark` when yes (no stored value)
- stored `'dark'` overrides matchMedia=light
- `setChoice('dark')` writes to localStorage and adds `dark` class to `<html>`
- `setChoice('light')` removes `dark` class and writes `'light'`
- gracefully handles `localStorage.getItem` throwing (private mode)

**File**: `components/theme/ThemeProvider.test.tsx`

## T012 [P] — Tests for ThemeToggle
- renders moon when theme=light, sun when theme=dark
- clicking calls `setChoice` with the opposite theme
- `aria-label` reflects the action

**File**: `components/theme/ThemeToggle.test.tsx`

## T013 — Run npm test, npm run lint, npm run build
Fix any failures. Use `DEV_GITHUB_PAT= npm run build` if the env var is set.

## T014 — Manual verification on dev server (port 3013)
Walk every in-scope surface in both themes; confirm legibility, persistence, system-default behavior, no FOUC.

## T015 — Push branch and open PR
Push `88-add-dark-mode-support`. Open PR with `## Test plan` checklist mirroring the FR/SC list. Do not merge — `gh pr merge` is forbidden by CLAUDE.md.
