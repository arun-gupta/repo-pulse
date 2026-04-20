import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DemoSignInDialog } from './DemoSignInDialog'

describe('DemoSignInDialog', () => {
  it('renders with role="dialog" and aria-modal', () => {
    render(<DemoSignInDialog repos={['facebook/react']} onDismiss={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('shows single repo name in heading', () => {
    render(<DemoSignInDialog repos={['facebook/react']} onDismiss={vi.fn()} />)
    expect(screen.getByRole('heading')).toHaveTextContent('Sign in with GitHub to analyze facebook/react')
  })

  it('shows repo count in heading for multiple repos', () => {
    const repos = ['a/b', 'c/d', 'e/f', 'g/h', 'i/j', 'k/l', 'm/n']
    render(<DemoSignInDialog repos={repos} onDismiss={vi.fn()} />)
    expect(screen.getByRole('heading')).toHaveTextContent('Sign in with GitHub to analyze these 7 repositories')
  })

  it('primary CTA links to /', () => {
    render(<DemoSignInDialog repos={['a/b']} onDismiss={vi.fn()} />)
    const link = screen.getByRole('link', { name: /sign in with github/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('calls onDismiss when "Stay in demo" is clicked', () => {
    const onDismiss = vi.fn()
    render(<DemoSignInDialog repos={['a/b']} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /stay in demo/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn()
    render(<DemoSignInDialog repos={['a/b']} onDismiss={onDismiss} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
