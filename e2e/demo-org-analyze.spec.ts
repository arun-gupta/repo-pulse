import { test, expect } from '@playwright/test'

// Issue #367 — clicking "Analyze selected (N)" / "Analyze all (N)" in
// /demo/organization must open the DemoSignInDialog instead of silently no-op'ing.
// Lightweight DOM assertions only — no visual snapshots.

test.describe('Demo org analyze sign-in dialog (#367)', () => {
  test('clicking "Analyze selected" opens the sign-in dialog with count in heading', async ({ page }) => {
    await page.goto('/demo/organization')

    // Select at least one row by clicking the first checkbox in the table.
    const firstCheckbox = page.locator('table input[type="checkbox"]').first()
    await firstCheckbox.waitFor({ state: 'visible' })
    await firstCheckbox.check()

    // The "Analyze selected" button should now be enabled.
    const analyzeSelected = page.getByRole('button', { name: /analyze selected/i })
    await expect(analyzeSelected).toBeEnabled()
    await analyzeSelected.click()

    // Dialog must be visible with the correct heading.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading')).toContainText(/sign in with github to analyze/i)

    // Primary CTA must link to sign-in root.
    const cta = dialog.getByRole('link', { name: /sign in with github/i })
    await expect(cta).toHaveAttribute('href', '/')

    // "Stay in demo" dismisses the dialog.
    await dialog.getByRole('button', { name: /stay in demo/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})
