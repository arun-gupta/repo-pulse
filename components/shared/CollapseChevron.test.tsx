import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CollapseChevron } from './CollapseChevron'

describe('CollapseChevron', () => {
  it('renders with rotate-0 when expanded', () => {
    const { container } = render(<CollapseChevron expanded={true} />)
    const svg = container.querySelector('svg')!
    expect(svg.className.baseVal).toContain('rotate-0')
    expect(svg.className.baseVal).not.toContain('-rotate-90')
  })

  it('renders with -rotate-90 when collapsed', () => {
    const { container } = render(<CollapseChevron expanded={false} />)
    const svg = container.querySelector('svg')!
    expect(svg.className.baseVal).toContain('-rotate-90')
  })
})
