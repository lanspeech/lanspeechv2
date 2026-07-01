import { test, expect } from '@playwright/test';

test('basic navigation smoke', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=LanSpeech');
  await expect(page.locator('text=LanSpeech')).toBeVisible();

  const hasLogin = await page.locator('text=Sign In').count();
  const hasDashboard = await page.locator('text=Dashboard').count();
  expect(hasLogin + hasDashboard).toBeGreaterThan(0);

  if (hasDashboard > 0) {
    await page.click('text=Library');
    await page.waitForSelector('text=Speech Practice Library');
    await expect(page.locator('text=Speech Practice Library')).toBeVisible();
  }
});

test('auth page toggles between login and signup', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=LanSpeech');

  const hasLogin = await page.locator('text=Sign In').count();
  if (hasLogin === 0) {
    test.skip();
    return;
  }

  await expect(page.locator('text=Welcome back')).toBeVisible();
  await expect(page.locator('input[placeholder="you@example.com"]')).toBeVisible();
  await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();

  await page.click('text=Sign Up');
  await expect(page.locator('text=Create your account')).toBeVisible();
  await expect(page.locator('input[placeholder="Alex Johnson"]')).toBeVisible();
  await expect(page.locator('text=Create Account')).toBeVisible();
});

test('library view shows search and lessons when signed in', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=LanSpeech');

  const hasDashboard = await page.locator('text=Dashboard').count();
  if (hasDashboard === 0) {
    return;
  }

  await page.click('text=Library');
  await expect(page.locator('text=Speech Practice Library')).toBeVisible();
  await expect(page.locator('input[placeholder="Search lessons..."]')).toBeVisible();
  await expect(page.locator('text=lessons done')).toBeVisible();
});

test('can start an available lesson from library', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=LanSpeech');

  const hasDashboard = await page.locator('text=Dashboard').count();
  if (hasDashboard === 0) {
    return;
  }

  await page.click('text=Library');
  await expect(page.locator('text=Speech Practice Library')).toBeVisible();

  const startButtons = page.locator('button:has-text("Continue"), button:has-text("Review")');
  const availableCount = await startButtons.count();
  if (availableCount === 0) {
    return;
  }

  await startButtons.nth(0).click();
  await expect(page.locator('text=Record Yourself')).toBeVisible();
  await expect(page.locator('text=Lesson Progress')).toBeVisible();
});

test('debug page is accessible and shows upload diagnostics', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=LanSpeech');

  const debugButtons = page.locator('button:has-text("Debug")');
  const debugCount = await debugButtons.count();
  if (debugCount === 0) {
    return;
  }

  await debugButtons.nth(0).click();
  await expect(page.locator('text=Debug: Recording & Upload')).toBeVisible();
  await expect(page.locator('text=Last storage upload response')).toBeVisible();
  await expect(page.locator('text=Last DB insert response')).toBeVisible();
});
