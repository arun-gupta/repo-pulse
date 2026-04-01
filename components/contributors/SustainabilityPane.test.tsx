import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SustainabilityPane } from './SustainabilityPane'

describe('SustainabilityPane', () => {
  it('renders score details, compact threshold guidance, and grouped placeholder sustainability signals', async () => {
    render(
      <SustainabilityPane
        section={{
          repo: 'facebook/react',
          coreMetrics: [],
          sustainabilityScore: {
            value: 'Medium',
            tone: 'warning',
            description: 'Contributor activity is somewhat concentrated and may indicate moderate resilience risk.',
            concentration: 0.625,
            topContributorCount: 1,
            contributorCount: 5,
          },
          sustainabilityMetrics: [
            { label: 'Top 20% contributor share', value: '62.5%' },
            { label: 'Scored contributor group', value: '1 of 5 active contributors' },
          ],
          missingData: ['Total contributors', 'New contributors (90d)'],
          placeholderSignals: [
            'Maintainer count',
            'Inactive contributors',
            'Types of contributions',
            'Elephant Factor',
          ],
        }}
      />,
    )

    expect(screen.getByText(/how is this scored/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show thresholds/i })).toBeInTheDocument()
    expect(screen.getByText(/^High$/i)).toBeInTheDocument()
    expect(screen.getByText(/^<= 50%$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Medium$/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/^<= 75%$/i)).toBeInTheDocument()
    expect(screen.queryByText(/broadly distributed across the most active authors/i)).not.toBeInTheDocument()
    expect(screen.getByText(/what was scored/i)).toBeInTheDocument()
    expect(screen.getByText(/1 of 5 active contributors produced 62.5%/i)).toBeInTheDocument()
    expect(screen.getByText(/missing data/i)).toBeInTheDocument()
    expect(screen.getByText(/grouped areas/i)).toBeInTheDocument()
    expect(screen.getByText('Maintainership')).toBeInTheDocument()
    expect(screen.getByText('Contributor continuity')).toBeInTheDocument()
    expect(screen.getByText('Contribution shape')).toBeInTheDocument()
    expect(screen.getByText('Organization risk')).toBeInTheDocument()
    expect(screen.getByText('Elephant Factor')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /show thresholds/i }))

    expect(screen.getByRole('button', { name: /hide thresholds/i })).toBeInTheDocument()
    expect(screen.getByText(/broadly distributed across the most active authors/i)).toBeInTheDocument()
  })
})
