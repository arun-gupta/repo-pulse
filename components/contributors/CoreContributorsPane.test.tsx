import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CoreContributorsPane } from './CoreContributorsPane'

describe('CoreContributorsPane', () => {
  it('renders the core contributor metrics and compact heatmap with optional names and numbers', async () => {
    render(
      <CoreContributorsPane
        metrics={[
          { label: 'Total contributors', value: 'unavailable' },
          { label: 'Active contributors (90d)', value: '5' },
          { label: 'Repeat contributors (90d)', value: '3' },
        ]}
        heatmap={[
          { contributor: 'alice', commitsLabel: '5 commits', intensity: 'max' },
          { contributor: 'bob', commitsLabel: '2 commits', intensity: 'medium' },
        ]}
      />,
    )

    expect(screen.getByText(/first-slice contributor metrics/i)).toBeInTheDocument()
    expect(screen.getByText('Total contributors')).toBeInTheDocument()
    expect(screen.queryByText('Contribution concentration')).not.toBeInTheDocument()
    expect(screen.getByText(/contribution heatmap/i)).toBeInTheDocument()
    expect(screen.getByText(/darker bubbles indicate more recent commits/i)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: /contribution heatmap tiles/i })).toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show names/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show numbers/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/alice 5 commits/i)).toBeInTheDocument()
    expect(screen.queryByText('5 commits')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /show names/i }))

    expect(screen.getByRole('button', { name: /hide names/i })).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /show numbers/i }))

    expect(screen.getByRole('button', { name: /hide numbers/i })).toBeInTheDocument()
    expect(screen.getByText('5 commits')).toBeInTheDocument()
    expect(screen.getByText('unavailable')).toBeInTheDocument()
  })
})
