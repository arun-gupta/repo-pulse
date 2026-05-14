'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { UserBadge } from '@/components/auth/UserBadge'

interface AppHeaderProps {
  onLogoClick?: () => void
}

export function AppHeader({ onLogoClick }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

  const logoContent = (
    <>
      <Image
        src="/repo-pulse-banner.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded object-cover"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-semibold tracking-tight text-white">RepoPulse</h1>
    </>
  )

  return (
    <header className="w-full bg-sky-900 text-white dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 py-5">
        <div className="min-w-0">
          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              aria-label="RepoPulse — return to home"
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
            >
              {logoContent}
            </button>
          ) : (
            <Link
              href="/"
              aria-label="RepoPulse — go to home"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {logoContent}
            </Link>
          )}
          <p className="mt-1 text-sm text-sky-100 sm:hidden">
            OSS Health Score for open source projects.
          </p>
          <p className="mt-1 hidden text-sm text-sky-100 sm:block md:text-base">
            OSS Health Score — percentile-based scoring for open source projects.
          </p>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 sm:flex">
          <a
            href="/baseline"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-sky-700 bg-sky-950/25 px-3 py-2 text-xs font-medium text-sky-50 transition hover:border-sky-400 hover:bg-sky-950/40 hover:text-white"
          >
            Scoring Methodology
          </a>
          <a
            href="https://github.com/arun-gupta/repo-pulse"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-700 bg-sky-950/25 text-sky-50 transition hover:border-sky-400 hover:bg-sky-950/40 hover:text-white"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.52v-1.85c-2.94.64-3.56-1.25-3.56-1.25-.48-1.2-1.16-1.52-1.16-1.52-.95-.65.07-.64.07-.64 1.06.08 1.62 1.08 1.62 1.08.94 1.61 2.46 1.15 3.06.88.1-.68.37-1.15.67-1.42-2.35-.27-4.82-1.17-4.82-5.2 0-1.15.41-2.1 1.08-2.84-.11-.27-.47-1.37.1-2.86 0 0 .88-.28 2.89 1.08a9.98 9.98 0 0 1 5.26 0c2.01-1.36 2.89-1.08 2.89-1.08.57 1.49.21 2.59.1 2.86.67.74 1.08 1.69 1.08 2.84 0 4.04-2.48 4.93-4.84 5.19.38.33.72.98.72 1.98v2.93c0 .29.19.63.73.52A10.5 10.5 0 0 0 12 1.5Z" />
            </svg>
          </a>
          <ThemeToggle />
          <div className="h-6 w-px bg-sky-700 dark:bg-slate-700" />
          <UserBadge />
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-700 bg-sky-950/25 text-sky-50 transition hover:border-sky-400 hover:bg-sky-950/40 hover:text-white"
            >
              {mobileMenuOpen ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-sky-700 bg-sky-900 p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:w-56">
                <nav className="flex flex-col gap-2">
                  <a
                    href="/baseline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md px-3 py-2 text-sm font-medium text-sky-50 transition hover:bg-sky-800"
                  >
                    Scoring Methodology
                  </a>
                  <a
                    href="https://github.com/arun-gupta/repo-pulse"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sky-50 transition hover:bg-sky-800"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.52v-1.85c-2.94.64-3.56-1.25-3.56-1.25-.48-1.2-1.16-1.52-1.16-1.52-.95-.65.07-.64.07-.64 1.06.08 1.62 1.08 1.62 1.08.94 1.61 2.46 1.15 3.06.88.1-.68.37-1.15.67-1.42-2.35-.27-4.82-1.17-4.82-5.2 0-1.15.41-2.1 1.08-2.84-.11-.27-.47-1.37.1-2.86 0 0 .88-.28 2.89 1.08a9.98 9.98 0 0 1 5.26 0c2.01-1.36 2.89-1.08 2.89-1.08.57 1.49.21 2.59.1 2.86.67.74 1.08 1.69 1.08 2.84 0 4.04-2.48 4.93-4.84 5.19.38.33.72.98.72 1.98v2.93c0 .29.19.63.73.52A10.5 10.5 0 0 0 12 1.5Z" />
                    </svg>
                    GitHub
                  </a>
                  <div className="my-1 h-px bg-sky-700" />
                  <div className="px-3 py-2">
                    <UserBadge />
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
