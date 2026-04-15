'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        'inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-700 bg-sky-950/25 text-sky-50 transition hover:border-sky-400 hover:bg-sky-950/40 hover:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-400 dark:hover:bg-slate-800 ' +
        className
      }
      data-testid="theme-toggle"
    >
      {isDark ? (
        // Sun icon (currently dark → click switches to light)
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon (currently light → click switches to dark)
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  )
}
