import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AppHeader } from '@/components/app-shell/AppHeader'

const REPOFINDER_RAW_BASE =
  'https://raw.githubusercontent.com/arun-gupta/repofinder/repo-pulse-integration/exports/universities'

interface ManifestEntry {
  slug: string
  university: string
  totalRepos: number
  analyzedRepos: number
  generatedAt: string
}

async function fetchManifest(): Promise<ManifestEntry[]> {
  const res = await fetch(`${REPOFINDER_RAW_BASE}/manifest.json`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    throw new Error(`Failed to load universities manifest: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<ManifestEntry[]>
}

export const metadata = {
  title: 'RepoPulse — Universities',
  description: 'OSS health scores for GitHub repositories affiliated with universities.',
}

export default async function UniversitiesPage() {
  const universities = await fetchManifest()

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/60">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Universities</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              OSS health scores for GitHub repositories affiliated with universities, sourced from{' '}
              <a href="https://github.com/arun-gupta/repofinder" className="text-sky-700 hover:underline dark:text-sky-300">
                repofinder
              </a>
              . Data is pre-scored and refreshed periodically.
            </p>
          </header>

          {universities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No scored universities yet. Run{' '}
              <code className="font-mono text-xs">npx tsx scripts/score-university.ts</code> to generate scored data.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {universities.map((u) => (
                <Link
                  key={u.slug}
                  href={`/university/${u.slug}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500"
                >
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
                    {u.university}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {u.analyzedRepos} of {u.totalRepos} repositories scored
                  </p>
                </Link>
              ))}
            </div>
          )}

          <details className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 [&::-webkit-details-marker]:hidden">
              How is this data generated?
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
              </svg>
            </summary>
            <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-slate-700/60 dark:text-slate-400 space-y-3">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">1 — Repo discovery</p>
                <p>
                  <a href="https://github.com/arun-gupta/repofinder" target="_blank" rel="noopener noreferrer"
                    className="text-sky-700 hover:underline dark:text-sky-400">repofinder</a>{' '}
                  scrapes GitHub to collect public repositories whose owners (users or orgs) have a university affiliation.
                  Affiliation is predicted from profile bios, locations, and email domains using an LLM classifier.
                  For UCSC this surfaces {universities.find((u) => u.slug === 'ucsc')?.totalRepos?.toLocaleString() ?? 'thousands of'} candidate repos.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">2 — Health scoring</p>
                <p>
                  Each repo is scored through RepoPulse&apos;s analysis pipeline — the same pipeline used for the live Repos and Organization tabs.
                  Metrics include activity (commits, PRs, issues), contributor health, documentation, security, licensing, and responsiveness.
                  Scores are calibrated as percentiles against a baseline of ~10 000 public GitHub repos.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">3 — Static snapshots</p>
                <p>
                  Results are exported to the{' '}
                  <a href="https://github.com/arun-gupta/repofinder/tree/repo-pulse-integration/exports/universities"
                    target="_blank" rel="noopener noreferrer"
                    className="text-sky-700 hover:underline dark:text-sky-400">repofinder fork</a>{' '}
                  as pre-scored JSON and served as static snapshots — no live GitHub API calls are made when you browse a university page.
                  Snapshots are refreshed periodically; the scored date is shown on each university&apos;s page.
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </AuthProvider>
  )
}
