/**
 * Shared helpers for CarryMatch e2e tests
 */

/**
 * Wait for the app to fully load (past any loading spinners)
 */
export async function waitForAppLoad(page) {
  // Wait for the main content to appear (either the home page or auth redirect)
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

/**
 * Navigate to a specific page in the app
 */
export async function navigateToPage(page, pageName) {
  await page.goto(`/${pageName}`, { waitUntil: 'domcontentloaded' });
  await waitForAppLoad(page);
}

/**
 * Check if the user is on the auth redirect (base44 login page)
 */
export async function isOnAuthPage(page) {
  const url = page.url();
  return url.includes('base44.com') || url.includes('auth') || url.includes('login');
}

/**
 * Fill an input field by label text or placeholder
 */
export async function fillInput(page, labelOrPlaceholder, value) {
  const input = page.getByLabel(labelOrPlaceholder).or(
    page.getByPlaceholder(labelOrPlaceholder)
  );
  await input.fill(value);
}
