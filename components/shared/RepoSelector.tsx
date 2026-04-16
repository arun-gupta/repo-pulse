'use client'

import { useRef, useState, useEffect } from 'react'

interface RepoSelectorProps {
  repos: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function RepoSelector({ repos, selectedIndex, onSelect }: RepoSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onSelect(selectedIndex > 0 ? selectedIndex - 1 : repos.length - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onSelect(selectedIndex < repos.length - 1 ? selectedIndex + 1 : 0)
    }
  }

  const current = repos[selectedIndex] ?? repos[0]
  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < repos.length - 1

  return (
    <div
      ref={containerRef}
      className="mb-4 flex items-center gap-1"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Repository selector"
    >
      <button
        type="button"
        onClick={() => onSelect(selectedIndex - 1)}
        disabled={!hasPrev}
        aria-label="Previous repository"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
        >
          <span>{current}</span>
          <span className="text-xs text-slate-400">({selectedIndex + 1}/{repos.length})</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-slate-400">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
        {dropdownOpen ? (
          <ul
            role="listbox"
            aria-label="Select a repository"
            className="absolute left-0 top-full z-50 mt-1 max-h-64 w-max min-w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {repos.map((repo, i) => (
              <li
                key={repo}
                role="option"
                aria-selected={i === selectedIndex}
                className={`cursor-pointer px-3 py-1.5 text-sm transition ${
                  i === selectedIndex
                    ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                }`}
                onClick={() => {
                  onSelect(i)
                  setDropdownOpen(false)
                }}
              >
                {repo}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onSelect(selectedIndex + 1)}
        disabled={!hasNext}
        aria-label="Next repository"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
