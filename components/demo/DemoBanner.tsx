import Link from 'next/link'

interface DemoBannerProps {
  generatedAt: string
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toISOString().slice(0, 10)
}

export function DemoBanner({ generatedAt }: DemoBannerProps) {
  return (
    <div
      role="status"
      aria-label="Demo data banner"
      data-testid="demo-banner"
      className="w-full border-b border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Demo data</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>generated {formatGeneratedAt(generatedAt)}</span>
        </p>
        <Link
          href="/"
          className="shrink-0 rounded border border-sky-300 bg-white/60 px-2 py-1 text-xs font-medium text-sky-900 transition hover:bg-white dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-900/70"
        >
          Sign in to analyze your own →
        </Link>
      </div>
    </div>
  )
}
