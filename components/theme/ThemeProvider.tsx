'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ResolvedTheme = 'light' | 'dark'
export type ThemeChoice = ResolvedTheme | 'system'

export const THEME_STORAGE_KEY = 'repopulse-theme'

interface ThemeContextValue {
  theme: ResolvedTheme
  choice: ThemeChoice
  setChoice: (choice: ThemeChoice) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    // localStorage unavailable (e.g., private browsing) — fall through
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'light' || choice === 'dark') return choice
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyClass(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => readStoredChoice())
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredChoice()))

  useEffect(() => {
    applyClass(theme)
  }, [theme])

  // Re-resolve when choice changes (covers system → dark/light derivation)
  useEffect(() => {
    setTheme(resolveTheme(choice))
  }, [choice])

  // Listen for OS preference changes only when no explicit choice is stored.
  useEffect(() => {
    if (choice !== 'system') return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(mql.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [choice])

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next)
    try {
      if (next === 'system') {
        window.localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
      }
    } catch {
      // ignore storage failure — in-memory state still updates
    }
  }, [])

  const toggle = useCallback(() => {
    setChoice(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setChoice])

  return (
    <ThemeContext.Provider value={{ theme, choice, setChoice, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

const FALLBACK_CONTEXT: ThemeContextValue = {
  theme: 'light',
  choice: 'system',
  setChoice: () => {},
  toggle: () => {},
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK_CONTEXT
}
