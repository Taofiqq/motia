import { test, expect } from '@playwright/test'
import { WorkbenchPage, EndpointPage } from '../page-objects' // Assuming WorkbenchPage is in this location

test.describe('Workbench - Endpoint Call JSON Validation', () => {
  let workbench: WorkbenchPage
  let endpoint: EndpointPage

  test.beforeEach(async ({ page }) => {
    workbench = new WorkbenchPage(page)
    endpoint = new EndpointPage(page)

    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })

    await workbench.open()
    await workbench.navigateToEndpoints()
    await endpoint.firstEndpointItem.click()
    await endpoint.callTab.click()
  })

  test('should validate JSON body input', async () => {
    await test.step('Initial state: Play button should be enabled with default/valid JSON', async () => {
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Enter invalid JSON', async () => {
      await endpoint.setValueInBodyEditor('{"invalid_json": "test",')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Enter valid JSON after invalid', async () => {
      await endpoint.setValueInBodyEditor('{"message": "test"}')
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Enter invalid JSON again to ensure re-validation', async () => {
      await endpoint.setValueInBodyEditor('{"another_invalid":')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Clear input with valid JSON', async () => {
      await endpoint.setValueInBodyEditor('{"message": "test"}')
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Clear input with empty string', async () => {
      await endpoint.setValueInBodyEditor('')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Play button should be disabled when invalid JSON is present', async () => {
      await endpoint.setValueInBodyEditor('{"invalid_json": "test",')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Play button should be enabled when valid JSON is present', async () => {
      await endpoint.setValueInBodyEditor('{"message": "test"}')
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Play button should play the request', async () => {
      await endpoint.setValueInBodyEditor('{"message": "test"}')
      await expect(endpoint.playButton).toBeEnabled()
      await endpoint.playButton.click()
      await expect(endpoint.responseContainer).toBeVisible()
    })
  })
})
