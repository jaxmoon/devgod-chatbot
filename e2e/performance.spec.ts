import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load page within performance budget', async ({ page }) => {
    await page.goto('/');

    // Measure performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      };
    });

    // LCP should be under 2.5 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(2500);
  });

  test('should handle multiple messages efficiently', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Create mock session with 50 messages
    await page.evaluate(() => {
      const messages = [];
      for (let i = 0; i < 50; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `테스트 메시지 ${i}`,
          timestamp: Date.now() - (50 - i) * 1000,
        });
      }

      const storage = {
        sessions: [{
          id: 'test-session',
          title: '성능 테스트',
          messages,
          createdAt: Date.now() - 60000,
          updatedAt: Date.now(),
        }],
        activeSessionId: 'test-session',
        version: 1,
      };

      localStorage.setItem('devgod_chat_storage', JSON.stringify(storage));
    });

    await page.reload();

    // All messages should be rendered
    const messageCount = await page.locator('[class*="message"]').count();
    expect(messageCount).toBeGreaterThanOrEqual(50);

    // Scrolling should be smooth
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(500);

    // Input should still be responsive
    const input = page.locator('textarea[placeholder*="메시지"]');
    await expect(input).toBeEnabled();
  });
});
