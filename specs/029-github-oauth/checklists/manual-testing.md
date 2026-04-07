# Manual Testing Checklist: GitHub OAuth Authentication (P1-F14)

## Setup

- [ ] Start the dev server (`npm run dev`)
- [ ] Register a GitHub OAuth App at https://github.com/settings/developers with callback URL `http://localhost:3000/api/auth/callback`
- [ ] Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env.local`

---

## Default State (Unauthenticated)

- [ ] Opening the app shows a "Sign in with GitHub" button
- [ ] No PAT input field is visible
- [ ] Submitting analysis without signing in is not possible

---

## Sign In Flow

- [ ] Clicking "Sign in with GitHub" redirects to GitHub's authorization page
- [ ] After authorizing, the app redirects back and shows the signed-in GitHub username
- [ ] The "Sign in with GitHub" button is replaced by the username indicator and sign-out option
- [ ] Analysis requests succeed using the OAuth token (no server token needed)
- [ ] Refreshing the page returns to the unauthenticated state (in-memory only)

---

## Sign Out Flow

- [ ] Clicking "Sign out" clears the session
- [ ] The "Sign in with GitHub" button reappears
- [ ] Analysis requests are no longer possible without signing in again

---

## OAuth Error Handling

- [ ] Denying authorization on GitHub redirects back to the app with an error message
- [ ] The "Sign in with GitHub" button is still available after an error
- [ ] No partial token is stored after an error

---

## Rate Limit Display

- [ ] After analysis, the rate limit shown reflects the authenticated user's own GitHub quota

---

## Signoff

| Item | Status | Notes |
|------|--------|-------|
| All automated tests pass (`npm test`) | | |
| All E2E tests pass (`npx playwright test e2e/auth.spec.ts`) | | |
| Manual checklist reviewed | | |
| Reviewed by | | |
