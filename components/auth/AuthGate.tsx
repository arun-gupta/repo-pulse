'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './AuthContext'
import { SignInButton } from './SignInButton'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('auth_error')

  useEffect(() => {
    // Remove stale PAT key left by the pre-OAuth token-storage implementation
    localStorage.removeItem('forkprint_github_token')

    // Read token and username from URL fragment after OAuth callback
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.startsWith('#')) return

    const params = new URLSearchParams(hash.slice(1))
    const token = params.get('token')
    const username = params.get('username')

    if (token && username) {
      signIn({ token, username })
      // Restore any query params saved before the OAuth redirect (e.g. ?repos=...)
      const savedSearch = sessionStorage.getItem('oauth_return_search') ?? ''
      sessionStorage.removeItem('oauth_return_search')
      router.replace(`/${savedSearch}`, { scroll: false })
    }
  }, [router, signIn])

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Sign-in failed: {authError.replace(/_/g, ' ')}. Please try again.
        </p>
        <SignInButton />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-4">
        <div className="text-center">
          <img src="/repo-pulse-banner.png" alt="RepoPulse" className="mx-auto h-40 rounded-xl shadow-lg" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">RepoPulse</h1>
          <p className="mt-2 text-lg text-slate-600">Know the real health of any open source project — in seconds</p>
        </div>

        <div className="max-w-lg space-y-4">
          <p className="text-center text-sm text-slate-600">
            RepoPulse computes a single <span className="font-semibold text-slate-800">OSS Health Score</span> from
            five dimensions — scored as percentiles against 1,600+ real GitHub repositories in the same star bracket.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</p>
              <p className="mt-0.5 text-xs text-slate-600">PR throughput, issue flow, commit cadence, release frequency</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsiveness</p>
              <p className="mt-0.5 text-xs text-slate-600">Response times, resolution speed, backlog health</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contributors</p>
              <p className="mt-0.5 text-xs text-slate-600">Contributor concentration, repeat and new contributor mix</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
              <p className="mt-0.5 text-xs text-slate-600">OpenSSF Scorecard, dependency automation, branch protection</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documentation</p>
              <p className="mt-0.5 text-xs text-slate-600">Key project files, README quality, licensing compliance, inclusive naming</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Compare up to 4 repos side-by-side</span>
            <span className="text-slate-300">|</span>
            <span>Browse repos by GitHub org</span>
            <span className="text-slate-300">|</span>
            <span>Export as JSON or Markdown</span>
          </div>
        </div>

        <SignInButton />
        <a href="/baseline" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-600 transition">View scoring methodology</a>
      </div>
    )
  }

  return <>{children}</>

}
