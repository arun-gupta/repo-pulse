'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthContext'
import { ChatPanel } from '@/components/chat/ChatPanel'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

interface Props {
  university: string
  results: AnalysisResult[]
}

export function UniversityChatPanel({ university, results }: Props) {
  const { session } = useAuth()
  const [repoQuery, setRepoQuery] = useState('')
  if (!session?.token) return null
  return (
    <ChatPanel
      contextType="university"
      university={university}
      universityResults={results}
      githubToken={session.token}
      repoQuery={repoQuery}
      onRepoQueryChange={setRepoQuery}
    />
  )
}
