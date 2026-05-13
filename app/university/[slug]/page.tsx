import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/components/auth/AuthContext'
import { DemoBanner } from '@/components/demo/DemoBanner'
import { RepoSummaryTable } from '@/components/repo-summary/RepoSummaryTable'
import type { AnalyzeResponse } from '@/lib/analyzer/analysis-result'

const REPOFINDER_RAW_BASE =
  'https://raw.githubusercontent.com/arun-gupta/repofinder/repo-pulse-integration/exports/universities'

interface UniversityFixture extends AnalyzeResponse {
  university: string
  slug: string
  totalRepos: number
  generatedAt: string
}

async function fetchFixture(slug: string): Promise<UniversityFixture | null> {
  const res = await fetch(`${REPOFINDER_RAW_BASE}/${slug}-scored.json`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  return res.json() as Promise<UniversityFixture>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const fixture = await fetchFixture(slug)
  if (!fixture) return {}
  return {
    title: `RepoPulse — ${fixture.university}`,
    description: `Health scores for ${fixture.totalRepos} GitHub repositories affiliated with ${fixture.university}.`,
  }
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const fixture = await fetchFixture(slug)
  if (!fixture) notFound()

  const { generatedAt, university, slug: _slug, totalRepos, results } = fixture

  return (
    <AuthProvider>
      <DemoBanner generatedAt={generatedAt} label="Static snapshot" showSignIn={false} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/university" className="hover:text-sky-700 dark:hover:text-sky-300">Universities</Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-slate-100">{university}</span>
        </nav>
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{university}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {results.length} of {totalRepos} repositories scored
          </p>
        </header>
        <RepoSummaryTable results={results} />
      </main>
    </AuthProvider>
  )
}
