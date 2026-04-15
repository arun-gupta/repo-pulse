# Feature Specification: Dark Mode Support

**Feature Branch**: `88-add-dark-mode-support`
**Created**: 2026-04-15
**Status**: Draft
**Input**: GitHub issue #88 — Add dark mode support. Toggle in header (sun/moon icon), localStorage persistence, system preference default, dark variants across header/scorecard/tabs/metrics/baseline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle between dark and light themes (Priority: P1)

A user viewing RepoPulse can switch between light and dark themes via a visible toggle button in the application header. Clicking the toggle immediately re-skins every visible surface (header, scorecard, tabs, metric cards, baseline/comparison views) so the interface is comfortable to use in any ambient-lighting condition.

**Why this priority**: This is the core capability requested in the issue — without it, no other aspect of dark mode is observable or testable.

**Independent Test**: Load the results view, click the toggle, verify that every major surface flips to the opposite color scheme with readable text contrast.

**Acceptance Scenarios**:

1. **Given** the app is in light mode, **When** the user clicks the theme toggle in the header, **Then** the entire application re-renders in dark mode and the toggle icon changes from moon to sun.
2. **Given** the app is in dark mode, **When** the user clicks the theme toggle, **Then** the entire application re-renders in light mode and the toggle icon changes from sun to moon.
3. **Given** the user is on the results view with scorecard, tabs, metric cards, and baseline/comparison tab visible, **When** they toggle the theme, **Then** each of those surfaces is legible and visually consistent in the new mode (no invisible text, no broken layout).

---

### User Story 2 - Theme preference persists across sessions (Priority: P2)

A user who has selected a theme returns to RepoPulse later and finds the same theme applied without having to re-select it.

**Why this priority**: Persistence is expected for a preference toggle — without it, every session forces the user to re-configure the theme, which is friction.

**Independent Test**: Toggle to dark mode, reload the page, verify the app loads in dark mode. Toggle to light, reload, verify light.

**Acceptance Scenarios**:

1. **Given** the user has explicitly toggled to dark mode, **When** they reload the page or return in a new tab on the same device, **Then** the app loads in dark mode.
2. **Given** the user has explicitly toggled to light mode, **When** they reload the page, **Then** the app loads in light mode regardless of the operating system theme.

---

### User Story 3 - First-visit default follows system preference (Priority: P3)

A first-time visitor (no stored preference) sees RepoPulse in whichever theme matches their operating system's current setting.

**Why this priority**: Improves the first-impression UX by matching the user's environment; fallback only applies when the user has not yet expressed a preference.

**Independent Test**: Clear browser storage, set OS to dark mode, load RepoPulse → app renders dark. Repeat with OS light → app renders light.

**Acceptance Scenarios**:

1. **Given** no stored theme preference and the OS reports `prefers-color-scheme: dark`, **When** the user loads RepoPulse, **Then** the app renders in dark mode.
2. **Given** no stored theme preference and the OS reports `prefers-color-scheme: light`, **When** the user loads RepoPulse, **Then** the app renders in light mode.
3. **Given** the user has a stored preference, **When** the OS theme changes, **Then** the stored preference wins (the app does not switch).

---

### Edge Cases

- **First paint before hydration**: The chosen theme must be applied before the first visible paint so users do not see a flash of the opposite theme ("FOUC").
- **Storage unavailable**: If `localStorage` is disabled or throws (private browsing in some browsers), the app still functions — it falls back to system preference for the session without crashing.
- **Invalid stored value**: If the stored preference is corrupted or an unknown value, the app treats it as missing and falls back to system preference.
- **Partially-styled surfaces**: Any surface that lacks explicit dark variants must still remain legible (no white text on white background). Out-of-scope surfaces should inherit a safe default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST provide a theme toggle control in the global header that is visible on every view (repo input, results, baseline/comparison).
- **FR-002**: The toggle MUST display a moon icon when the active theme is light, and a sun icon when the active theme is dark, with an accessible label (e.g., "Switch to dark mode" / "Switch to light mode").
- **FR-003**: Clicking the toggle MUST switch the active theme immediately and re-render the UI without a page reload.
- **FR-004**: The application MUST persist the user's explicit theme selection in `localStorage` under a stable key so it survives reloads and new tabs on the same origin.
- **FR-005**: On first load without a stored preference, the application MUST default to the theme reported by the `prefers-color-scheme` media query.
- **FR-006**: The stored preference, once set, MUST take precedence over the OS `prefers-color-scheme` value.
- **FR-007**: The application MUST apply the chosen theme before first paint to avoid a visible flash of the opposite theme on load.
- **FR-008**: The following surfaces MUST render correctly (legible text, visible borders, distinguishable backgrounds) in both themes: global header, scorecard, tab navigation, metric cards, baseline/comparison view, repo input form, missing-data panel.
- **FR-009**: The toggle control MUST be keyboard-operable and expose its current state to assistive technology.
- **FR-010**: The application MUST degrade gracefully when `localStorage` is unavailable — it continues to function and honors system preference for the session.

### Key Entities

- **Theme preference**: Single user-scoped value with possible states `light`, `dark`, or *unset* (fall back to system). Stored in `localStorage` on the browser origin; never transmitted to the server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can switch between themes with a single click from any view in the application.
- **SC-002**: After selecting a theme, 100% of reloads on the same device return to that theme without user action.
- **SC-003**: On a first visit with no stored preference, the initial theme matches the operating system's current color-scheme setting 100% of the time.
- **SC-004**: All in-scope surfaces (header, scorecard, tabs, metric cards, baseline/comparison, repo input, missing-data panel) pass a visual review for legibility and contrast in both themes with zero surfaces rendering unreadable text or invisible borders.
- **SC-005**: On page load with a stored preference, the initial paint renders in the correct theme (no observable flash of the opposite theme).

## Assumptions

- Tailwind CSS class-based dark mode (`darkMode: 'class'`) is the styling mechanism, consistent with the suggestion in the issue and the existing Tailwind stack.
- The preference is scoped to the browser origin / device — no server-side sync, no account-bound preference (consistent with the Phase 1 stateless constitution).
- Existing component color choices cover most surfaces; only the surfaces listed in FR-008 require explicit dark variants in this feature. Surfaces that already render legibly in dark mode (e.g., chart canvases with inherent backgrounds) do not need changes.
- Chart.js color palettes may be tuned separately if they prove unreadable in dark mode; the initial scope targets structural surfaces (backgrounds, text, borders) rather than re-palettizing every chart.
- The toggle is rendered in the existing header component; no new global layout primitive is introduced.
