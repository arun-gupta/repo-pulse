# Implementation Plan: Dark Mode Support

**Branch**: `88-add-dark-mode-support` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Issue**: [#88](https://github.com/arun-gupta/repo-pulse/issues/88)

## Summary

Add a class-based dark mode to RepoPulse. Render a sun/moon toggle in the application header, store the user's choice in `localStorage` under `repopulse-theme`, and default to the OS `prefers-color-scheme` value when no choice has been stored. Apply the chosen theme before first paint via an inline pre-hydration script to avoid flash-of-wrong-theme. Skin every surface listed in the spec (header, scorecard, tabs, metric cards, baseline page, repo input, missing-data panel) with Tailwind `dark:` variants.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16+ (App Router)
**Primary Dependencies**: React, Tailwind CSS v4, lucide-react (already in repo for icons; verify in tasks)
**Storage**: `window.localStorage` (browser, key `repopulse-theme`); no server-side persistence
**Testing**: Vitest + React Testing Library
**Target Platform**: Modern browsers (matches the existing app)
**Project Type**: Next.js web app (Phase 1 web surface)
**Performance Goals**: No measurable impact on initial paint; theme applied synchronously before first paint to prevent FOUC
**Constraints**:
- Constitution Phase 1 stateless: no server-side state, no user-account-bound preference
- Tailwind v4 in this repo uses `@import "tailwindcss"` + CSS-side configuration (no `tailwind.config.ts`); dark variant must be configured via `@custom-variant dark` in `app/globals.css`
**Scale/Scope**: Single web app, ~7 visible surfaces, 1 toggle control

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| I. Technology Stack | PASS | Uses existing Next.js + Tailwind; introduces no new dependencies (icons rendered inline SVG, matching existing header pattern) |
| II. Accuracy Policy | N/A | No metric or scoring change |
| III. Data Source Rules | N/A | No GitHub API call |
| IV. Analyzer Module Boundary | PASS | UI-only; analyzer module untouched |
| V. CHAOSS Alignment | N/A | No scoring change |
| VI. Scoring Thresholds | N/A | No scoring change |
| IX. Feature Scope (YAGNI) | PASS | Smallest implementation: one provider, one toggle, dark variants only on listed surfaces; no theme system, no per-component theming abstraction, no animation framework |
| X. Security & Hygiene | PASS | No secrets; preference is non-sensitive UI state stored only on the user's device |
| XI. Testing | PASS | Vitest unit tests for theme provider behavior; existing component tests continue to pass |
| XII/XIII. Definition of Done & Workflow | PLAN | PR Test Plan will list manual checks for every in-scope surface in both themes |

No constitution rule blocks this work.

## Project Structure

### Documentation (this feature)

```text
specs/236-dark-mode-support/
├── spec.md
├── plan.md              # this file
├── quickstart.md
├── tasks.md             # produced by /speckit.tasks
└── checklists/
    └── requirements.md
```

### Source code touched

```text
app/
├── layout.tsx                          # mount ThemeProvider, inject pre-hydration script, set suppressHydrationWarning
├── globals.css                         # add @custom-variant dark, dark CSS variables
└── baseline/page.tsx                   # dark: variants
components/
├── theme/
│   ├── ThemeProvider.tsx               # NEW — context + localStorage + matchMedia listener
│   ├── ThemeProvider.test.tsx          # NEW
│   ├── ThemeToggle.tsx                 # NEW — sun/moon toggle button
│   └── ThemeToggle.test.tsx            # NEW
├── app-shell/ResultsShell.tsx          # render ThemeToggle in desktop + mobile nav, dark: variants on header
├── metric-cards/MetricCard.tsx         # dark: variants
├── metric-cards/MetricCardsOverview.tsx # dark: variants on scorecard wrapper
├── metric-cards/ScoreBadge.tsx         # dark: variants
├── app-shell/ResultsTabs.tsx           # dark: variants on tabs
└── (other surfaces touched as needed): repo input form, missing-data panel
```

## Phase 0 — Research

No NEEDS CLARIFICATION items. Two known-unknowns resolved here:

- **Tailwind v4 dark mode mechanism**: This repo uses Tailwind v4 (`@import "tailwindcss"` and `@theme inline` blocks). v4 deprecates the `tailwind.config.ts` `darkMode` field. Configure via `@custom-variant dark (&:where(.dark, .dark *))` in `app/globals.css`. This makes `dark:` variants gate on the `dark` class anywhere in the ancestor chain (matching v3 `darkMode: 'class'` semantics).
- **Avoiding FOUC under SSR**: Inject a small inline `<script>` in `<head>` that synchronously reads `localStorage` and `prefers-color-scheme`, then sets `document.documentElement.classList.add('dark')` if needed. Mark `<html suppressHydrationWarning>` because the class differs between server (none) and client. This is the standard Next.js App Router pattern and adds <1KB inline.

## Phase 1 — Design & Contracts

### Data model

A single client-side value:

```ts
type ThemeChoice = 'light' | 'dark' | 'system'
```

Storage:
- Key: `repopulse-theme`
- Value: one of `light` | `dark`. Absence means "follow system".
- Resolved theme: `light | dark` derived from choice + `prefers-color-scheme`.

### Contracts (UI)

`ThemeProvider` (client component, mounted once at the app root via layout):
- exposes `useTheme()` returning `{ theme: 'light'|'dark', choice: 'light'|'dark'|'system', setChoice(c) }`.
- on mount: read storage; if absent, derive from `matchMedia('(prefers-color-scheme: dark)')`.
- write storage on explicit `setChoice('light' | 'dark')`; remove key on `setChoice('system')` (not exposed in v1 — toggle alternates between light/dark only, matching the issue).
- listen for `matchMedia` changes and update only when no stored choice exists.
- defensively wrap localStorage access in try/catch; honor system preference if storage throws.

`ThemeToggle`:
- renders sun icon when `theme === 'dark'` (clicking switches to light) and moon icon when `theme === 'light'` (clicking switches to dark).
- `aria-label` reflects the action ("Switch to dark mode" / "Switch to light mode").
- focusable, keyboard-operable button.

### Quickstart

See [quickstart.md](quickstart.md).

## Phase 2 — Tasks

Generated by `/speckit.tasks` → see [tasks.md](tasks.md).

## Re-evaluated Constitution Check

Post-design — no change. Still PASS.
