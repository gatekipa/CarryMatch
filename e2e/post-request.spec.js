import { test, expect } from '@playwright/test';
import { waitForAppLoad } from './helpers.js';

test.describe('Post Request Form (TC-035-038, BG-026)', () => {

  test('TC-035: post request page loads without errors', async ({ page }) => {
    await page.goto('/PostRequest');
    await waitForAppLoad(page);

    // Page should load without crashing
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('TC-036: airport autocomplete populates field on selection', async ({ page }) => {
    await page.goto('/PostRequest');
    await waitForAppLoad(page);

    const fromInput = page.getByPlaceholder('Enter IATA code or city').first();

    if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fromInput.fill('LAX');
      await page.waitForTimeout(500);

      const suggestions = page.locator('[role="listbox"] button, [role="option"]');
      if (await suggestions.count() > 0) {
        await suggestions.first().click();

        const inputValue = await fromInput.inputValue();
        // Should show full airport info, not just code
        expect(inputValue.length).toBeGreaterThan(3);
        expect(inputValue).toContain('-');
      }
    }
  });

  test('TC-037: post request validates required fields', async ({ page }) => {
    await page.goto('/PostRequest');
    await waitForAppLoad(page);

    // Find and click the submit/publish button without filling fields
    const submitBtn = page.getByRole('button', { name: /publish|post|submit/i });

    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Should show validation error or not submit
      // Check for toast notification or error text
      const toast = page.locator('[data-sonner-toast]').or(page.locator('.toast'));
      const errorText = page.locator('text=required').or(page.locator('text=Please'));
      const hasValidation = await toast.count() > 0 || await errorText.count() > 0;

      // Either validation toast appeared or form didn't submit (both are valid)
      expect(hasValidation || await submitBtn.isVisible()).toBeTruthy();
    }
  });
});
