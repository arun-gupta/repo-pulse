/**
 * Community tag mappings for tab-level display items.
 *
 * Mirrors the structure of `lib/tags/governance.ts`. The community lens
 * tags items across Documentation, Contributors, and Activity views
 * without double-counting — scoring for these signals lives inside each
 * host bucket's `score-config.ts`, not here.
 *
 * See `specs/180-community-scoring/data-model.md` §3.
 */

/** Documentation tab item keys that are community signals. */
export const COMMUNITY_DOC_FILES = new Set<string>([
  'code_of_conduct',
  'issue_templates',
  'pull_request_template',
  'governance',
])

/** Contributors tab metric labels that are community signals. */
export const COMMUNITY_CONTRIBUTORS_METRICS = new Set<string>([
  'CODEOWNERS',
  'Funding disclosure',
])

/** Activity tab item keys that are community signals. */
export const COMMUNITY_ACTIVITY_ITEMS = new Set<string>([
  'discussions',
])

export type CommunityDomain = 'doc_file' | 'contributors_metric' | 'activity_item'

export function isCommunityItem(key: string, domain: CommunityDomain): boolean {
  switch (domain) {
    case 'doc_file': return COMMUNITY_DOC_FILES.has(key)
    case 'contributors_metric': return COMMUNITY_CONTRIBUTORS_METRICS.has(key)
    case 'activity_item': return COMMUNITY_ACTIVITY_ITEMS.has(key)
  }
}
