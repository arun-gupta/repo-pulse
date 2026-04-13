'use client'

import { useRouter } from 'next/navigation'

export function BackToAnalyzerLink() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="rounded-full border border-sky-700 bg-sky-950/25 px-4 py-2 text-sm font-medium text-sky-50 transition hover:border-sky-400 hover:bg-sky-950/40 hover:text-white"
    >
      Back to analyzer
    </button>
  )
}
