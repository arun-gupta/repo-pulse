import { AuthProvider } from '@/components/auth/AuthContext'
import { DemoBanner } from '@/components/demo/DemoBanner'
import { DemoOrganizationClient } from '@/components/demo/DemoOrganizationClient'
import type { OrgInventoryResponse } from '@/lib/analyzer/org-inventory'
import orgFixture from '@/fixtures/demo/org-ossf.json'

type Fixture = OrgInventoryResponse & { generatedAt: string }

export const metadata = {
  title: 'RepoPulse — Demo organization',
  description: 'Pre-analyzed inventory for the OpenSSF organization rendered in the RepoPulse results shell. No sign-in required.',
}

export default function DemoOrganizationPage() {
  const { generatedAt, ...response } = orgFixture as Fixture

  return (
    <AuthProvider>
      <DemoBanner generatedAt={generatedAt} />
      <DemoOrganizationClient response={response} />
    </AuthProvider>
  )
}
