import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthContext'
import { DemoBanner } from '@/components/demo/DemoBanner'

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
  const latestGeneratedAt = universities.reduce((latest, u) => u.generatedAt > latest ? u.generatedAt : latest, '')

  return (
    <AuthProvider>
      <DemoBanner generatedAt={latestGeneratedAt} label="Static snapshot" showSignIn={false} />
      <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Universities</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              OSS health scores for GitHub repositories affiliated with universities, sourced from{' '}
              <a href="https://github.com/arun-gupta/repofinder" className="text-sky-700 hover:underline dark:text-sky-300">
                repofinder
              </a>
              .
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
      </main>
    </AuthProvider>
  )
}
