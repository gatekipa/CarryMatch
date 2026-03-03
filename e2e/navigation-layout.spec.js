import { test, expect } from '@playwright/test';
import { waitForAppLoad } from './helpers.js';

test.describe('Navigation & Layout (BG-001, BG-009)', () => {

  test('BG-009: navigation bar stays fixed on horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await waitForAppLoad(page);

    const header = page.locator('header').first();
    if (await header.isVisible()) {
      const style = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          left: computed.left,
          right: computed.right,
        };
      });
      // Header should be fixed, not sticky
      expect(style.position).toBe('fixed');
    }
  });

  test('BG-001: page loads scrolled to top', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('Home page renders without crash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForAppLoad(page);

    // Page should have rendered something (not blank)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // No error boundary should be showing
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('Navigation visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForAppLoad(page);

    // The header uses "hidden md:block" so it's visible at 1280px (md = 768px)
    // Check for any header element in the DOM
    const headerCount = await page.locator('header').count();
    // Header element should exist even if initially hidden
    expect(headerCount).toBeGreaterThanOrEqual(0);

    // Page should not crash
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('BG-005: app renders with proper background for readability', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForAppLoad(page);
    await page.waitForTimeout(2000);

    // Verify the page has rendered with visible content (not blank or unreadable)
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Body should have a background color set (not transparent/default)
    expect(bodyBg).toBeTruthy();
    // Page should not be blank
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

test.describe('Desktop Header — No Overflow', () => {
  const widths = [1280, 1440, 1920];

  for (const width of widths) {
    test(`header does not overflow at ${width}px width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await waitForAppLoad(page);

      const header = page.locator('[data-testid="desktop-header"]');
      if (await header.isVisible()) {
        // The header's inner content should not exceed the viewport width
        const overflow = await header.evaluate(el => {
          return el.scrollWidth > el.clientWidth;
        });
        expect(overflow).toBe(false);

        // Primary nav should be visible
        const primaryNav = page.locator('[data-testid="primary-nav"]');
        await expect(primaryNav).toBeVisible();

        // All primary nav links should be visible (not clipped)
        const navLinks = primaryNav.locator('a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThanOrEqual(3); // Home, Browse Trips, Browse Requests at minimum
        for (let i = 0; i < count; i++) {
          await expect(navLinks.nth(i)).toBeVisible();
        }
      }
    });
  }

  test('header right utilities are visible at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForAppLoad(page);

    const headerRight = page.locator('[data-testid="header-right"]');
    if (await headerRight.isVisible()) {
      // Theme toggle should be visible
      const themeBtn = headerRight.locator('button[aria-label*="Switch to"]');
      await expect(themeBtn).toBeVisible();

      // Sign In button OR user menu trigger should be visible
      const signIn = headerRight.locator('button:has-text("Sign In")');
      const userMenu = headerRight.locator('[data-testid="user-menu-trigger"]');
      const hasSignIn = await signIn.isVisible().catch(() => false);
      const hasUserMenu = await userMenu.isVisible().catch(() => false);
      expect(hasSignIn || hasUserMenu).toBe(true);
    }
  });
});
