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
        </div>
      </div>
    </AuthProvider>
  )
}
