import { expect, test } from '@playwright/test'

test.describe('P1-F08 Activity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/repositories')
  })

  test('opens Activity and switches recent activity windows locally', async ({ page }) => {
    await page.getByRole('tab', { name: 'Activity' }).click()
    const activityView = page.getByRole('region', { name: /activity view/i })
    await expect(activityView).toContainText('Development cadence')
    await expect(activityView).toContainText('Month over month')
    await expect(activityView).toContainText('Weekend Flow')

    await page.getByRole('button', { name: '30d' }).click()
    await expect(activityView).toContainText('60%')
    await expect(activityView).toContainText('33% weekend')
    await expect(activityView).toContainText('Last 30 days')

    await activityView.getByRole('button', { name: 'Week', exact: true }).click()
    await expect(activityView).toContainText('Week over week')
    await expect(activityView).toContainText('Last 7 days')
    await expect(activityView).toContainText('Days 8-14 ago')

    await page.getByRole('button', { name: '12 months' }).click()
    await expect(activityView).toContainText('Development cadence')
    await expect(activityView).toContainText('Month')
  })
})
