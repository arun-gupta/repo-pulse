import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('ThemeToggle', () => {
  it('renders with "Switch to dark mode" label when in light mode', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
  })

  it('renders with "Switch to light mode" label when in dark mode', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
  })

  it('clicking flips the theme class on <html>', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    act(() => { screen.getByLabelText('Switch to dark mode').click() })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    act(() => { screen.getByLabelText('Switch to light mode').click() })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
