# Overview UI Contract: Metric Cards

## Overview tab

When one or more successful repositories exist:

- render one summary card per successful repository
- keep failed repositories in the existing failure section outside the cards
- do not fabricate cards for failures

When no successful repositories exist:

- show the existing overview empty/error state
- do not render placeholder repo cards

## Summary card content

Each collapsed card shows:

- repository slug/name
- ecosystem profile:
  - Reach
  - Engagement
  - Attention
- exact stars
- exact forks
- exact watches/watchers
- created date
- three CHAOSS score badges:
  - Evolution
  - Sustainability
  - Responsiveness

## Score badge behavior

- badges must always show category label + score value
- badge colors remain consistent across all cards
- if a real category score is not yet available, the badge shows `Not scored yet`

The card remains a summary surface and does not host deeper metric exploration inline.
