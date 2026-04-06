# Data Model: Org-Level Repo Inventory (P1-F16)

## OrgInventoryRequest

- `org`: normalized GitHub organization slug
- `tokenSource`: `server` | `client`

## OrgRepoSummary

- `repo`: `owner/repo`
- `name`: repository name
- `description`: string | `unavailable`
- `primaryLanguage`: string | `unavailable`
- `stars`: number | `unavailable`
- `forks`: number | `unavailable`
- `watchers`: number | `unavailable`
- `openIssues`: number | `unavailable`
- `pushedAt`: ISO timestamp | `unavailable`
- `archived`: boolean
- `url`: GitHub URL

## OrgInventorySummary

- `totalPublicRepos`: number
- `totalStars`: number | `unavailable`
- `mostStarredRepos`: `Array<{ repo: string; stars: number | 'unavailable' }>`
- `mostRecentlyActiveRepos`: `Array<{ repo: string; pushedAt: string | 'unavailable' }>`
- `languageDistribution`: `Array<{ language: string; repoCount: number }>`
- `archivedRepoCount`: number
- `activeRepoCount`: number

## OrgInventoryResponse

- `org`: normalized org slug
- `summary`: `OrgInventorySummary`
- `results`: `OrgRepoSummary[]`
- `rateLimit`: existing rate-limit shape | `null`
- `failure`: `null` | `{ code: string; message: string }`

## OrgInventoryFilters

- `repoQuery`: string
- `language`: string | `all`
- `archived`: `all` | `active` | `archived`
- `sortColumn`: visible column id
- `sortDirection`: `asc` | `desc`

## OrgInventorySelection

- `selectedRepos`: string[]
- `selectionLimit`: number
- `maxSelectionLimit`: number
- `limitError`: string | `null`

## Config

### OrgInventoryConfig

- `defaultBulkSelectionLimit`: number
- `maxBulkSelectionLimit`: number

Phase 1 default:
- `defaultBulkSelectionLimit = 5`
- `maxBulkSelectionLimit = 5`
