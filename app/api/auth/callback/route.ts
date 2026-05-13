import { cookies } from 'next/headers'

export const runtime = 'nodejs'

const OAUTH_STATE_COOKIE = 'repo_pulse_oauth_state'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') ?? ''

  // State format: "{csrf}|{returnOrigin}" — extract both parts.
  // The return origin is the host that initiated the login (may differ from
  // the callback host when GitHub's registered callback URL is on Vercel but
  // the user started the flow on localhost or a preview deployment).
  const pipeIdx = state.indexOf('|')
  const csrfFromState = pipeIdx >= 0 ? state.slice(0, pipeIdx) : state
  const returnOriginFromState = pipeIdx >= 0 ? state.slice(pipeIdx + 1) : ''
  const { origin } = new URL(request.url)
  const appUrl = returnOriginFromState || origin

  // Handle user denial or GitHub error
  if (error) {
    return Response.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`, 302)
  }

  // Cross-domain relay: when the login originated on a different host than
  // this registered callback (e.g. localhost dev server vs. Vercel callback),
  // the CSRF cookie set by the login is not accessible here. Redirect the
  // browser back to the originating host's /api/auth/relay, which has the
  // cookie and can complete CSRF validation and token exchange there.
  if (returnOriginFromState && returnOriginFromState !== origin) {
    if (!code) {
      return Response.redirect(`${appUrl}/?auth_error=missing_code`, 302)
    }
    const relayUrl = new URL('/api/auth/relay', returnOriginFromState)
    relayUrl.searchParams.set('code', code)
    relayUrl.searchParams.set('state', state)
    return Response.redirect(relayUrl.toString(), 302)
  }

  // Same-origin path: validate CSRF via cookie, then exchange code for token.
  const cookieStore = await cookies()
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value

  if (!storedState || storedState !== csrfFromState) {
    return Response.redirect(`${appUrl}/?auth_error=invalid_state`, 302)
  }

  cookieStore.delete(OAUTH_STATE_COOKIE)

  return exchangeCodeForToken(code, appUrl)
}

async function exchangeCodeForToken(code: string | null, appUrl: string): Promise<Response> {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string
    scope?: string
    error?: string
  }

  if (!tokenData.access_token) {
    return Response.redirect(`${appUrl}/?auth_error=token_exchange_failed`, 302)
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  const userData = (await userResponse.json()) as { login?: string }
  const username = userData.login ?? 'unknown'
  const scopes = tokenData.scope ?? ''

  const fragment = `token=${encodeURIComponent(tokenData.access_token)}&username=${encodeURIComponent(username)}&scopes=${encodeURIComponent(scopes)}`
  return Response.redirect(`${appUrl}/#${fragment}`, 302)
}
