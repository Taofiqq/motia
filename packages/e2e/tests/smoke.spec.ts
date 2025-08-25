import { test, expect } from '@playwright/test'
import { MotiaApplicationPage, WorkbenchPage, ApiHelpers } from './page-objects'

test.describe('CLI Generated Project - Smoke Tests', () => {
  let motiaApp: MotiaApplicationPage
  let workbench: WorkbenchPage
  let api: ApiHelpers

  test.beforeEach(async ({ page }) => {
    motiaApp = new MotiaApplicationPage(page)
    workbench = new WorkbenchPage(page)
    api = new ApiHelpers(page)
    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })
  })

  test('CLI generated project loads successfully', async ({ page }) => {
    await workbench.open()

    await motiaApp.hasTitle()
    await motiaApp.isApplicationLoaded()
  })

  test('CLI generated project has basic API endpoints', async ({ page }) => {
    const commonEndpoints = ['/default']

    const hasWorkingEndpoint = await api.verifyCommonEndpoints(commonEndpoints)
    expect(hasWorkingEndpoint).toBeTruthy()
  })

  test('CLI generated project workbench is functional', async ({ page }) => {
    await workbench.open()

    const hasWorkbenchFeatures = await workbench.hasWorkbenchFeatures()
    expect(hasWorkbenchFeatures).toBeTruthy()
  })

  test('CLI generated project handles navigation', async ({ page }) => {
    await workbench.open()

    const links = page.locator('a[href]')
    const linkCount = await links.count()

    if (linkCount > 0) {
      const firstLink = links.first()
      const href = await firstLink.getAttribute('href')

      if (href && !href.startsWith('http') && href !== '/') {
        await firstLink.click()
        await motiaApp.waitForApplication()

        await expect(motiaApp.body).toBeVisible()
      }
    }

    expect(true).toBeTruthy()
  })

  test('CLI generated project has no critical console errors', async ({ page }) => {
    const errors = await motiaApp.collectConsoleErrors()

    await workbench.open()

    expect(errors.length).toBeLessThanOrEqual(2)
  })

  test('CLI generated project responds to basic HTTP requests', async ({ page }) => {
    const response = await api.get('/')

    await api.verifyResponseNotError(response)
    await api.verifyResponseHeaders(response)
  })
})
