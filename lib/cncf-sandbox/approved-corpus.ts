/**
 * Fetches the last 100 approved CNCF Sandbox applications (closed issues with
 * label:sandbox), extracts the cloud-native-fit and benefit-to-landscape
 * sections from each, and ranks CNCF project mentions by frequency.
 *
 * The result is cached for 15 minutes. On any failure the function throws so
 * the caller (via Promise.allSettled) can omit the corpus hint gracefully.
 */

export interface CorpusProject {
  name: string
  /** Percentage of sampled approved applications that cite this project (0–100) */
  pct: number
}

export interface ApprovedCorpusSummary {
  /** Number of approved applications actually sampled */
  totalSampled: number
  /** CNCF projects ranked by how many approved applications cite them, with percentages */
  topCNCFProjects: CorpusProject[]
}

// Each entry: [substring to search for in lowercased text, canonical display name].
// Multiple aliases map to the same display name — deduplication prevents
// a single document counting more than once per display name.
const CNCF_PROJECT_TOKENS: Array<[string, string]> = [
  ['kubernetes', 'Kubernetes'],
  ['prometheus', 'Prometheus'],
  ['envoy', 'Envoy'],
  ['grpc', 'gRPC'],
  ['cert-manager', 'cert-manager'],
  ['argo', 'Argo'],
  ['flux', 'Flux'],
  ['helm', 'Helm'],
  ['linkerd', 'Linkerd'],
  ['harbor', 'Harbor'],
  ['rook', 'Rook'],
  ['opentelemetry', 'OpenTelemetry'],
  ['open telemetry', 'OpenTelemetry'],
  [' otel ', 'OpenTelemetry'],
  ['cilium', 'Cilium'],
  ['falco', 'Falco'],
  ['keda', 'KEDA'],
  ['crossplane', 'Crossplane'],
  ['dapr', 'Dapr'],
  ['knative', 'Knative'],
  ['backstage', 'Backstage'],
  ['kyverno', 'Kyverno'],
  ['thanos', 'Thanos'],
  ['jaeger', 'Jaeger'],
  ['kustomize', 'Kustomize'],
  ['containerd', 'containerd'],
  ['etcd', 'etcd'],
  ['coredns', 'CoreDNS'],
  ['core dns', 'CoreDNS'],
  ['fluentd', 'Fluentd'],
  ['fluent bit', 'Fluent Bit'],
  ['fluentbit', 'Fluent Bit'],
  ['spiffe', 'SPIFFE'],
  ['spire', 'SPIRE'],
  ['tuf', 'TUF'],
  ['notary', 'Notary'],
  ['in-toto', 'in-toto'],
  ['kubevirt', 'KubeVirt'],
  ['litmus', 'LitmusChaos'],
  ['chaos mesh', 'Chaos Mesh'],
  ['chaosmesh', 'Chaos Mesh'],
  ['vitess', 'Vitess'],
  ['dragonfly', 'Dragonfly'],
  ['volcano', 'Volcano'],
  ['nats', 'NATS'],
  ['kubeedge', 'KubeEdge'],
  ['open policy agent', 'OPA'],
  [' opa ', 'OPA'],
  ['istio', 'Istio'],
  ['tekton', 'Tekton'],
  ['pixie', 'Pixie'],
  ['longhorn', 'Longhorn'],
  ['contour', 'Contour'],
  ['metallb', 'MetalLB'],
  ['wasmedge', 'WasmEdge'],
  ['wasmtime', 'Wasmtime'],
  ['cri-o', 'CRI-O'],
  ['crio', 'CRI-O'],
  ['nfd', 'Node Feature Discovery'],
  ['node feature discovery', 'Node Feature Discovery'],
  ['kepler', 'Kepler'],
  ['kubeflow', 'Kubeflow'],
  ['ray', 'Ray'],
  ['oras', 'ORAS'],
  ['karmada', 'Karmada'],
  ['kwok', 'KWOK'],
  ['cluster api', 'Cluster API'],
  ['capi', 'Cluster API'],
]

function extractSection(body: string, headingPattern: RegExp): string | null {
  const parts = body.split(/^### /m)
  for (const part of parts) {
    const newlineIdx = part.indexOf('\n')
    if (newlineIdx === -1) continue
    const heading = part.slice(0, newlineIdx).trim()
    const content = part.slice(newlineIdx + 1).trim()
    if (headingPattern.test(heading) && content.length > 20) return content
  }
  return null
}

function mentionsInDoc(text: string): Set<string> {
  const lower = text.toLowerCase()
  const found = new Set<string>()
  const seen = new Set<string>()
  for (const [token, displayName] of CNCF_PROJECT_TOKENS) {
    if (seen.has(displayName)) continue
    if (lower.includes(token)) {
      found.add(displayName)
      seen.add(displayName)
    }
  }
  return found
}

/** Detect which corpus-tracked CNCF projects are mentioned in a block of text. */
export function detectCorpusProjects(text: string): Set<string> {
  return mentionsInDoc(text)
}

async function fetchApprovedIssues(token: string): Promise<Array<{ body: string }>> {
  const res = await fetch(
    'https://api.github.com/repos/cncf/sandbox/issues?state=closed&labels=sandbox&per_page=100&page=1&sort=created&direction=desc',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'RepoPulse/1.0',
      },
      signal: AbortSignal.timeout(15_000),
    },
  )
  if (!res.ok) throw new Error(`Failed to fetch approved sandbox issues: HTTP ${res.status}`)
  const issues = (await res.json()) as Array<{ body?: string | null }>
  return issues.filter((i) => i.body).map((i) => ({ body: i.body! }))
}

let corpusCache: { summary: ApprovedCorpusSummary; fetchedAt: number } | null = null
const CORPUS_CACHE_TTL = 15 * 60 * 1000

export async function buildApprovedCorpusSummary(token: string): Promise<ApprovedCorpusSummary> {
  if (corpusCache && Date.now() - corpusCache.fetchedAt < CORPUS_CACHE_TTL) {
    return corpusCache.summary
  }

  const issues = await fetchApprovedIssues(token)

  const frequency = new Map<string, number>()
  for (const issue of issues) {
    const cloudNativeFit = extractSection(issue.body, /cloud native .*(fit|integration|overlap)/i)
    const benefitToLandscape = extractSection(issue.body, /benefit to the landscape/i)
    // Fall back to the full body when neither section heading matches —
    // older approved applications predate the current template structure.
    const combinedText = [cloudNativeFit, benefitToLandscape].filter(Boolean).join('\n') || issue.body
    for (const name of mentionsInDoc(combinedText)) {
      frequency.set(name, (frequency.get(name) ?? 0) + 1)
    }
  }

  const total = issues.length
  const topCNCFProjects: CorpusProject[] = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))

  const summary: ApprovedCorpusSummary = { totalSampled: total, topCNCFProjects }
  corpusCache = { summary, fetchedAt: Date.now() }
  return summary
}
