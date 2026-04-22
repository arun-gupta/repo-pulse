import { analyze } from '@/lib/analyzer/analyze'
import type { FoundationTarget } from '@/lib/cncf-sandbox/types'
import { fetchCNCFLandscape } from '@/lib/cncf-sandbox/landscape'
import { evaluateAspirant } from '@/lib/cncf-sandbox/evaluate'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      repos?: string[]
      token?: string | null
      foundationTarget?: FoundationTarget
    }

    if (!Array.isArray(body.repos) || body.repos.length === 0) {
      return Response.json({ error: 'At least one repository is required.' }, { status: 400 })
    }

    const token = body.token

    if (!token) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const foundationTarget: FoundationTarget = body.foundationTarget ?? 'none'

    console.log(`[analyze] Starting analysis for ${body.repos.length} repo(s): ${body.repos.join(', ')}`)
    const start = Date.now()

    const response = await analyze({
      repos: body.repos,
      token,
    })

    // Fetch CNCF landscape data when CNCF Sandbox target is selected
    let landscapeData = null
    if (foundationTarget === 'cncf-sandbox') {
      try {
        landscapeData = await fetchCNCFLandscape()
      } catch {
        // Landscape fetch failure is non-fatal — evaluate.ts handles null gracefully
        console.warn('[analyze] CNCF landscape fetch failed — proceeding without landscape data')
      }

      // Attach aspirant evaluation results to each repo result
      for (const result of response.results) {
        const aspirantResult = evaluateAspirant(result, landscapeData)
        if (aspirantResult.alreadyInLandscape) {
          result.landscapeOverride = true
          result.aspirantResult = null
        } else {
          result.aspirantResult = aspirantResult
        }
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`[analyze] Completed in ${elapsed}s — ${response.results.length} succeeded, ${response.failures.length} failed`)
    if (response.rateLimit) {
      console.log(`[analyze] Rate limit remaining: ${response.rateLimit.remaining}, resets at: ${response.rateLimit.resetAt}`)
    }
    if (response.diagnostics?.length) {
      for (const d of response.diagnostics) {
        console.warn(`[analyze] Diagnostic: ${d.repo} ${d.source} — ${d.message}`)
      }
    }

    return Response.json(response)
  } catch (error) {
    console.error(`[analyze] Request failed:`, error)
    return Response.json({ error: 'Analysis request failed.' }, { status: 500 })
  }
}
