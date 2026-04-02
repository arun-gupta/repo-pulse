# Quickstart: Activity

## Goal

Verify that the app now exposes a real `Activity` tab with local recent-activity window switching, explicit activity metrics, and a real score/help surface that does not trigger additional analysis requests.

## Scenarios

### 1. Open the Activity tab after analysis

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Submit one or more repositories
4. Open the `Activity` tab
5. Confirm:
   - `Activity` appears as a top-level tab label
   - one activity section appears per successful repository
   - primary activity values are visible without tooltip interaction

### 2. Change the recent-activity window locally

1. With successful results visible, open the `Activity` tab
2. Switch between `30d`, `60d`, `90d`, `180d`, and `12 months`
3. Confirm:
   - the selected preset changes visually
   - rendered activity metrics update for the selected window
   - no additional analysis request or API call is triggered

### 3. Inspect score help and derived metrics

1. In the `Activity` tab, inspect the Activity/Evolution score area
2. Open the "how is this scored?" help surface
3. Confirm:
   - thresholds and weighted factors are explained clearly
   - derived metrics can be explained without hiding the primary values
   - unavailable derived values remain explicit rather than guessed

### 4. Verify unavailable-data behavior

1. Use a repository or mocked response with partial activity data
2. Open the `Activity` tab
3. Confirm:
   - unavailable metrics render explicitly
   - the score becomes `Insufficient verified public data` when required inputs are incomplete
   - missing inputs are called out clearly per repository
