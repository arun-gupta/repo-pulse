# Manual testing — Solo-project profile (#214)

## Setup

Dev server on `http://localhost:3010`. Sign in with GitHub (or
`DEV_GITHUB_PAT`).

## Test matrix

- [ ] **Known solo repo** — analyze a single-maintainer repo (e.g.
      `arun-gupta/kubernetes-java-sample` or any personal project). Verify:
  - [ ] Amber banner renders above the OSS Health Score with text "Solo-maintained project. Scoring emphasizes Activity, Security, and Documentation. Contributors and Responsiveness are hidden."
  - [ ] "Use community scoring" button appears next to the banner.
  - [ ] Scorecard cells show only Activity, Documentation, Security — no Contributors or Responsiveness cells.
  - [ ] Hovering the OSS Health Score tile shows the solo-scoring tooltip ("…composite health score from Activity (30%), Security (35%), and Documentation (35%). Contributors and Responsiveness are hidden…").
  - [ ] Recommendations list contains no Contributors or Responsiveness entries.

- [ ] **Known community repo** — analyze `facebook/react` or similar. Verify:
  - [ ] No banner is rendered.
  - [ ] All five score cells render (Activity, Responsiveness, Contributors, Documentation, Security).
  - [ ] OSS Health Score tooltip is the community wording (Contributors 23%, Activity 25%, etc.).

- [ ] **Override toggle: solo → community** — on a solo-classified repo, click "Use community scoring":
  - [ ] Banner switches to sky/blue: "Community scoring override active. This project was auto-classified as solo-maintained; you've opted into the community surface for this session."
  - [ ] All five score cells become visible.
  - [ ] OSS Health Score recomputes using community weights (tooltip flips back to community wording).
  - [ ] Button label is now "Use solo scoring".

- [ ] **Override toggle: solo (opt-in) on community repo** — on a community repo, there is no toggle (expected: auto-classification rules — toggle only surfaces for auto-solo repos or when already overridden). Verify the banner / toggle do not appear for clearly-community repos.

- [ ] **Session persistence** — toggle override on a solo repo, then:
  - [ ] Scroll / navigate tabs — override state persists.
  - [ ] Reload the page — override resets (session-scoped, not persisted).

- [ ] **Org inventory / comparison** — the banner is a per-scorecard feature on the metric cards view. Ensure other surfaces (comparison view, export) still render without error for solo repos.

## Signoff

- Verified by: arun-gupta
- Date: 2026-04-15
