# Solo-project profile: alternate scoring surface

Issue: #214

## Problem

RepoPulse uses one scoring surface for every repo. Community-shape metrics
(Contributors, Responsiveness) dominate the composite OSS Health Score, so
solo and near-solo projects — which are well represented on GitHub — always
score low or surface "insufficient data" even when they are otherwise well
maintained.

## Solution

Detect the solo-project shape from existing signals, and when tripped:

1. Render a transparent banner explaining the profile and the scoring change.
2. Re-weight the composite over Activity, Security, and Documentation only.
   Contributors and Responsiveness are hidden, not scored.
3. Allow a session-scoped manual override back to the community scoring
   surface.

## Detection heuristic

A repository is classified as a solo project when **3 of 4** of these
conditions hold:

| # | Criterion |
|---|---|
| 1 | `totalContributors <= 2` |
| 2 | `uniqueCommitAuthors90d <= 2` |
| 3 | `maintainerCount` is `0`, `1`, or `'unavailable'` |
| 4 | No `GOVERNANCE.md` (`documentationResult.fileChecks` `governance` is absent or unavailable) |

Rationale for criterion 4: the issue lists "No CODEOWNERS / GOVERNANCE.md"
as a single criterion. `maintainerCount` (criterion 3) is already derived
from `CODEOWNERS`, `MAINTAINERS*`, and `OWNERS*` files — so `maintainerCount`
being `'unavailable'` already implies absence of a CODEOWNERS with parseable
entries. Using `GOVERNANCE.md` as the 4th signal keeps criterion 4
orthogonal to criterion 3 and relies only on already-exposed fields.

Unavailable inputs count as solo-leaning per the issue — criterion 3 already
treats `'unavailable'` as tripping, and criterion 4 treats an unavailable
documentationResult as tripping (no verified governance file).

## Alternate weights

| Bucket          | Community | Solo     |
|-----------------|-----------|----------|
| Contributors    | 23%       | hidden   |
| Responsiveness  | 25%       | hidden   |
| Activity        | 25%       | 30%      |
| Security        | 15%       | 35%      |
| Documentation   | 12%       | 35%      |

Solo weights sum to 100%. Composite is renormalized over available buckets
in both modes.

## UI behaviour

- When the profile trips:
  - Show a banner above the OSS Health Score: "This project looks solo-maintained. Scoring emphasizes Activity, Security, and Documentation."
  - Hide the Contributors and Responsiveness bucket cells from the scorecard.
  - Show the `[Use community scoring]` toggle next to the banner.
- When a user toggles override:
  - Session-scoped only (React state, not persisted).
  - Re-renders the card with community weights.
  - Toggle label flips to `[Use solo scoring]`.

## Acceptance

- [x] `detectSoloProjectProfile(result)` helper with the 3-of-4 heuristic; unit-tested across edge cases
- [x] Solo-project scoring surface with renormalized weights (Activity + Security + Documentation)
- [x] Banner + hidden Contributors/Responsiveness in the scorecard UI when the profile trips
- [x] Manual override toggle (session-scoped, not persisted)
- [ ] Calibration sample of solo projects — **deferred**. The existing calibration brackets are computed from mixed samples that already include solo-shaped repos; a dedicated solo calibration is a data task that does not block the scoring surface. Tracked as a follow-up comment on #214.
- [ ] README "Who it's for" section — **deferred**. The landing-page + README framing change that precedes this RFE will be refreshed in a separate PR.

## Out of scope

See issue — unchanged.
