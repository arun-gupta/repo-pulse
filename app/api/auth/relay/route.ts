import { cookies } from 'next/headers'

export const runtime = 'nodejs'

const OAUTH_STATE_COOKIE = 'repo_pulse_oauth_state'

/**
 * Cross-domain OAuth relay endpoint.
 *
 * When the GitHub OAuth App's registered callback URL is on a different host
 * than where the login was initiated (e.g. Vercel callback, localhost login),
 * the Vercel callback cannot read the CSRF cookie set by localhost. It
 * redirects here instead, on the originating host, where the cookie IS
 * accessible. This route validates CSRF and completes the token exchange.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') ?? ''
  const { origin } = url

  const pipeIdx = state.indexOf('|')
  const csrfFromState = pipeIdx >= 0 ? state.slice(0, pipeIdx) : state

  const cookieStore = await cookies()
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value

  if (!storedState || storedState !== csrfFromState) {
    return Response.redirect(`${origin}/?auth_error=invalid_state`, 302)
  }

  cookieStore.delete(OAUTH_STATE_COOKIE)

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
    return Response.redirect(`${origin}/?auth_error=token_exchange_failed`, 302)
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
  return Response.redirect(`${origin}/#${fragment}`, 302)
}
