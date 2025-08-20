import { test, expect } from '@playwright/test'
import { WorkbenchPage } from '../page-objects'

test.use({ viewport: { width: 1920, height: 1080 } })

test.describe('Motia Basic Tutorial - Workbench', () => {
  let workbench: WorkbenchPage

  test.beforeEach(async ({ page }) => {
    workbench = new WorkbenchPage(page)

    await page.addInitScript(() => {
      localStorage.removeItem('motia-tutorial-skipped')
      let currentFlowStorage: {
        state?: {
          selectedFlowId?: string
        }
      } = {}

      try {
        currentFlowStorage = JSON.parse(localStorage.getItem('motia-flow-storage') ?? '{}')
      } catch {
        console.error('Failed to parse motia-flow-storage')
      }

      localStorage.setItem(
        'motia-flow-storage',
        JSON.stringify({
          ...currentFlowStorage,
          state: {
            ...(currentFlowStorage?.state ?? {}),
            selectedFlowId: 'basic-tutorial',
          },
        }),
      )
    })
  })

  test('should load workbench page with the basic tutorial present', async () => {
    await workbench.open()

    await expect(workbench.body).toBeVisible()
    await expect(workbench.logoIcon.first()).toBeVisible()
    await expect(workbench.tutorialPopover).toBeVisible()
    await expect(workbench.flowsDropdownTrigger).toContainText('basic-tutorial')
  })

  test('tutorial navigation keys should navigate forward and backwards', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()
    await expect(workbench.flowsDropdownTrigger).toContainText('basic-tutorial')

    const initialTitle = await page.locator('.popover-title').innerText()

    const tutorialNextButton = page.locator('.driver-popover-next-btn').first()
    await expect(tutorialNextButton).toBeVisible()

    const tutorialPrevButton = page.locator('.driver-popover-prev-btn').first()
    await expect(tutorialPrevButton).not.toBeVisible()
    await expect(tutorialPrevButton).toBeDisabled()

    await tutorialNextButton.click()
    await expect(tutorialPrevButton).not.toBeDisabled()

    const finalTitle = await page.locator('.popover-title').innerText()
    await expect(finalTitle).not.toEqual(initialTitle)

    await tutorialPrevButton.click()
    await expect(tutorialPrevButton).toBeDisabled()

    const currentTitle = await page.locator('.popover-title').innerText()
    await expect(currentTitle).toEqual(initialTitle)
  })

  test('tutorial can dynamically open the code preview', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()
    await expect(workbench.flowsDropdownTrigger).toContainText('basic-tutorial')

    const tutorialNextButton = page.locator('.driver-popover-next-btn').first()
    await expect(tutorialNextButton).toBeVisible()

    const tutorialPrevButton = page.locator('.driver-popover-prev-btn').first()
    await expect(tutorialPrevButton).not.toBeVisible()

    for (let i = 0; i < 3; i++) {
      await tutorialNextButton.click()
      await page.waitForTimeout(500)
    }

    await expect(page.locator('#app-sidebar-container').first()).toBeVisible()
  })

  test('tutorial should not appear after skipping it', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()

    const tutorialOptOutButton = page.locator('.tutorial-opt-out-button').first()
    await expect(tutorialOptOutButton).toBeVisible()

    await tutorialOptOutButton.click()

    await expect(workbench.tutorialPopover).not.toBeVisible()
  })

  test('tutorial button shoud override the skip tutorial setting', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-skipped', 'true')
    })

    await workbench.open()

    await expect(workbench.tutorialPopover).not.toBeVisible()
    const tutorialButton = page.getByTestId('tutorial-trigger').first()
    await expect(tutorialButton).toBeVisible()
    await tutorialButton.click()
    await expect(workbench.tutorialPopover).toBeVisible()
  })
})
