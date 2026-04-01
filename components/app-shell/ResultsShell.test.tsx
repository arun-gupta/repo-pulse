import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ResultsShell } from './ResultsShell'

describe('ResultsShell', () => {
  it('keeps the analysis panel visible while switching tabs', async () => {
    render(
      <ResultsShell
        analysisPanel={<div>Analysis panel</div>}
        overview={<div>Overview content</div>}
        metrics={<div>Metrics coming soon</div>}
        responsiveness={<div>Responsiveness coming soon</div>}
        sustainability={<div>Sustainability coming soon</div>}
        comparison={<div>Comparison coming soon</div>}
      />,
    )

    expect(screen.getByText('Analysis panel')).toBeInTheDocument()
    expect(screen.getByText('Overview content')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Metrics' }))

    expect(screen.getByText('Analysis panel')).toBeInTheDocument()
    expect(screen.getByText('Metrics coming soon')).toBeInTheDocument()
  })

  it('renders the GitHub repo link in the header', () => {
    render(
      <ResultsShell
        analysisPanel={<div>Analysis panel</div>}
        overview={<div>Overview content</div>}
        metrics={<div>Metrics coming soon</div>}
        responsiveness={<div>Responsiveness coming soon</div>}
        sustainability={<div>Sustainability coming soon</div>}
        comparison={<div>Comparison coming soon</div>}
      />,
    )

    const link = screen.getByRole('link', { name: /github repository/i })
    expect(link).toHaveAttribute('href', 'https://github.com/arun-gupta/forkprint')
  })
})
