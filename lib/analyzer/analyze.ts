import type {
  AnalysisResult,
  AnalyzeInput,
  AnalyzeResponse,
  RateLimitState,
  RepositoryFetchFailure,
  Unavailable,
} from './analysis-result'
import { queryGitHubGraphQL } from './github-graphql'
import { fetchContributorCount } from './github-rest'
import { REPO_ACTIVITY_QUERY, REPO_COMMIT_HISTORY_PAGE_QUERY, REPO_OVERVIEW_QUERY } from './queries'

interface RepoOverviewResponse {
  repository: {
    name: string
    description: string | null
    createdAt: string
    primaryLanguage: { name: string } | null
    stargazerCount: number
    forkCount: number
    watchers: { totalCount: number }
    issues: { totalCount: number }
  } | null
}

interface RepoActivityResponse {
  repository: {
    defaultBranchRef: {
      target: {
        recent30: { totalCount: number }
        recent90: { totalCount: number }
        recent90Commits: CommitHistoryConnection | null
      } | null
    } | null
  } | null
  prsOpened: { issueCount: number }
  prsMerged: { issueCount: number }
  issuesClosed: { issueCount: number }
}

interface RepoCommitHistoryPageResponse {
  repository: {
    defaultBranchRef: {
      target: {
        recent90Commits: CommitHistoryConnection | null
      } | null
    } | null
  } | null
}

interface CommitHistoryConnection {
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
  nodes: CommitNode[]
}

interface CommitNode {
  authoredDate: string
  author: {
    name: string | null
    email: string | null
    user: {
      login: string
    } | null
  } | null
}

const UNAVAILABLE_FIELDS: Array<keyof AnalysisResult> = [
  'releases12mo',
  'uniqueCommitAuthors90d',
  'totalContributors',
  'commitCountsByAuthor',
  'issueFirstResponseTimestamps',
  'issueCloseTimestamps',
  'prMergeTimestamps',
]

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const results: AnalysisResult[] = []
  const failures: RepositoryFetchFailure[] = []
  let latestRateLimit: RateLimitState | null = null

  for (const repo of input.repos) {
    const [owner, name] = repo.split('/')

    try {
      const overview = await queryGitHubGraphQL<RepoOverviewResponse>(input.token, REPO_OVERVIEW_QUERY, {
        owner,
        name,
      })
      latestRateLimit = overview.rateLimit ?? latestRateLimit

      if (!overview.data.repository) {
        failures.push({
          repo,
          reason: 'Repository could not be analyzed.',
          code: 'NOT_FOUND',
        })
        continue
      }

      const now = new Date()
      const since30 = new Date(now)
      since30.setDate(now.getDate() - 30)
      const since90 = new Date(now)
      since90.setDate(now.getDate() - 90)
      const repoSearch = `${owner}/${name}`

      const activity = await queryGitHubGraphQL<RepoActivityResponse>(input.token, REPO_ACTIVITY_QUERY, {
        owner,
        name,
        since30: since30.toISOString(),
        since90: since90.toISOString(),
        prsOpenedQuery: `repo:${repoSearch} is:pr created:>=${since90.toISOString().slice(0, 10)}`,
        prsMergedQuery: `repo:${repoSearch} is:pr is:merged merged:>=${since90.toISOString().slice(0, 10)}`,
        issuesClosedQuery: `repo:${repoSearch} is:issue closed:>=${since90.toISOString().slice(0, 10)}`,
      })
      latestRateLimit = activity.rateLimit ?? latestRateLimit

      const contributorCount = await fetchContributorCount(input.token, owner, name)
      latestRateLimit = contributorCount.rateLimit ?? latestRateLimit

      const commitHistory = await collectRecentCommitHistory({
        token: input.token,
        owner,
        name,
        since90: since90.toISOString(),
        initialConnection: activity.data.repository?.defaultBranchRef?.target?.recent90Commits ?? null,
      })
      latestRateLimit = commitHistory.rateLimit ?? latestRateLimit

      results.push(buildAnalysisResult(repo, overview.data, activity.data, commitHistory.nodes, contributorCount.data))
    } catch (error) {
      latestRateLimit = latestRateLimit ?? extractRateLimitFromError(error)
      failures.push(buildFailure(repo, error))
    }
  }

  return {
    results,
    failures,
    rateLimit: latestRateLimit,
  }
}

function extractRateLimitFromError(error: unknown): RateLimitState | null {
  const maybeError = error as Error & { status?: number; retryAfter?: number | Unavailable }

  if (maybeError.status !== 403 && maybeError.retryAfter == null) {
    return null
  }

  return {
    remaining: 'unavailable',
    resetAt: 'unavailable',
    retryAfter: maybeError.retryAfter ?? 'unavailable',
  }
}

function buildAnalysisResult(
  repo: string,
  overview: RepoOverviewResponse,
  activity: RepoActivityResponse,
  recentCommitNodes: CommitNode[],
  totalContributorCount: number | Unavailable,
): AnalysisResult {
  const defaultBranchTarget = activity.repository?.defaultBranchRef?.target
  const contributorMetrics = buildContributorMetrics(recentCommitNodes)
  const missingFields = [...UNAVAILABLE_FIELDS].filter((field) => {
    if (field === 'uniqueCommitAuthors90d') {
      return contributorMetrics.uniqueCommitAuthors90d === 'unavailable'
    }

    if (field === 'commitCountsByAuthor') {
      return contributorMetrics.commitCountsByAuthor === 'unavailable'
    }

    if (field === 'totalContributors') {
      return totalContributorCount === 'unavailable'
    }

    return true
  })

  return {
    repo,
    name: overview.repository?.name ?? 'unavailable',
    description: overview.repository?.description ?? 'unavailable',
    createdAt: overview.repository?.createdAt ?? 'unavailable',
    primaryLanguage: overview.repository?.primaryLanguage?.name ?? 'unavailable',
    stars: overview.repository?.stargazerCount ?? 'unavailable',
    forks: overview.repository?.forkCount ?? 'unavailable',
    watchers: overview.repository?.watchers.totalCount ?? 'unavailable',
    commits30d: defaultBranchTarget?.recent30.totalCount ?? 'unavailable',
    commits90d: defaultBranchTarget?.recent90.totalCount ?? 'unavailable',
    releases12mo: 'unavailable',
    prsOpened90d: activity.prsOpened.issueCount,
    prsMerged90d: activity.prsMerged.issueCount,
    issuesOpen: overview.repository?.issues.totalCount ?? 'unavailable',
    issuesClosed90d: activity.issuesClosed.issueCount,
    uniqueCommitAuthors90d: contributorMetrics.uniqueCommitAuthors90d,
    totalContributors: totalContributorCount,
    commitCountsByAuthor: contributorMetrics.commitCountsByAuthor,
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    missingFields,
  }
}

async function collectRecentCommitHistory({
  token,
  owner,
  name,
  since90,
  initialConnection,
}: {
  token: string
  owner: string
  name: string
  since90: string
  initialConnection: CommitHistoryConnection | null
}): Promise<{ nodes: CommitNode[]; rateLimit: RateLimitState | null }> {
  if (!initialConnection) {
    return { nodes: [], rateLimit: null }
  }

  const nodes = [...initialConnection.nodes]
  let rateLimit: RateLimitState | null = null
  let hasNextPage = initialConnection.pageInfo.hasNextPage
  let cursor = initialConnection.pageInfo.endCursor

  while (hasNextPage && cursor) {
    const response = await queryGitHubGraphQL<RepoCommitHistoryPageResponse>(token, REPO_COMMIT_HISTORY_PAGE_QUERY, {
      owner,
      name,
      since90,
      after: cursor,
    })

    rateLimit = response.rateLimit ?? rateLimit

    const connection = response.data.repository?.defaultBranchRef?.target?.recent90Commits
    if (!connection) {
      break
    }

    nodes.push(...connection.nodes)
    hasNextPage = connection.pageInfo.hasNextPage
    cursor = connection.pageInfo.endCursor
  }

  return { nodes, rateLimit }
}

function buildContributorMetrics(recentCommitNodes: CommitNode[]): {
  uniqueCommitAuthors90d: number | Unavailable
  commitCountsByAuthor: Record<string, number> | Unavailable
} {
  if (recentCommitNodes.length === 0) {
    return {
      uniqueCommitAuthors90d: 'unavailable',
      commitCountsByAuthor: 'unavailable',
    }
  }

  const commitCountsByAuthor = new Map<string, number>()

  for (const node of recentCommitNodes) {
    const actorKey = getCommitActorKey(node)

    if (!actorKey) {
      return {
        uniqueCommitAuthors90d: 'unavailable',
        commitCountsByAuthor: 'unavailable',
      }
    }

    commitCountsByAuthor.set(actorKey, (commitCountsByAuthor.get(actorKey) ?? 0) + 1)
  }

  return {
    uniqueCommitAuthors90d: commitCountsByAuthor.size,
    commitCountsByAuthor: Object.fromEntries(commitCountsByAuthor.entries()),
  }
}

function getCommitActorKey(node: CommitNode): string | null {
  const login = node.author?.user?.login?.trim()
  if (login) {
    return `login:${login}`
  }

  const email = node.author?.email?.trim()
  if (email) {
    return `email:${email.toLowerCase()}`
  }

  const name = node.author?.name?.trim()
  if (name) {
    return `name:${name.toLowerCase()}`
  }

  return null
}

function buildFailure(repo: string, error: unknown): RepositoryFetchFailure {
  const maybeError = error as Error & { status?: number; retryAfter?: number | Unavailable }
  const message = maybeError?.message?.toLowerCase() ?? ''

  if (message.includes('not found')) {
    return { repo, reason: 'Repository could not be analyzed.', code: 'NOT_FOUND' }
  }

  if (maybeError.status === 401) {
    return { repo, reason: 'GitHub rejected the provided token.', code: 'UNAUTHORIZED' }
  }

  if (maybeError.status === 403 || message.includes('rate limit')) {
    return { repo, reason: 'GitHub rate limit prevented analysis.', code: 'RATE_LIMITED' }
  }

  return { repo, reason: 'Repository could not be analyzed.', code: 'FETCH_FAILED' }
}
