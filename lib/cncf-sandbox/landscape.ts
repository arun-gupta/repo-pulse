// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml') as { load: (text: string) => unknown }
import type { CNCFLandscapeData, LandscapeCategory } from './types'

const LANDSCAPE_URL =
  'https://raw.githubusercontent.com/cncf/landscape/master/landscape.yml'

let cache: CNCFLandscapeData | null = null

type RawItem = {
  repo_url?: string
  homepage_url?: string
  [key: string]: unknown
}

type RawSubcategory = {
  name?: string
  items?: RawItem[]
}

type RawCategory = {
  name?: string
  subcategories?: RawSubcategory[]
}

type LandscapeYml = {
  landscape?: RawCategory[]
}

export async function fetchCNCFLandscape(): Promise<CNCFLandscapeData | null> {
  if (cache) return cache

  try {
    const res = await fetch(LANDSCAPE_URL, {
      headers: { 'User-Agent': 'RepoPulse/1.0' },
      // 30 second timeout via AbortSignal
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null

    const text = await res.text()
    const raw = yaml.load(text) as LandscapeYml

    const repoUrls = new Set<string>()
    const homepageUrls = new Set<string>()
    const categories: LandscapeCategory[] = []

    for (const cat of raw?.landscape ?? []) {
      for (const sub of cat?.subcategories ?? []) {
        const projectRepos: string[] = []
        for (const item of sub?.items ?? []) {
          if (item.repo_url && typeof item.repo_url === 'string') {
            const normalized = normalizeUrl(item.repo_url)
            repoUrls.add(normalized)
            projectRepos.push(normalized)
          }
          if (item.homepage_url && typeof item.homepage_url === 'string') {
            homepageUrls.add(normalizeUrl(item.homepage_url))
          }
        }
        if (projectRepos.length > 0) {
          categories.push({
            name: cat.name ?? '',
            subcategoryName: sub.name ?? '',
            projectRepos,
          })
        }
      }
    }

    cache = { repoUrls, homepageUrls, fetchedAt: Date.now(), categories }
    return cache
  } catch {
    return null
  }
}

export function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')
}

export function isRepoInLandscape(repoSlug: string, data: CNCFLandscapeData): boolean {
  const slug = repoSlug.toLowerCase()
  // Match against both github.com/owner/repo and just owner/repo forms
  const full = slug.startsWith('https://') ? normalizeUrl(slug) : `https://github.com/${slug}`
  return data.repoUrls.has(full) || data.repoUrls.has(slug)
}
