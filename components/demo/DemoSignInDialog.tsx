'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export interface DemoSignInDialogProps {
  repos: string[]
  onDismiss: () => void
}

export function DemoSignInDialog({ repos, onDismiss }: DemoSignInDialogProps) {
  const dismissRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    dismissRef.current?.focus()
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

  const repoCount = repos.length
  const heading =
    repoCount === 1
      ? `Sign in with GitHub to analyze ${repos[0]}`
      : `Sign in with GitHub to analyze these ${repoCount} repositories`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-signin-dialog-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2
          id="demo-signin-dialog-heading"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {heading}
        </h2>

        <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p>
            Demo data is pre-analyzed from fixtures. Fresh analysis requires a signed-in GitHub
            session so RepoPulse can query the GitHub API on your behalf.
          </p>
          <p>
            After signing in, you can paste or select the same repositories and run a live
            analysis — your selection here isn&apos;t lost work.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            ref={dismissRef}
            type="button"
            onClick={onDismiss}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Stay in demo
          </button>
          <Link
            href="/"
            className="rounded border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:border-sky-400 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Sign in with GitHub →
          </Link>
        </div>
      </div>
    </div>
  )
}
