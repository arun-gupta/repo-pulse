# Manual Testing Checklist: Security Scoring

**Feature Branch**: `130-security-scoring`
**Tester**: arun-gupta
**Date**: 2026-04-13

## Prerequisites

- [x] Application builds without errors
- [x] All automated tests pass

## US1: Security Posture Overview via OpenSSF Scorecard

- [x] Analyze a repo in the Scorecard dataset — Security section displays overall Scorecard score and individual check results with scores (0-10)
- [x] Scorecard checks displayed include: Security-Policy, Code-Review, Maintained, Pinned-Dependencies, Signed-Releases, Fuzzing, SAST, Dangerous-Workflow, Token-Permissions
- [x] Mode indicator shows "Scorecard + direct checks" when Scorecard data is available
- [x] Analyze a repo NOT in the Scorecard dataset — Security section indicates Scorecard data unavailable, shows direct checks only

## US2: Direct Security Checks

- [x] Analyze a repo with `.github/dependabot.yml` — Security section reports dependency automation enabled (`facebook/react`)
- [x] Analyze a repo with Renovate config — Security section reports dependency automation enabled (`renovatebot/renovate`)
- [x] Analyze a repo with `SECURITY.md` — Security section reports security policy present (`renovatebot/renovate`)
- [x] Analyze a repo with `.github/workflows/` files — Security section reports CI/CD pipelines present (`renovatebot/renovate`)
- [x] Analyze a repo with none of these direct signals — Security tab shows "not detected" for the direct checks, and Recommendations tab includes actionable security recommendations (`octocat/hello-world`)
- [x] Direct checks displayed alongside Scorecard results when both available (`renovatebot/renovate`)
- [x] Mode indicator shows "direct checks only" when Scorecard unavailable (`octocat/hello-world`)

## US3: Branch Protection Fallback

- [x] Analyze a repo where Scorecard provides a Branch Protection score — the Scorecard value is shown (`renovatebot/renovate`)
- [x] Analyze a repo not in the Scorecard dataset — branch protection is queried directly, and the UI shows either the resolved status or an unavailable state when GitHub permissions prevent access (`arun-gupta/repo-pulse`)
- [x] Analyze a repo where direct branch protection access is unavailable — the UI shows `Requires admin access to the repository` (`octocat/hello-world`)

## Health Score Integration

- [x] Health score includes Security bucket in breakdown
- [x] Bucket weights are: Activity 25%, Responsiveness 25%, Sustainability 23%, Documentation 12%, Security 15%
- [x] Security tab is visible in results shell
- [x] Repos with strong security practices score higher in overall health score
- [x] Security recommendations appear in health score recommendations list

## Edge Cases

- [x] Scorecard checks scoring 0 — displayed as-is, not hidden (`facebook/react`, `renovatebot/renovate`)
- [x] Repo with both Scorecard Security-Policy and direct SECURITY.md detection — both displayed, no double-counting in score (`facebook/react`, `renovatebot/renovate`)
- [x] Multiple repos analyzed — each shows independent security data (`facebook/react`, `renovatebot/renovate`, `octocat/hello-world`)
- [x] Analyze a repo where one or more direct signals are unavailable — verify the security score reflects only the available signals and does not treat unavailable as a failed check (`arun-gupta/repo-pulse`)

## Sign-off

- [x] All items above verified
- **Signed off by**: arun-gupta
- **Date**: 2026-04-13
