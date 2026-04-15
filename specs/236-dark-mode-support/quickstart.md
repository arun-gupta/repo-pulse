# Quickstart — Dark Mode

## Try it locally

1. `npm run dev` (or use the running worktree dev server).
2. Open the app. The initial theme matches your OS color-scheme.
3. Click the sun/moon button in the header to toggle.
4. Reload the page — the chosen theme persists.
5. Open DevTools → Application → Local Storage → `repopulse-theme` to inspect (`light` or `dark`).
6. Clear the key and reload to return to system-preference defaulting.

## How it works

- `ThemeProvider` (client component) is mounted once at the root via `app/layout.tsx`.
- A tiny inline `<script>` in `<head>` runs synchronously before first paint to set `class="dark"` on `<html>` based on `localStorage` then `prefers-color-scheme`. This avoids any flash of the wrong theme.
- Tailwind v4's `dark:` variant is enabled via `@custom-variant dark (&:where(.dark, .dark *))` in `app/globals.css`.
- `ThemeToggle` reads/writes via `useTheme()` and re-renders affected surfaces.
