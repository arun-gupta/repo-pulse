import { queryGitHubGraphQL } from '@/lib/analyzer/github-graphql'

const BRANCH_PROTECTION_QUERY = `
  query BranchProtection($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
      branchProtectionRules(first: 10) {
        nodes {
          pattern
          requiresApprovingReviews
          requiredApprovingReviewCount
          requiresStatusChecks
        }
      }
    }
  }
`

interface BranchProtectionResponse {
  repository: {
    branchProtectionRules: {
      nodes: Array<{
        pattern: string
        requiresApprovingReviews: boolean
        requiredApprovingReviewCount: number
        requiresStatusChecks: boolean
      }>
    }
  } | null
}

export async function fetchBranchProtection(
  owner: string,
  repo: string,
  defaultBranch: string,
  token: string,
): Promise<boolean | 'unavailable'> {
  try {
    const result = await queryGitHubGraphQL<BranchProtectionResponse>(
      token,
      BRANCH_PROTECTION_QUERY,
      { owner, name: repo, branch: defaultBranch },
    )

    const rules = result.data.repository?.branchProtectionRules?.nodes ?? []

    // Check if any rule matches the default branch pattern
    for (const rule of rules) {
      if (rule.pattern === defaultBranch || rule.pattern === '*') {
        return true
      }
    }

    return rules.length > 0
  } catch {
    return 'unavailable'
  }
}
