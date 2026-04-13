# Manual Testing Checklist: Security Scoring

**Feature Branch**: `130-security-scoring`
**Tester**: ___
**Date**: ___

## Prerequisites

- [ ] Application builds without errors
- [ ] All automated tests pass

## US1: Security Posture Overview via OpenSSF Scorecard

- [ ] Analyze a repo in the Scorecard dataset — Security section displays overall Scorecard score and individual check results with scores (0-10)
- [ ] Scorecard checks displayed include: Security-Policy, Code-Review, Maintained, Pinned-Dependencies, Signed-Releases, Fuzzing, SAST, Dangerous-Workflow, Token-Permissions
- [ ] Mode indicator shows "Scorecard + direct checks" when Scorecard data is available
- [ ] Analyze a repo NOT in the Scorecard dataset — Security section indicates Scorecard data unavailable, shows direct checks only

## US2: Direct Security Checks

- [ ] Analyze a repo with `.github/dependabot.yml` — Security section reports dependency automation enabled
- [ ] Analyze a repo with Renovate config — Security section reports dependency automation enabled
- [ ] Analyze a repo with `SECURITY.md` — Security section reports security policy present
- [ ] Analyze a repo with `.github/workflows/` files — Security section reports CI/CD pipelines present
- [ ] Analyze a repo with none of these signals — all direct checks show "not detected" with actionable recommendations
- [ ] Direct checks displayed alongside Scorecard results when both available
- [ ] Mode indicator shows "direct checks only" when Scorecard unavailable

## US3: Branch Protection Fallback

- [ ] Analyze a repo where Scorecard Branch-Protection score is valid (0-10) — Scorecard score used
- [ ] Analyze a repo where Scorecard Branch-Protection is -1 — system falls back to direct GraphQL query, displays result
- [ ] Analyze a repo not in Scorecard dataset — branch protection queried directly
- [ ] Branch protection query fails due to permissions — signal marked "unavailable"

## Health Score Integration

- [ ] Health score includes Security bucket in breakdown
- [ ] Bucket weights are: Activity 25%, Responsiveness 25%, Sustainability 23%, Documentation 12%, Security 15%
- [ ] Security tab is visible in results shell
- [ ] Repos with strong security practices score higher in overall health score
- [ ] Security recommendations appear in health score recommendations list

## Edge Cases

- [ ] Scorecard API timeout/error — treated as unavailable, direct checks still work
- [ ] Scorecard checks scoring 0 — displayed as-is, not hidden
- [ ] Repo with both Scorecard Security-Policy and direct SECURITY.md detection — both displayed, no double-counting in score
- [ ] Multiple repos analyzed — each shows independent security data
- [ ] Unavailable signals not penalized in score computation

## Sign-off

- [ ] All items above verified
- **Signed off by**: ___
- **Date**: ___
