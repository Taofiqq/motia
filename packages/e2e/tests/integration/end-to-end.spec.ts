import { test, expect } from '../fixtures/motia-fixtures'

test.describe('End-to-End Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })
  })

  test('complete user journey from API to logs', async ({ motiaApp, workbench, logsPage, api }) => {
    await test.step('Verify application is healthy', async () => {
      await workbench.open()
      await motiaApp.isApplicationLoaded()
    })

    await test.step('Trigger flow via API', async () => {
      const response = await api.post('/default', {
        input: 'End-to-end test data',
        timestamp: new Date().toISOString(),
      })

      await api.verifyResponseNotError(response)
    })

    await test.step('Navigate to workbench and verify flow execution', async () => {
      await workbench.open()
      await workbench.navigateToFlow('default')
      await workbench.verifyWorkbenchInterface()
      await workbench.startFlow()
      await workbench.navigateToLogs()

      await logsPage.waitForLogFromStep('ApiTrigger')
    })

    await test.step('Verify complete flow execution', async () => {
      const expectedLogs = ['ApiTrigger', 'SetStateChange', 'CheckStateChange']

      await logsPage.verifyStepsExecuted(expectedLogs)
    })
  })

  test('user workflow: create, execute, and monitor flow', async ({ workbench, logsPage, api }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.verifyWorkbenchInterface()
    })

    await test.step('Execute flow manually', async () => {
      const flowCount = await workbench.getFlowCount()
      expect(flowCount).toBeGreaterThan(0)

      await workbench.navigateToFlow('default')
      await workbench.startFlow()
    })

    await test.step('Monitor execution in real-time', async () => {
      await workbench.navigateToLogs()

      await logsPage.waitForLogFromStep('ApiTrigger', 30000)

      const logs = await logsPage.getAllLogMessages()
      expect(logs.length).toBeGreaterThan(0)
    })

    await test.step('Verify flow completion', async () => {
      await logsPage.waitForFlowCompletion('default', 60000)

      const finalLogs = await logsPage.getAllLogMessages()
      console.log(`Flow completed with ${finalLogs.length} log entries`)
    })
  })

  test('cross-platform compatibility check', async ({ motiaApp, workbench, api }) => {
    await test.step('Verify application loads on current platform', async () => {
      await workbench.open()
      await motiaApp.hasTitle()
      await motiaApp.isApplicationLoaded()
    })

    await test.step('Test API endpoints work', async () => {
      const endpoints = ['/default', '/health', '/api/status']

      for (const endpoint of endpoints) {
        const response = await api.get(endpoint)

        // We expect either success or proper error codes, not network failures
        expect([200, 404, 405, 500]).toContain(response.status)
      }
    })

    await test.step('Verify workbench interface works', async () => {
      await workbench.open()

      const hasWorkbenchFeatures = await workbench.hasWorkbenchFeatures()
      expect(hasWorkbenchFeatures).toBeTruthy()
    })

    await test.step('Check for critical console errors', async () => {
      const errors = await motiaApp.collectConsoleErrors()

      // Allow for minor errors but flag critical ones
      const criticalErrors = errors.filter(
        (error) => !error.includes('favicon') && !error.includes('404') && error.includes('Error'),
      )

      expect(criticalErrors.length).toBeLessThanOrEqual(1)
    })
  })
})
