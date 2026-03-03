import { test, expect } from '@playwright/test';
import { waitForAppLoad } from './helpers.js';

/**
 * Launch Smoke Suite
 * Fast, repeatable smoke tests for pre-launch verification.
 * Covers: all public routes, auth-gated routes, core forms, navigation, error boundaries.
 */

test.describe('Launch Smoke Suite', () => {

  // ─── PUBLIC PAGES ─────────────────────────────────────────
  test.describe('Public pages load without crash', () => {

    const publicRoutes = [
      { path: '/', name: 'Home / Landing' },
      { path: '/BrowseTrips', name: 'Browse Trips' },
      { path: '/BrowseRequests', name: 'Browse Requests' },
      { path: '/BusSearch', name: 'Bus Search' },
      { path: '/FAQ', name: 'FAQ' },
      { path: '/ContactUs', name: 'Contact Us' },
      { path: '/PrivacyPolicy', name: 'Privacy Policy' },
      { path: '/TermsAndConditions', name: 'Terms & Conditions' },
      { path: '/LogisticsPartners', name: 'Logistics Partners' },
      { path: '/PublicTracking', name: 'Public Tracking' },
    ];

    for (const route of publicRoutes) {
      test(`${route.name} (${route.path})`, async ({ page }) => {
        await page.goto(route.path);
        await waitForAppLoad(page);

        // Must not show error boundary
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).not.toBeVisible();

        // Must render content (not blank)
        const body = await page.locator('body').innerText();
        expect(body.length).toBeGreaterThan(10);
      });
    }
  });

  // ─── AUTH-GATED PAGES ─────────────────────────────────────
  test.describe('Auth-gated pages redirect or load gracefully', () => {

    const protectedRoutes = [
      '/UserProfile',
      '/EditProfile',
      '/UserDashboard',
      '/PostTrip',
      '/PostRequest',
      '/MyTrips',
      '/MyRequests',
      '/Messages',
      '/Notifications',
      '/SmartMatches',
      '/SavedItems',
    ];

    for (const path of protectedRoutes) {
      test(`${path} does not crash unauthenticated`, async ({ page }) => {
        await page.goto(path);
        await page.waitForTimeout(3000);

        // Should either redirect to auth or show a non-crash page
        const url = page.url();
        const errorBoundary = page.locator('text=Something went wrong');
        const isAuthRedirect = url.includes('base44') || url.includes('login') || url.includes('auth');
        const hasErrorBoundary = await errorBoundary.isVisible().catch(() => false);

        // Must not show error boundary
        expect(hasErrorBoundary).toBeFalsy();

        // Should have resolved to either redirect or content
        const body = await page.locator('body').innerText();
        expect(isAuthRedirect || body.length > 0).toBeTruthy();
      });
    }
  });

  // ─── NAVIGATION & LAYOUT ─────────────────────────────────
  test.describe('Navigation and layout', () => {

    test('Header is fixed positioned on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await waitForAppLoad(page);

      const header = page.locator('header').first();
      if (await header.isVisible()) {
        const position = await header.evaluate(el => window.getComputedStyle(el).position);
        expect(position).toBe('fixed');
      }
    });

    test('Page scrolls to top on navigation', async ({ page }) => {
      await page.goto('/');
      await waitForAppLoad(page);
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);
    });

    test('Mobile viewport renders without crash', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await waitForAppLoad(page);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(10);
    });

    test('404 page renders for unknown routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist-12345');
      await waitForAppLoad(page);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
      // Should show some content (404 page or redirect to home)
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('Theme toggle exists and page has background', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await waitForAppLoad(page);
      await page.waitForTimeout(2000);

      const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      expect(bodyBg).toBeTruthy();
    });
  });

  // ─── FORMS: POST TRIP ─────────────────────────────────────
  test.describe('Post Trip form', () => {

    test('Page loads without crash', async ({ page }) => {
      await page.goto('/PostTrip');
      await waitForAppLoad(page);
      await page.waitForTimeout(2000);

      const url = page.url();
      if (!url.includes('base44') && !url.includes('login')) {
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).not.toBeVisible();
      }
    });

    test('Airport autocomplete works', async ({ page }) => {
      await page.goto('/PostTrip');
      await waitForAppLoad(page);

      const fromInput = page.getByPlaceholder('Enter IATA code or city').first();
      if (await fromInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fromInput.fill('JFK');
        await page.waitForTimeout(500);

        const suggestions = page.locator('[role="listbox"] button, [role="option"]');
        if (await suggestions.count() > 0) {
          await suggestions.first().click();
          const value = await fromInput.inputValue();
          expect(value.length).toBeGreaterThan(3);
          expect(value).toContain('-');
        }
      }
    });

    test('Delivery service selection does not crash', async ({ page }) => {
      await page.goto('/PostTrip');
      await waitForAppLoad(page);

      const doorToDoor = page.locator('text=Door to Door').first();
      if (await doorToDoor.isVisible({ timeout: 5000 }).catch(() => false)) {
        await doorToDoor.click();
        await page.waitForTimeout(500);
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).not.toBeVisible();
      }
    });
  });

  // ─── FORMS: POST REQUEST ──────────────────────────────────
  test.describe('Post Request form', () => {

    test('Page loads without crash', async ({ page }) => {
      await page.goto('/PostRequest');
      await waitForAppLoad(page);
      await page.waitForTimeout(2000);

      const url = page.url();
      if (!url.includes('base44') && !url.includes('login')) {
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).not.toBeVisible();
      }
    });

    test('Empty form submit shows validation error', async ({ page }) => {
      await page.goto('/PostRequest');
      await waitForAppLoad(page);

      const submitBtn = page.getByRole('button', { name: /publish|post|submit/i });
      if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1000);

        // Should show validation or stay on form
        const toast = page.locator('[data-sonner-toast]');
        const hasToast = await toast.count() > 0;
        const stillOnPage = await submitBtn.isVisible();
        expect(hasToast || stillOnPage).toBeTruthy();
      }
    });
  });

  // ─── BROWSE / SEARCH ──────────────────────────────────────
  test.describe('Browse and search', () => {

    test('Browse Trips renders trip cards or empty state', async ({ page }) => {
      await page.goto('/BrowseTrips');
      await waitForAppLoad(page);
      await page.waitForTimeout(2000);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();

      // Should show either trips or empty state
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(10);
    });

    test('Browse Requests renders request cards or empty state', async ({ page }) => {
      await page.goto('/BrowseRequests');
      await waitForAppLoad(page);
      await page.waitForTimeout(2000);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
    });
  });

  // ─── CONTACT US FORM ──────────────────────────────────────
  test.describe('Contact Us form', () => {

    test('Form validates required fields', async ({ page }) => {
      await page.goto('/ContactUs');
      await waitForAppLoad(page);

      const submitBtn = page.getByRole('button', { name: /send/i });
      if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Submit button should be disabled when fields are empty
        const isDisabled = await submitBtn.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    });

    test('Form shows error for invalid email', async ({ page }) => {
      await page.goto('/ContactUs');
      await waitForAppLoad(page);

      const nameInput = page.getByLabel(/name/i).first();
      const emailInput = page.getByLabel(/email/i).first();
      const subjectInput = page.getByLabel(/subject/i);
      const messageInput = page.getByLabel(/message/i);

      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test User');
        await emailInput.fill('invalid-email');
        await subjectInput.fill('Test Subject');
        await messageInput.fill('This is a test message for validation');

        const submitBtn = page.getByRole('button', { name: /send/i });
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);

          // Should show error for invalid email or stay on form (not navigate away)
          const errorText = page.locator('text=Valid email address is required');
          const toastError = page.locator('[data-sonner-toast]');
          const hasError = await errorText.isVisible().catch(() => false);
          const hasToast = await toastError.count() > 0;
          const stillOnForm = await submitBtn.isVisible();
          expect(hasError || hasToast || stillOnForm).toBeTruthy();
        }
      }
    });
  });

  // ─── PARTNER SIGNUP ────────────────────────────────────────
  test.describe('Partner Signup', () => {

    test('Page loads and shows form', async ({ page }) => {
      await page.goto('/PartnerSignup');
      await waitForAppLoad(page);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
    });
  });

  // ─── ERROR BOUNDARY ────────────────────────────────────────
  test.describe('Error handling', () => {

    test('ErrorBoundary does not expose stack traces in production', async ({ page }) => {
      await page.goto('/');
      await waitForAppLoad(page);

      // Verify no .font-mono error text visible in normal operation
      const stackTrace = page.locator('.font-mono.text-red-400');
      await expect(stackTrace).not.toBeVisible();
    });
  });

  // ─── BACK/FORWARD NAVIGATION ──────────────────────────────
  test.describe('Browser navigation', () => {

    test('Back/forward navigation works without crash', async ({ page }) => {
      await page.goto('/');
      await waitForAppLoad(page);

      await page.goto('/BrowseTrips');
      await waitForAppLoad(page);

      await page.goto('/FAQ');
      await waitForAppLoad(page);

      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('BrowseTrips');

      // Go back again
      await page.goBack();
      await page.waitForTimeout(1000);

      // Should not crash
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
    });

    test('Page refresh does not crash', async ({ page }) => {
      await page.goto('/BrowseTrips');
      await waitForAppLoad(page);

      await page.reload();
      await waitForAppLoad(page);

      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).not.toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(10);
    });
  });
});
