import { AuthProvider } from '@/components/auth/AuthContext'
import { DemoBanner } from '@/components/demo/DemoBanner'
import { DemoRepositoriesClient } from '@/components/demo/DemoRepositoriesClient'
import type { AnalyzeResponse } from '@/lib/analyzer/analysis-result'
import fixture from '@/fixtures/demo/repositories.json'

type Fixture = AnalyzeResponse & { generatedAt: string }

export const metadata = {
  title: 'RepoPulse — Demo repositories',
  description: 'Pre-analyzed open-source repositories rendered in the full RepoPulse results shell. No sign-in required.',
}

export default function DemoRepositoriesPage() {
  const { generatedAt, ...response } = fixture as unknown as Fixture

  return (
    <AuthProvider>
      <DemoBanner generatedAt={generatedAt} />
      <DemoRepositoriesClient response={response} />
    </AuthProvider>
  )
}
