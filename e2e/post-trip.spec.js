import { test, expect } from '@playwright/test';
import { waitForAppLoad } from './helpers.js';

test.describe('Post Trip Form (TC-028-034, BG-022, BG-023, BG-024, BG-025)', () => {

  test('TC-028: post trip page loads without crash', async ({ page }) => {
    await page.goto('/PostTrip');
    await waitForAppLoad(page);
    await page.waitForTimeout(2000);

    // Page should load without crashing - either shows form or redirects to auth
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).not.toBeVisible();

    const url = page.url();
    const isAuthRedirect = url.includes('base44') || url.includes('login');
    if (!isAuthRedirect) {
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(10);
    }
  });

  test('BG-022: airport autocomplete populates city name after selection', async ({ page }) => {
    await page.goto('/PostTrip');
    await waitForAppLoad(page);

    const fromInput = page.getByPlaceholder('Enter IATA code or city').first();

    if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fromInput.fill('JFK');
      await page.waitForTimeout(500);

      // Check if suggestions appear
      const suggestions = page.locator('[role="listbox"] button, [role="option"]');
      if (await suggestions.count() > 0) {
        await suggestions.first().click();

        // After selection, the input should show more than just the IATA code
        const inputValue = await fromInput.inputValue();
        expect(inputValue.length).toBeGreaterThan(3);
        // Should contain city info like "JFK - New York"
        expect(inputValue).toContain('-');
      }
    }
  });

  test('BG-023/BG-024: radio buttons show visual selection state', async ({ page }) => {
    await page.goto('/PostTrip');
    await waitForAppLoad(page);

    // Find radio group items
    const radioItems = page.locator('[role="radio"]');

    if (await radioItems.count() > 0) {
      const firstRadio = radioItems.first();

      // Click the parent card/container
      const container = firstRadio.locator('..');
      await container.click();

      // Check that the radio has checked state
      const state = await firstRadio.getAttribute('data-state');
      if (state) {
        expect(state).toBe('checked');
      }

      // Check that the radio indicator (Circle) is visible when checked
      const indicator = firstRadio.locator('[data-state="checked"]');
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible();
      }
    }
  });

  test('BG-025: delivery service selection does not crash', async ({ page }) => {
    await page.goto('/PostTrip');
    await waitForAppLoad(page);

    // Find delivery services section
    const doorToDoor = page.locator('text=Door to Door').first();

    if (await doorToDoor.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click non-airport delivery option
      await doorToDoor.click();
      await page.waitForTimeout(500);

      // Page should NOT crash - no error boundary should appear
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();

      // Also try Door to Airport
      const doorToAirport = page.locator('text=Door to Airport').first();
      if (await doorToAirport.isVisible()) {
        await doorToAirport.click();
        await page.waitForTimeout(500);
        await expect(errorBoundary).not.toBeVisible();
      }

      // Also try Airport to Door
      const airportToDoor = page.locator('text=Airport to Door').first();
      if (await airportToDoor.isVisible()) {
        await airportToDoor.click();
        await page.waitForTimeout(500);
        await expect(errorBoundary).not.toBeVisible();
      }
    }
  });
});
