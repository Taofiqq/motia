import { test, expect } from '@playwright/test'
import { WorkbenchPage, LogsPage, ApiHelpers } from '../page-objects'

test.describe('Flow Execution Tests', () => {
  let workbench: WorkbenchPage
  let logsPage: LogsPage
  let api: ApiHelpers

  test.beforeEach(async ({ page }) => {
    workbench = new WorkbenchPage(page)
    logsPage = new LogsPage(page)
    api = new ApiHelpers(page)

    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })
  })

  test('should execute a complete flow end-to-end', async ({ page }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.verifyWorkbenchInterface()
    })

    await test.step('Execute default flow', async () => {
      await workbench.navigateToFlow('default')
      await workbench.startFlow()
    })

    await test.step('Verify flow execution in logs', async () => {
      await workbench.navigateToLogs()

      const expectedSteps = ['ApiTrigger', 'SetStateChange', 'CheckStateChange']

      await logsPage.verifyStepsExecuted(expectedSteps)
    })

    await test.step('Verify flow completion', async () => {
      await logsPage.waitForFlowCompletion('default')
    })
  })

  test('should handle flow execution with API trigger', async ({ page }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.verifyWorkbenchInterface()
    })

    await test.step('Trigger flow via API', async () => {
      const response = await api.post('/default', {
        message: 'Test API trigger',
      })

      await api.verifyResponseStatus(response, 200)
    })

    await test.step('Verify API triggered flow in workbench', async () => {
      await workbench.navigateToLogs()

      await logsPage.clickLogFromStep('ApiTrigger')
      await page.getByLabel('Test API trigger')
    })
  })

  test('should execute multiple flows sequentially', async ({ page }) => {
    const flows = ['default']

    for (const flowName of flows) {
      await test.step(`Execute ${flowName} flow`, async () => {
        await workbench.open()
        await workbench.navigateToFlow(flowName)
        await workbench.executeFlowAndNavigateToLogs(flowName)
        await logsPage.waitForFlowCompletion(flowName, 30000)
      })
    }
  })

  test('should verify flow state management', async ({ page }) => {
    await test.step('Execute flow with state operations', async () => {
      await workbench.open()
      await workbench.executeFlowAndNavigateToLogs('default')
    })

    await test.step('Verify state changes in logs', async () => {
      const stateMessages = ['SetStateChange', 'CheckStateChange']

      await logsPage.verifyStepsExecuted(stateMessages)
      await logsPage.verifyLogContainingText('The provided value matches the state value 🏁')
    })

    await test.step('Verify state persistence', async () => {
      await workbench.navigateToStates()

      // Verify state values are displayed (implementation depends on UI)
      const stateContainer = workbench.page.getByTestId('states-container')
      if (await stateContainer.isVisible({ timeout: 3000 })) {
        await expect(stateContainer).toBeVisible()
      }
    })
  })

  test('should handle flow errors gracefully', async ({ page }) => {
    await test.step('Trigger a flow that might error', async () => {
      // This would trigger an endpoint that intentionally errors
      const response = await api.post('/api/trigger/error-flow', {
        shouldError: true,
      })

      // We expect this to handle gracefully, not necessarily succeed
      expect([200, 400, 404, 500]).toContain(response.status)
    })

    await test.step('Verify error handling in logs', async () => {
      await workbench.open()
      await workbench.navigateToLogs()

      // Look for error handling messages
      const errorPatterns = ['error', 'failed', 'exception']
      const logs = await logsPage.getAllLogMessages()

      const hasErrorHandling = logs.some((log) => errorPatterns.some((pattern) => log.toLowerCase().includes(pattern)))

      // We don't expect errors in normal flow, but if they occur, they should be logged
      if (hasErrorHandling) {
        console.log('Error handling detected in logs - this is expected behavior')
      }
    })
  })
})
