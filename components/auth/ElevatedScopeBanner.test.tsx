import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { ElevatedScopeBanner } from './ElevatedScopeBanner'

describe('ElevatedScopeBanner', () => {
  it('renders nothing when there is no session', () => {
    render(
      <AuthProvider>
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    expect(screen.queryByTestId('elevated-scope-banner')).not.toBeInTheDocument()
  })

  it('renders nothing when session has only the baseline public_repo scope', () => {
    render(
      <AuthProvider
        initialSession={{ token: 'gho_abc', username: 'arun-gupta', scopes: ['public_repo'] }}
      >
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    expect(screen.queryByTestId('elevated-scope-banner')).not.toBeInTheDocument()
  })

  it('renders and enumerates scopes verbatim when session carries an elevated scope', () => {
    render(
      <AuthProvider
        initialSession={{
          token: 'gho_abc',
          username: 'arun-gupta',
          scopes: ['public_repo', 'read:org'],
        }}
      >
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    expect(screen.getByTestId('elevated-scope-banner')).toBeInTheDocument()
    expect(screen.getByTestId('elevated-scope-banner-scopes')).toHaveTextContent('read:org')
  })

  it('enumerates all non-baseline scopes, not just the first', () => {
    render(
      <AuthProvider
        initialSession={{
          token: 'gho_abc',
          username: 'arun-gupta',
          scopes: ['public_repo', 'read:org', 'admin:org'],
        }}
      >
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    expect(screen.getByTestId('elevated-scope-banner-scopes')).toHaveTextContent('read:org, admin:org')
  })

  it('hides the banner when the dismiss button is clicked', async () => {
    render(
      <AuthProvider
        initialSession={{
          token: 'gho_abc',
          username: 'arun-gupta',
          scopes: ['public_repo', 'read:org'],
        }}
      >
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    expect(screen.getByTestId('elevated-scope-banner')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /dismiss elevated permissions banner/i }))
    expect(screen.queryByTestId('elevated-scope-banner')).not.toBeInTheDocument()
  })

  it('clears the session when "Sign out to revert" is clicked', async () => {
    render(
      <AuthProvider
        initialSession={{
          token: 'gho_abc',
          username: 'arun-gupta',
          scopes: ['public_repo', 'read:org'],
        }}
      >
        <ElevatedScopeBanner />
      </AuthProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /sign out to revert/i }))
    expect(screen.queryByTestId('elevated-scope-banner')).not.toBeInTheDocument()
  })
})
