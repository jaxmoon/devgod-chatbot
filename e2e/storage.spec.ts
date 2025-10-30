import { test, expect } from '@playwright/test';

test.describe('Chat Storage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should persist messages after page reload', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    // Send a message
    await input.fill('저장 테스트');
    await sendButton.click();

    // Wait for user message to appear
    await expect(page.locator('text=저장 테스트').first()).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();

    // Message should still be visible
    await expect(page.locator('text=저장 테스트').first()).toBeVisible({ timeout: 5000 });
  });

  test('should save chat data to localStorage', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    await input.fill('localStorage 테스트');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Check localStorage
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('devgod_chat_storage');
    });

    expect(storageData).not.toBeNull();

    const parsed = JSON.parse(storageData!);
    expect(parsed.sessions).toBeDefined();
    expect(parsed.sessions.length).toBeGreaterThan(0);
  });

  test('should update session title with first message', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    await input.fill('TypeScript란 무엇인가요?');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Check that session title is updated in localStorage
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('devgod_chat_storage');
    });

    const parsed = JSON.parse(storageData!);
    const session = parsed.sessions[0];

    expect(session.title).toContain('TypeScript');
  });
});
