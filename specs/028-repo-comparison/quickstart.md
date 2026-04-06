# Quickstart: Repo Comparison

## Goal

Verify that `Comparison` becomes a real multi-repo workspace driven by the existing analysis payload.

## Setup

1. Start the app locally.
2. Analyze at least two repositories successfully.
3. Prefer a set with visibly different metrics so deltas are easy to inspect.

## Primary Flow

1. Open the `Comparison` tab.
2. Confirm the first successful repo is selected as the default anchor.
3. Confirm comparison sections are visible:
   - `Overview`
   - `Contributors`
   - `Activity`
   - `Responsiveness`
   - `Health Ratios`
4. Confirm raw values remain visible and comparison-focused deltas are emphasized.
5. Change the anchor repo and confirm the comparison updates locally.
6. Toggle one or more sections off and confirm the table updates locally.
7. Toggle one or more attributes off and confirm the table updates locally.
8. Toggle the median column off and back on.
9. Sort each visible comparison column ascending and descending.

## Limit Behavior

1. Attempt to compare more than 4 repositories.
2. Confirm the UI clearly communicates the 4-repo cap.
3. Confirm the extra repos are not included in the comparison view until the selection is reduced.

## Unavailable Data

1. Compare repositories where at least one metric is unavailable for one repo.
2. Confirm the row remains visible.
3. Confirm the unavailable cell renders as `—`.

## Reset Behavior

1. Open `Comparison`.
2. Start a new analysis.
3. Confirm stale comparison state does not persist into the new result set.
