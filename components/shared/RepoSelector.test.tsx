import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RepoSelector } from './RepoSelector'

const repos = ['alpha/repo-a', 'beta/repo-b', 'gamma/repo-c']

describe('RepoSelector', () => {
  it('renders current repo name and count', () => {
    render(<RepoSelector repos={repos} selectedIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByText('alpha/repo-a')).toBeInTheDocument()
    expect(screen.getByText('(1/3)')).toBeInTheDocument()
  })

  it('disables previous button on first repo', () => {
    render(<RepoSelector repos={repos} selectedIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByLabelText('Previous repository')).toBeDisabled()
    expect(screen.getByLabelText('Next repository')).toBeEnabled()
  })

  it('disables next button on last repo', () => {
    render(<RepoSelector repos={repos} selectedIndex={2} onSelect={vi.fn()} />)
    expect(screen.getByLabelText('Previous repository')).toBeEnabled()
    expect(screen.getByLabelText('Next repository')).toBeDisabled()
  })

  it('calls onSelect with next index when clicking next', async () => {
    const onSelect = vi.fn()
    render(<RepoSelector repos={repos} selectedIndex={1} onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText('Next repository'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('calls onSelect with previous index when clicking prev', async () => {
    const onSelect = vi.fn()
    render(<RepoSelector repos={repos} selectedIndex={1} onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText('Previous repository'))
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('opens dropdown and selects a repo', async () => {
    const onSelect = vi.fn()
    render(<RepoSelector repos={repos} selectedIndex={0} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('alpha/repo-a'))
    // Dropdown should now show all repos
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.click(screen.getByText('gamma/repo-c'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('navigates with arrow keys', async () => {
    const onSelect = vi.fn()
    const { container } = render(<RepoSelector repos={repos} selectedIndex={1} onSelect={onSelect} />)
    const nav = container.querySelector('[role="navigation"]') as HTMLElement
    nav.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onSelect).toHaveBeenCalledWith(2)
    await userEvent.keyboard('{ArrowLeft}')
    expect(onSelect).toHaveBeenCalledWith(0)
  })
})
