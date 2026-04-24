export interface SkippedIssue {
  issueNumber: number
  issueUrl: string
  title: string
  reason: string
}

export interface BoardReposResult {
  repos: string[]
  skipped: SkippedIssue[]
}

type GitHubIssueListItem = {
  number: number
  title: string
  html_url: string
}

const GITHUB_REPO_RE = /https?:\/\/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+?)(?:\/|\.git|$|\s)/i

async function fetchIssuesByLabel(token: string, label: string): Promise<GitHubIssueListItem[]> {
  const issues: GitHubIssueListItem[] = []
  let page = 1
  while (page <= 3) {
    const res = await fetch(
      `https://api.github.com/repos/cncf/sandbox/issues?labels=${encodeURIComponent(label)}&state=open&per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'RepoPulse/1.0',
        },
        signal: AbortSignal.timeout(15_000),
      },
    )
    if (!res.ok) break
    const batch = (await res.json()) as GitHubIssueListItem[]
    if (!Array.isArray(batch) || batch.length === 0) break
    issues.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return issues
}

function extractRepoSlugFromBody(body: string): string | null {
  // Split the body on ### headings to get individual sections
  const parts = body.split(/^### /m)

  // First pass: headings that specifically reference the GitHub/project URL
  for (const part of parts) {
    const newlineIdx = part.indexOf('\n')
    if (newlineIdx === -1) continue
    const heading = part.slice(0, newlineIdx).trim()
    const content = part.slice(newlineIdx + 1).trim()

    if (/github/i.test(heading) && /(url|link|org|project|repo)/i.test(heading)) {
      const match = GITHUB_REPO_RE.exec(content)
      if (match?.[1] && !match[1].startsWith('cncf/')) return match[1]
    }
  }

  // Second pass: any section with a GitHub URL
  for (const part of parts) {
    const newlineIdx = part.indexOf('\n')
    if (newlineIdx === -1) continue
    const content = part.slice(newlineIdx + 1).trim()

    const match = GITHUB_REPO_RE.exec(content)
    if (match?.[1] && !match[1].startsWith('cncf/')) return match[1]
  }

  return null
}

export async function fetchBoardRepos(token: string): Promise<BoardReposResult> {
  const [newIssues, upcomingIssues] = await Promise.all([
    fetchIssuesByLabel(token, 'New'),
    fetchIssuesByLabel(token, 'Upcoming'),
  ])

  // Deduplicate by issue number
  const seen = new Set<number>()
  const allIssues: GitHubIssueListItem[] = []
  for (const issue of [...newIssues, ...upcomingIssues]) {
    if (!seen.has(issue.number)) {
      seen.add(issue.number)
      allIssues.push(issue)
    }
  }

  // Fetch bodies in parallel and extract repo slugs
  const resolved = await Promise.all(
    allIssues.map(async (issue) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/cncf/sandbox/issues/${issue.number}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'User-Agent': 'RepoPulse/1.0',
            },
            signal: AbortSignal.timeout(10_000),
          },
        )
        if (!res.ok) return { issue, slug: null as string | null, reason: 'Failed to fetch issue body' }
        const data = (await res.json()) as { body?: string }
        const slug = data.body ? extractRepoSlugFromBody(data.body) : null
        return { issue, slug, reason: slug ? null : 'No GitHub repository URL found in issue body' }
      } catch {
        return { issue, slug: null as string | null, reason: 'Failed to fetch issue body' }
      }
    }),
  )

  const repos: string[] = []
  const skipped: SkippedIssue[] = []
  const seenSlugs = new Set<string>()

  for (const { issue, slug, reason } of resolved) {
    if (slug && !seenSlugs.has(slug.toLowerCase())) {
      seenSlugs.add(slug.toLowerCase())
      repos.push(slug)
    } else if (!slug) {
      skipped.push({
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        title: issue.title,
        reason: reason ?? 'No repository URL found',
      })
    } else {
      skipped.push({
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        title: issue.title,
        reason: `Duplicate repository: ${slug}`,
      })
    }
  }

  return { repos, skipped }
}
