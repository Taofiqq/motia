import { test, expect } from '@playwright/test'
import { WorkbenchPage, LogsPage } from '../page-objects'

test.use({ viewport: { width: 1920, height: 1080 } })

test.describe('CLI Generated Project - Workbench Navigation', () => {
  let workbench: WorkbenchPage
  let logsPage: LogsPage

  test.beforeEach(async ({ page }) => {
    workbench = new WorkbenchPage(page)
    logsPage = new LogsPage(page)

    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })
  })

  test('should load workbench page of CLI generated project', async () => {
    await workbench.open()

    await expect(workbench.body).toBeVisible()
    await expect(workbench.logoIcon.first()).toBeVisible()
  })

  test('should display workbench interface elements', async () => {
    await workbench.open()

    await workbench.verifyWorkbenchInterface()
  })

  test('should show created steps in the workbench', async () => {
    await workbench.open()

    const expectedSteps = ['api-trigger', 'process-data', 'send-notification', 'basic-tutorial']
    await workbench.verifyStepsInWorkbench(expectedSteps)
  })

  test('should navigate through workbench sections', async () => {
    await workbench.open()

    await test.step('Navigate to Logs section', async () => {
      await workbench.navigateToLogs()
      await expect(workbench.body).toBeVisible()
    })

    await test.step('Navigate to States section', async () => {
      await workbench.navigateToStates()
      await expect(workbench.body).toBeVisible()
    })

    await test.step('Navigate to Endpoints section', async () => {
      await workbench.navigateToEndpoints()
      await expect(workbench.body).toBeVisible()
    })
  })

  test('should navigate through flow sections in sidebar', async () => {
    await workbench.open()

    const flowCount = await workbench.getFlowCount()

    if (flowCount > 0) {
      const maxFlowsToTest = Math.min(flowCount, 3)

      for (let i = 0; i < maxFlowsToTest; i++) {
        await test.step(`Navigate to flow ${i + 1}`, async () => {
          await workbench.navigateToFlowByIndex(i)
          await expect(workbench.body).toBeVisible()
        })
      }
    } else {
      console.log('No flows found in sidebar - this is expected for new projects')
    }
  })

  test('should display project information correctly', async () => {
    await workbench.open()

    const hasProjectInfo = await workbench.verifyProjectInformation()
    expect(hasProjectInfo).toBeTruthy()
  })

  test('should handle CLI project structure validation', async () => {
    await workbench.open()

    const healthEndpoint = workbench.page.getByText(/health|status/)
    const stepsSection = workbench.page.getByText(/steps|workflows/)

    const hasHealthInfo = await healthEndpoint.first().isVisible({ timeout: 3000 })
    const hasStepsInfo = await stepsSection.first().isVisible({ timeout: 3000 })

    expect(hasHealthInfo || hasStepsInfo).toBeTruthy()
  })

  test('should execute default flow and verify logs', async () => {
    await workbench.open()

    await test.step('Execute default flow', async () => {
      await workbench.executeFlowAndNavigateToLogs('default')
    })

    const stepsExecuted = ['ApiTrigger', 'SetStateChange', 'CheckStateChange']

    await test.step('Verify all expected logs are present', async () => {
      await logsPage.verifyStepsExecuted(stepsExecuted)
      console.log('✓ Found all expected logs')
    })

    await test.step('Verify state validation message is present', async () => {
      const stateValidationMessage = 'The provided value matches the state value 🏁'
      await logsPage.verifyLogContainingText(stateValidationMessage)
      console.log(`✓ Found state validation message: ${stateValidationMessage}`)
    })

    console.log('✅ Successfully executed default flow and verified all expected logs')
  })
})
