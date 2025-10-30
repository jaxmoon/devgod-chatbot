import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display welcome message on initial load', async ({ page }) => {
    await page.goto('/');

    // Check for chat header
    await expect(page.locator('text=개발의신')).toBeVisible();

    // Check for input field
    const input = page.locator('textarea[placeholder*="메시지"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    // Type and send message
    await input.fill('안녕하세요');
    await sendButton.click();

    // User message should appear
    await expect(page.locator('text=안녕하세요').first()).toBeVisible({ timeout: 5000 });

    // Loading indicator should appear
    await expect(page.locator('text=생각 중...')).toBeVisible({ timeout: 3000 });

    // Bot response should appear (wait up to 30s for API)
    await expect(page.locator('.message-bot').first()).toBeVisible({ timeout: 30000 });

    // Input should be enabled again
    await expect(input).toBeEnabled();
  });

  test('should disable input while loading', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    await input.fill('테스트');
    await sendButton.click();

    // Input and button should be disabled during loading
    await expect(input).toBeDisabled({ timeout: 3000 });
    await expect(sendButton).toBeDisabled();
  });

  test('should enforce message length limit', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const longMessage = 'a'.repeat(4001);

    await input.fill(longMessage);

    // Check that input is truncated or validation message appears
    const value = await input.inputValue();
    expect(value.length).toBeLessThanOrEqual(4000);
  });

  test('should handle Shift+Enter for newline', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');

    await input.fill('첫 줄');
    await input.press('Shift+Enter');
    await input.type('둘째 줄');

    const value = await input.inputValue();
    expect(value).toContain('\n');
  });

  test('should send message on Enter key', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');

    await input.fill('엔터로 전송');
    await input.press('Enter');

    // Message should be sent
    await expect(page.locator('text=엔터로 전송').first()).toBeVisible({ timeout: 5000 });
  });
});
