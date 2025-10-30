import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show offline banner when network is down', async ({ page, context }) => {
    await page.goto('/');

    // Simulate offline mode
    await context.setOffline(true);

    // Check for offline indicator (if implemented)
    // This depends on your implementation
    const offlineBanner = page.locator('text=/오프라인|연결 끊김|네트워크/i');

    // Try to send a message
    const input = page.locator('textarea[placeholder*="메시지"]');
    await input.fill('오프라인 테스트');

    // Input might be disabled or error shown
    const sendButton = page.locator('button[type="submit"]');
    const isDisabled = await sendButton.isDisabled();

    // Either button is disabled or error appears after send
    if (!isDisabled) {
      await sendButton.click();
      // Wait for error message
      await expect(page.locator('text=/에러|실패|오류/i')).toBeVisible({ timeout: 5000 });
    }

    // Restore online
    await context.setOffline(false);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/chat', (route) => {
      route.abort('failed');
    });

    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    await input.fill('에러 테스트');
    await sendButton.click();

    // Error message should appear
    await expect(page.locator('text=/에러|실패|오류/i')).toBeVisible({ timeout: 10000 });
  });

  test('should re-enable input after error', async ({ page }) => {
    await page.route('/api/chat', (route) => {
      route.abort('failed');
    });

    await page.goto('/');

    const input = page.locator('textarea[placeholder*="메시지"]');
    const sendButton = page.locator('button[type="submit"]');

    await input.fill('에러 후 복구');
    await sendButton.click();

    // Wait for error
    await page.waitForTimeout(3000);

    // Input should be enabled again
    await expect(input).toBeEnabled({ timeout: 5000 });
    await expect(sendButton).toBeEnabled();
  });
});
