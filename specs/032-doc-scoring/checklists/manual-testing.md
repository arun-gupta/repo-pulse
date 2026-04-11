# Manual Testing Checklist: Documentation Scoring

**Feature**: P2-F01 Documentation Scoring
**Branch**: `032-doc-scoring`
**Date**: 2026-04-10
**Tester**: 

## Scorecard Integration

- [ ] Documentation score badge appears on the scorecard for each analyzed repo
- [ ] Health score tooltip shows "Activity (30%), Responsiveness (30%), Sustainability (25%), and Documentation (15%)"
- [ ] Recommendation count shown on scorecard with clickable link to Recommendations tab
- [ ] Clicking "see Recommendations tab" switches to Recommendations tab

## Documentation Tab

- [ ] Documentation tab visible in the results workspace tab bar
- [ ] Score badge shows ordinal percentile (e.g., "72nd percentile")
- [ ] File presence checklist shows all 6 files with check/cross icons
- [ ] Present files show the detected path (e.g., "README.md")
- [ ] License file shows SPDX type when detected (e.g., "MIT")
- [ ] Missing files show amber recommendation text
- [ ] README sections panel shows all 5 sections with check/cross icons
- [ ] Missing README sections show amber recommendation text
- [ ] Summary shows "N of 6 files present · N of 5 README sections detected"

## Recommendations Tab

- [ ] Recommendations tab visible in the results workspace tab bar
- [ ] Recommendations grouped by bucket with color-coded labels (Activity, Responsiveness, Sustainability, Documentation)
- [ ] Documentation recommendations appear alongside other bucket recommendations
- [ ] Each recommendation shows actionable text
- [ ] Summary shows "N recommendations across N dimensions"
- [ ] Repo with no recommendations shows "No recommendations" message

## Comparison View

- [ ] Documentation section appears in comparison table
- [ ] Documentation score shown as percentile
- [ ] Files found shown as "N / 6"
- [ ] README sections shown as "N / 5"
- [ ] Repos with unavailable documentation show "—"

## Exports

- [ ] JSON export includes documentation score, filesFound, readmeSections
- [ ] Markdown export includes Documentation row in score table

## Scoring Methodology Page (/baseline)

- [ ] OSS Health Score section shows 4 buckets: Activity 30%, Responsiveness 30%, Sustainability 25%, Documentation 15%
- [ ] Documentation Scoring section shows file weights and README section weights
- [ ] Documentation row in calibration metrics table shows "Calibration data pending"

## Edge Cases

- [ ] Repo with all 6 files + all 5 README sections → high score, no recommendations
- [ ] Repo with no documentation files → low score, 11 recommendations (6 files + 5 sections)
- [ ] Repo with empty README → README file marked present, all sections marked missing
- [ ] Repo with README.rst or README.txt → file detected correctly
- [ ] Repo with COPYING instead of LICENSE → file detected correctly

## Signoff

- **Tested by**: 
- **Date**: 
- **Result**: 
