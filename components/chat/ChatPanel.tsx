'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useChat } from 'ai/react'
import type { Message } from 'ai'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { OrgInventoryResponse, OrgRepoSummary } from '@/lib/analyzer/org-inventory'
import type { OrgSummaryViewModel } from '@/lib/org-aggregation/types'
import { parseStructuredSearchQuery } from '@/lib/org-inventory/structured-search'
import { serializeReposContext, serializeOrgContext, serializeOrgInventoryContext, type OrgSortBy } from './serialize-context'
import { PROVIDERS, type ProviderId, type ModelTier } from './providers'

// ---- Types ----------------------------------------------------------------

export interface ChatPanelProps {
  contextType: 'repos' | 'org'
  repoResults?: AnalysisResult[]
  orgView?: OrgSummaryViewModel
  org?: string
  orgRepos?: OrgRepoSummary[]
  orgInventory?: OrgInventoryResponse
  githubToken: string
  resetKey?: number
  repoQuery?: string
  onRepoQueryChange?: (q: string) => void
}

// ---- Constants ------------------------------------------------------------

const FREE_LIMIT = 5

const REPOS_STARTER_CHIPS = [
  'Why is the security score low?',
  "What's the biggest gap between these repos?",
  'Which repo should I fix first?',
]

const ORG_STARTER_CHIPS = [
  'Which repos need the most urgent attention?',
  "What's the overall security posture?",
  'Which repos are best positioned for CNCF Sandbox?',
]

const ORG_INVENTORY_STARTER_CHIPS = [
  "Which repos haven't been active in over a year?",
  'What languages are most common across this org?',
  'Which repos have the most open issues?',
]

const SORT_OPTIONS: { value: OrgSortBy; label: string }[] = [
  { value: 'stars',    label: '⭐ Top by stars' },
  { value: 'health',   label: '🔴 Lowest health first' },
  { value: 'activity', label: '⚡ Most recently active' },
]

const COMPLETION_VALUES: Record<string, string[]> = {
  lang:     ['go', 'python', 'typescript', 'javascript', 'java', 'rust', 'c++', 'c', 'ruby', 'kotlin', 'swift', 'scala', 'shell'],
  archived: ['false', 'true'],
  stars:    ['>100', '>500', '>1000', '>5000', '<100', '<50'],
  forks:    ['>10', '>50', '>100', '<10'],
  issues:   ['>10', '>50', '>100', '0', '<10'],
  pushed:   ['>2025-01-01', '>2024-01-01', '>2023-01-01', '<2023-01-01', '<2022-01-01'],
  topic:    ['kubernetes', 'machine-learning', 'security', 'cli', 'api', 'docker', 'ai', 'devops'],
  license:  ['apache-2.0', 'mit', 'gpl-3.0', 'bsd-3-clause', 'mpl-2.0'],
}

const SEARCH_PREFIX_HINTS: { key: string; description: string; example: string }[] = [
  { key: 'lang',     description: 'Programming language',  example: 'lang:go' },
  { key: 'archived', description: 'Archived status',       example: 'archived:false' },
  { key: 'stars',    description: 'Star count',            example: 'stars:>500' },
  { key: 'forks',    description: 'Fork count',            example: 'forks:>10' },
  { key: 'issues',   description: 'Open issues count',     example: 'issues:<50' },
  { key: 'pushed',   description: 'Last push date',        example: 'pushed:>2024-01-01' },
  { key: 'topic',    description: 'Repository topic',      example: 'topic:kubernetes' },
  { key: 'license',  description: 'License type',          example: 'license:apache-2.0' },
]

const LS_KEY_PROVIDER  = 'repopulse:chat:provider'
const LS_KEY_MODEL_TIER = 'repopulse:chat:modelTier'
const SS_KEY_EXPANDED  = 'repopulse:chat:expanded'
const SS_KEY_PROVIDER  = 'repopulse:chat:provider:session'
const SS_KEY_API_KEY   = 'repopulse:chat:apiKey'

// ---- Helpers --------------------------------------------------------------

function computeCompletions(query: string): string[] {
  const lastToken = query.match(/(?:^|\s)(\S*)$/)?.[1] ?? ''
  if (!lastToken) return []
  const colonIdx = lastToken.indexOf(':')
  if (colonIdx !== -1) {
    const key = lastToken.slice(0, colonIdx).toLowerCase()
    const valuePrefix = lastToken.slice(colonIdx + 1)
    const values = COMPLETION_VALUES[key]
    if (!values) return []
    return values.filter((v) => v.startsWith(valuePrefix)).map((v) => `${key}:${v}`)
  }
  return SEARCH_PREFIX_HINTS
    .filter((p) => p.key.startsWith(lastToken.toLowerCase()))
    .map((p) => `${p.key}:`)
}

function applyCompletion(query: string, completion: string): string {
  return query.replace(/(\s*)(\S*)$/, (_, space) => `${space}${completion} `).trimStart()
}

function formatCost(usd: number): string {
  if (usd < 0.0001) return '<$0.0001'
  return `$${usd.toFixed(4)}`
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function calcCost(promptTokens: number, completionTokens: number, provider: ProviderId, modelTier: ModelTier): number {
  const spec = PROVIDERS[provider].models[modelTier]
  return (promptTokens * spec.inputRate + completionTokens * spec.outputRate) / 1_000_000
}

// ---- Markdown renderer ----------------------------------------------------

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const inner = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
      return (
        <pre key={i} className="my-2 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-800">
          <code>{inner}</code>
        </pre>
      )
    }
    return part.split('\n\n').filter(Boolean).map((para, j) => {
      const spans = para.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, k) => {
        if (seg.startsWith('**') && seg.endsWith('**'))
          return <strong key={k}>{seg.slice(2, -2)}</strong>
        if (seg.startsWith('`') && seg.endsWith('`'))
          return <code key={k} className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">{seg.slice(1, -1)}</code>
        return <span key={k}>{seg}</span>
      })
      return <p key={`${i}-${j}`} className="mb-2 last:mb-0">{spans}</p>
    })
  })
}

// ---- Structured search filter with completion -----------------------------

function SearchFilter({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [completions, setCompletions] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parsed = parseStructuredSearchQuery(value)

  function open(q: string) { const c = computeCompletions(q); setCompletions(c); setActiveIdx(-1) }
  function close() { setCompletions([]); setActiveIdx(-1) }
  function pick(c: string) { onChange(applyCompletion(value, c)); close() }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (completions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, completions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(completions[activeIdx]) }
    else if (e.key === 'Escape') close()
    else if (e.key === 'Tab' && completions.length > 0) { e.preventDefault(); pick(completions[activeIdx >= 0 ? activeIdx : 0]) }
  }

  return (
    <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700">
      <div className="relative flex items-center gap-2">
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0 text-slate-400">
          <circle cx="6.5" cy="6.5" r="4" /><path strokeLinecap="round" d="M11 11l3 3" />
        </svg>
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); open(e.target.value) }}
            onFocus={() => open(value)}
            onBlur={() => { blurRef.current = setTimeout(close, 150) }}
            onKeyDown={handleKeyDown}
            placeholder="Filter repos: lang:go stars:>500 archived:false"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {completions.length > 0 && (
            <ul role="listbox" className="absolute bottom-full left-0 z-50 mb-1 w-full overflow-hidden rounded border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {completions.map((c, i) => (
                <li key={c} role="option" aria-selected={i === activeIdx}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); if (blurRef.current) clearTimeout(blurRef.current); pick(c) }}
                    className={`w-full px-3 py-1.5 text-left font-mono text-xs ${i === activeIdx ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label="Clear filter"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
        )}
      </div>
      {parsed.invalidTokens.length > 0 && (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">Ignored: {parsed.invalidTokens.join(', ')}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
        {SEARCH_PREFIX_HINTS.map(({ key, description, example }) => (
          <span key={key} className="group relative cursor-help">
            <span className="text-[10px] text-slate-400 underline decoration-dotted underline-offset-2 dark:text-slate-500">{key}:</span>
            <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2.5 py-1.5 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-slate-700">
              <span className="block text-[11px] font-medium text-white">{description}</span>
              <span className="block font-mono text-[10px] text-slate-300">{example}</span>
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ---- Key entry form -------------------------------------------------------

const DIRECT_PROVIDERS: ProviderId[] = ['anthropic', 'openai', 'google', 'groq']

function KeyEntryForm({
  onSave,
  exhausted = false,
}: {
  onSave: (provider: ProviderId, key: string) => void
  exhausted?: boolean
}) {
  const [tab, setTab] = useState<'openrouter' | 'direct'>('openrouter')
  const [directProvider, setDirectProvider] = useState<ProviderId>('anthropic')
  const [keyValue, setKeyValue] = useState('')

  const activeProvider: ProviderId = tab === 'openrouter' ? 'openrouter' : directProvider
  const config = PROVIDERS[activeProvider]

  function handleSave() {
    if (!keyValue.trim()) return
    onSave(activeProvider, keyValue.trim())
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {exhausted && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          You&apos;ve used all {FREE_LIMIT} free chats. Add an API key for unlimited access.
        </div>
      )}

      {/* Provider tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => { setTab('openrouter'); setKeyValue('') }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === 'openrouter' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          OpenRouter
          <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">recommended</span>
        </button>
        <button
          type="button"
          onClick={() => { setTab('direct'); setKeyValue('') }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === 'direct' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          Direct provider
        </button>
      </div>

      {/* Direct provider selector */}
      {tab === 'direct' && (
        <div className="flex gap-1">
          {DIRECT_PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setDirectProvider(p); setKeyValue('') }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${directProvider === p ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'border border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500'}`}
            >
              {PROVIDERS[p].name}
            </button>
          ))}
        </div>
      )}

      {/* Tagline */}
      <p className="text-xs text-slate-500 dark:text-slate-400">{config.tagline}</p>

      {/* Key input */}
      <div>
        <input
          type="password"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder={config.keyPlaceholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
          Your key is sent only to {config.name} to generate responses. Never logged or stored on our servers.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <a href={config.consoleUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-sky-700 hover:underline dark:text-sky-400">
          Get a key at {config.consoleLabel} →
        </a>
        <button
          type="button"
          disabled={!keyValue.trim()}
          onClick={handleSave}
          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        >
          Save key
        </button>
      </div>
    </div>
  )
}

// ---- Main component -------------------------------------------------------

export function ChatPanel({
  contextType, repoResults, orgView, org, orgRepos = [], orgInventory, githubToken, resetKey,
  repoQuery = '', onRepoQueryChange,
}: ChatPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [provider, setProvider] = useState<ProviderId>('openrouter')
  const [modelTier, setModelTier] = useState<ModelTier>('fast')
  const [userKey, setUserKey] = useState('')
  const [orgRepoCount, setOrgRepoCount] = useState(500)
  const [sortBy, setSortBy] = useState<OrgSortBy>('stars')
  const [freeRemaining, setFreeRemaining] = useState(FREE_LIMIT)
  const [sessionCost, setSessionCost] = useState(0)
  const [sessionMsgCount, setSessionMsgCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hydrate from storage after mount
  useEffect(() => {
    try {
      const p = sessionStorage.getItem(SS_KEY_PROVIDER) ?? localStorage.getItem(LS_KEY_PROVIDER)
      if (p && p in PROVIDERS) setProvider(p as ProviderId)
      const t = localStorage.getItem(LS_KEY_MODEL_TIER)
      if (t === 'fast' || t === 'smart') setModelTier(t)
      const k = sessionStorage.getItem(SS_KEY_API_KEY) ?? ''
      setUserKey(k)
      setExpanded(sessionStorage.getItem(SS_KEY_EXPANDED) === 'true')
    } catch {}
  }, [])

  const context = useMemo(() => {
    if (contextType === 'repos' && repoResults) return serializeReposContext(repoResults).text
    if (contextType === 'org' && orgView && org) return serializeOrgContext(org, orgView, { maxRepos: orgRepoCount, sortBy, orgRepos }).text
    if (contextType === 'org' && orgInventory) return serializeOrgInventoryContext(orgInventory, { maxRepos: orgRepoCount, sortBy }).text
    return ''
  }, [contextType, repoResults, orgView, org, orgRepos, orgInventory, orgRepoCount, sortBy])

  const activeProvider = userKey ? provider : ('anthropic' as ProviderId)

  const { messages, input, setInput, handleSubmit, isLoading, stop, setMessages, data, append } = useChat({
    api: '/api/chat',
    body: {
      context,
      contextType,
      githubToken,
      provider: activeProvider,
      model: PROVIDERS[activeProvider].models[modelTier].id,
      apiKey: userKey || undefined,
    },
    onFinish: (_message: Message, options: { usage?: { promptTokens: number; completionTokens: number } }) => {
      const usage = options?.usage
      if (usage) {
        const cost = calcCost(usage.promptTokens, usage.completionTokens, activeProvider, modelTier)
        setSessionCost((prev) => prev + cost)
        setSessionMsgCount((prev) => prev + 1)
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('FREE_LIMIT_REACHED') || error.message.includes('free chats')) {
        setFreeRemaining(0)
      }
    },
  })

  // Sync freeRemaining from stream data
  useEffect(() => {
    if (!data?.length) return
    const last = [...data].reverse().find((d) => typeof (d as { remaining?: number }).remaining === 'number')
    if (last) setFreeRemaining((last as { remaining: number }).remaining)
  }, [data])

  // Scroll to latest message
  useEffect(() => {
    if (expanded) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, expanded])

  // Reset on resetKey change
  useEffect(() => {
    if (resetKey === undefined) return
    setMessages([])
    setInput('')
    setSessionCost(0)
    setSessionMsgCount(0)
    stop()
    try { sessionStorage.removeItem(SS_KEY_EXPANDED) } catch {}
    setExpanded(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function handleExpandToggle() {
    const next = !expanded
    setExpanded(next)
    try { sessionStorage.setItem(SS_KEY_EXPANDED, String(next)) } catch {}
  }

  function handleSaveKey(p: ProviderId, key: string) {
    setProvider(p)
    setUserKey(key)
    try {
      sessionStorage.setItem(SS_KEY_PROVIDER, p)
      sessionStorage.setItem(SS_KEY_API_KEY, key)
      localStorage.setItem(LS_KEY_PROVIDER, p)
    } catch {}
    setMessages([])
    setSessionCost(0)
    setSessionMsgCount(0)
  }

  function handleClearKey() {
    setUserKey('')
    try {
      sessionStorage.removeItem(SS_KEY_API_KEY)
      sessionStorage.removeItem(SS_KEY_PROVIDER)
    } catch {}
    setMessages([])
    setSessionCost(0)
    setSessionMsgCount(0)
  }

  function handleModelTierChange(t: ModelTier) {
    setModelTier(t)
    try { localStorage.setItem(LS_KEY_MODEL_TIER, t) } catch {}
    setMessages([])
    setSessionCost(0)
    setSessionMsgCount(0)
  }

  function handleOrgRepoCountChange(count: number) {
    if (count !== orgRepoCount) {
      setOrgRepoCount(count)
      setMessages([])
      setSessionCost(0)
      setSessionMsgCount(0)
    }
  }

  function handleSortByChange(s: OrgSortBy) {
    if (s !== sortBy) {
      setSortBy(s)
      setMessages([])
      setSessionCost(0)
      setSessionMsgCount(0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const hasKey = !!userKey
  const limitReached = !hasKey && freeRemaining === 0
  const isInventoryPhase = contextType === 'org' && !orgView && !!orgInventory
  const starterChips = contextType === 'repos' ? REPOS_STARTER_CHIPS : isInventoryPhase ? ORG_INVENTORY_STARTER_CHIPS : ORG_STARTER_CHIPS
  const showChips = messages.length === 0 && !isLoading
  const orgTotal = orgView?.status.total ?? orgInventory?.results.length ?? 0
  const isOrgAndLarge = contextType === 'org' && orgTotal > 500
  const activeModelSpec = PROVIDERS[activeProvider].models[modelTier]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-5xl px-4">
      <div className="rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">

        {/* Collapsed bar */}
        {!expanded ? (
          <button type="button" onClick={handleExpandToggle}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <span aria-hidden="true" className="text-base">✨</span>
            <span className="flex-1">
              Ask a question about this analysis
              {repoQuery && (
                <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  {repoQuery}
                </span>
              )}
            </span>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4-4 4 4" />
            </svg>
          </button>
        ) : (
          <>
            {/* Panel header */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
              <span className="mr-1 font-semibold text-slate-900 dark:text-slate-100">Ask Claude</span>

              {/* Model tier switcher */}
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                {(['fast', 'smart'] as ModelTier[]).map((t) => {
                  const spec = PROVIDERS[activeProvider].models[t]
                  return (
                    <button key={t} type="button"
                      title={`${spec.label} · $${PROVIDERS[activeProvider].models[t].inputRate}/1M in · $${PROVIDERS[activeProvider].models[t].outputRate}/1M out`}
                      onClick={() => handleModelTierChange(t)}
                      className={modelTier === t
                        ? 'rounded-full bg-white px-2.5 py-1 text-xs font-medium shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                        : 'rounded-full px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}>
                      {t === 'fast' ? '⚡' : '🧠'} {t === 'fast' ? 'Fast' : 'Smart'}
                    </button>
                  )
                })}
              </div>

              {/* Provider badge (when key set) */}
              {hasKey && (
                <span className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {PROVIDERS[provider].name} · {activeModelSpec.label}
                </span>
              )}

              {/* Org controls */}
              {isOrgAndLarge && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <label htmlFor="chat-repo-count" className="whitespace-nowrap">Top</label>
                    <input id="chat-repo-count" type="range" min="50" max="500" step="50"
                      value={orgRepoCount} onChange={(e) => handleOrgRepoCountChange(Number(e.target.value))}
                      className="w-20 accent-sky-600" />
                    <span className="w-8 text-right font-medium">{orgRepoCount}</span>
                    <span>repos</span>
                  </div>
                  <select value={sortBy} onChange={(e) => handleSortByChange(e.target.value as OrgSortBy)}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </>
              )}

              {/* Session cost */}
              {sessionMsgCount > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {sessionMsgCount} {sessionMsgCount === 1 ? 'msg' : 'msgs'} · {formatCost(sessionCost)}
                </span>
              )}

              {/* Free chat indicator */}
              {!hasKey && (
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: FREE_LIMIT }, (_, i) => (
                    <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${i < freeRemaining ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  ))}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {freeRemaining > 0 ? `${freeRemaining} free ${freeRemaining === 1 ? 'chat' : 'chats'} left` : 'Free limit reached'}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {hasKey && (
                  <button type="button" onClick={handleClearKey}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                    Change key
                  </button>
                )}
                {messages.length > 0 && (
                  <button type="button" onClick={() => { setMessages([]); setSessionCost(0); setSessionMsgCount(0); stop() }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    New conversation
                  </button>
                )}
                <button type="button" onClick={handleExpandToggle} aria-label="Collapse chat"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Structured search filter */}
            {contextType === 'org' && onRepoQueryChange && (
              <SearchFilter value={repoQuery} onChange={onRepoQueryChange} />
            )}

            {/* Chat section label */}
            <div className="flex items-center gap-2 px-4 pt-2 pb-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Chat with Claude</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
            </div>

            {/* Key entry or chat */}
            {!hasKey || limitReached ? (
              <KeyEntryForm onSave={handleSaveKey} exhausted={limitReached} />
            ) : (
              <>
                {/* Message history */}
                <div className="flex h-[40vh] flex-col overflow-y-auto px-4 py-3 space-y-3" aria-live="polite" aria-label="Chat messages">
                  {showChips && (
                    <div className="flex flex-wrap gap-2">
                      {starterChips.map((chip) => (
                        <button key={chip} type="button"
                          onClick={() => void append({ role: 'user', content: chip })}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {messages.map((msg) => {
                    if (msg.role === 'user') {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[80%] rounded-2xl bg-sky-600 px-4 py-2 text-sm text-white">{msg.content}</div>
                        </div>
                      )
                    }
                    return (
                      <div key={msg.id} className="flex flex-col items-start gap-1">
                        <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {msg.content ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">{renderMarkdown(msg.content)}</div>
                          ) : (
                            <span className="animate-pulse text-slate-400">●</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question…"
                      rows={1}
                      disabled={isLoading}
                      className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                      style={{ minHeight: '38px', maxHeight: '120px' }}
                    />
                    {isLoading ? (
                      <button type="button" onClick={stop}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">
                        <svg aria-label="Stop" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <rect x="4" y="4" width="12" height="12" rx="1" />
                        </svg>
                      </button>
                    ) : (
                      <button type="submit" disabled={!input.trim()} aria-label="Send message"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 dark:bg-sky-500 dark:hover:bg-sky-400">
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.087L2.28 16.762a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.208-7.787.75.75 0 0 0 0-1.049A28.897 28.897 0 0 0 3.105 2.288Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
