import { test, expect } from '@playwright/test';

test('debug app loading', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Capture console errors and warnings
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
    if (msg.type() === 'warning') {
      warnings.push(`Console Warning: ${msg.text()}`);
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });

  // Navigate to the app
  await page.goto('/');

  // Wait a bit for React to render
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'e2e/screenshots/home.png', fullPage: true });

  // Log any errors found
  if (errors.length > 0) {
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach(e => console.log(e));
  }

  if (warnings.length > 0) {
    console.log('\n=== WARNINGS FOUND ===');
    warnings.forEach(w => console.log(w));
  }

  // Check if app rendered (look for root content)
  const body = await page.locator('body').innerHTML();
  console.log('\n=== BODY HTML LENGTH ===', body.length);

  // Check if the root div has content
  const root = await page.locator('#root').innerHTML();
  console.log('=== ROOT HTML LENGTH ===', root.length);

  if (root.length < 100) {
    console.log('=== ROOT HTML ===');
    console.log(root);
  }

  // Try to find main elements
  const title = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
  console.log('=== H1 TEXT ===', title);

  // Check for navigation
  const navLinks = await page.locator('nav a').count();
  console.log('=== NAV LINKS COUNT ===', navLinks);

  // Assert basic rendering happened
  expect(root.length).toBeGreaterThan(50);
});

test('test navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Try clicking Search nav
  await page.click('text=Search');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/search.png', fullPage: true });

  // Try clicking Words nav
  await page.click('text=Words');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/vocabulary.png', fullPage: true });

  // Try clicking Review nav
  await page.click('text=Review');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/review.png', fullPage: true });

  // Back to home
  await page.click('text=Home');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/home-final.png', fullPage: true });
});

test('test search functionality', async ({ page }) => {
  await page.goto('/search');

  // Wait for dictionary to load
  await page.waitForTimeout(2000);

  // Find search input
  const searchInput = page.locator('input[type="text"]');
  await expect(searchInput).toBeVisible();

  // Type a search query for "logophile" which is in sample data
  await searchInput.fill('logophile');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'e2e/screenshots/search-results.png', fullPage: true });

  // Check if results appear
  const results = await page.locator('button.card').count();
  console.log('=== SEARCH RESULTS COUNT ===', results);

  // If no results, let's debug
  if (results === 0) {
    console.log('=== No results - checking page content ===');
    const pageContent = await page.locator('main').innerHTML();
    console.log('=== MAIN CONTENT ===', pageContent.substring(0, 500));
  }

  // We should find at least "logophile"
  expect(results).toBeGreaterThanOrEqual(1);
});

test('test save word and review', async ({ page }) => {
  // Go to search
  await page.goto('/search');
  await page.waitForTimeout(2000);

  // Search for logophile
  const searchInput = page.locator('input[type="text"]');
  await searchInput.fill('logophile');
  await page.waitForTimeout(1500);

  // Click on the result to see details
  const firstResult = page.locator('button.card').first();
  if (await firstResult.count() > 0) {
    await firstResult.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/word-details.png', fullPage: true });

    // Find and click save button
    const saveButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await saveButton.click();
    await page.waitForTimeout(500);

    // Go to vocabulary
    await page.click('text=Words');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/vocabulary-with-word.png', fullPage: true });

    // Check if word appears
    const savedWords = await page.locator('.card').count();
    console.log('=== SAVED WORDS COUNT ===', savedWords);

    // Go to review
    await page.click('text=Review');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/review-with-cards.png', fullPage: true });
  }
});
