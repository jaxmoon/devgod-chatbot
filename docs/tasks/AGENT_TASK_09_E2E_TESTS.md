# Agent Task 09: E2E Tests
## End-to-End 테스트 (Playwright)

**Agent ID:** AGENT_09
**소요 시간:** 1일
**의존성:** AGENT_01-08 완료
**다음 Agent:** AGENT_10 (Optimization)

---

## 1. Context

### 작업 목표
Playwright를 사용하여 사용자 시나리오 기반 E2E 테스트를 작성합니다.

### 관련 요구사항
- TC-E2E-001: 전체 대화 플로우
- TC-E2E-002: 세션 관리
- TC-E2E-003: 오프라인 처리
- NFR-006: 성능 (LCP < 2.5s)

---

## 2. Prerequisites

```bash
# AGENT_01-08 완료 확인
npm run build
npm run dev  # 개발 서버 실행
```

---

## 3. Task Details

### Step 1: Playwright 설정

**패키지 설치:**
```bash
npm install -D @playwright/test
npx playwright install
```

**`playwright.config.ts` 생성:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**`package.json` scripts 추가:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Step 2: 대화 플로우 테스트

**`e2e/chat-flow.spec.ts` 생성:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome message', async ({ page }) => {
    await expect(page.getByText('안녕하세요! 개발의신입니다.')).toBeVisible();
  });

  test('should send message and receive response', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');
    const sendButton = page.getByRole('button', { name: '전송' });

    // Type message
    await input.fill('Hello, test message');
    await expect(sendButton).toBeEnabled();

    // Send message
    await sendButton.click();

    // Check user message appears
    await expect(page.getByText('Hello, test message')).toBeVisible();

    // Wait for assistant response (streaming)
    const assistantMessage = page.locator('.bg-white').first();
    await expect(assistantMessage).toBeVisible({ timeout: 10000 });

    // Check streaming indicator disappears
    await expect(page.locator('.animate-pulse')).not.toBeVisible({
      timeout: 30000,
    });

    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should disable input while loading', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');
    const sendButton = page.getByRole('button', { name: '전송' });

    await input.fill('Test');
    await sendButton.click();

    // Check disabled state
    await expect(sendButton).toBeDisabled();
    await expect(input).toBeDisabled();

    // Wait for completion
    await expect(sendButton).toBeEnabled({ timeout: 30000 });
  });

  test('should validate message length', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');
    const sendButton = page.getByRole('button', { name: '전송' });

    // Type message over limit (4001 chars)
    const longMessage = 'a'.repeat(4001);
    await input.fill(longMessage);

    // Check character count is red
    await expect(page.getByText(/4001\/4000/)).toHaveCSS('color', /rgb\(239, 68, 68\)/);

    // Send button should be disabled
    await expect(sendButton).toBeDisabled();
  });

  test('should support multiline input with Shift+Enter', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');

    await input.fill('Line 1');
    await input.press('Shift+Enter');
    await input.type('Line 2');

    await expect(input).toHaveValue('Line 1\nLine 2');
  });

  test('should send with Enter key', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');

    await input.fill('Enter test');
    await input.press('Enter');

    await expect(page.getByText('Enter test')).toBeVisible();
  });
});
```

### Step 3: localStorage 및 세션 테스트

**`e2e/storage.spec.ts` 생성:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Storage & Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
  });

  test('should persist messages after refresh', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');

    // Send message
    await input.fill('Test persistence');
    await input.press('Enter');

    // Wait for response
    await expect(page.locator('.bg-white').first()).toBeVisible({
      timeout: 10000,
    });

    // Refresh page
    await page.reload();

    // Check message is still there
    await expect(page.getByText('Test persistence')).toBeVisible();
  });

  test('should save to localStorage', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');

    await input.fill('Save test');
    await input.press('Enter');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check localStorage
    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('chat_sessions') || '[]')
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].messages).toHaveLength(2); // user + assistant
    expect(sessions[0].messages[0].content).toBe('Save test');
  });

  test('should update session title from first message', async ({ page }) => {
    const input = page.getByPlaceholder('메시지를 입력하세요...');

    await input.fill('My first question about React');
    await input.press('Enter');

    await page.waitForTimeout(2000);

    const sessions = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('chat_sessions') || '[]')
    );

    expect(sessions[0].title).toBe('My first question about React...');
  });
});
```

### Step 4: 에러 처리 테스트

**`e2e/error-handling.spec.ts` 생성:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show offline banner when offline', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);

    // Trigger online/offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Check offline banner
    await expect(page.getByText(/오프라인 모드/)).toBeVisible();

    // Input should be disabled
    const input = page.getByPlaceholder('메시지를 입력하세요...');
    await expect(input).toBeDisabled();

    // Go back online
    await context.setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Banner should disappear
    await expect(page.getByText(/오프라인 모드/)).not.toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should show error toast on API failure', async ({ page }) => {
    // Mock API error
    await page.route('/api/chat', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: '서버 오류가 발생했습니다.',
          code: 'API_ERROR',
        }),
      });
    });

    const input = page.getByPlaceholder('메시지를 입력하세요...');
    await input.fill('Test error');
    await input.press('Enter');

    // Check error toast appears
    await expect(page.getByText(/오류 발생/)).toBeVisible({ timeout: 5000 });
  });
});
```

### Step 5: 성능 테스트

**`e2e/performance.spec.ts` 생성:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be < 2.5s
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(2500);
  });

  test('should handle many messages efficiently', async ({ page }) => {
    await page.goto('/');

    // Add 50 messages to localStorage
    await page.evaluate(() => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg_${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now() - (50 - i) * 60000,
      }));

      const session = {
        id: 'perf-test',
        title: 'Performance Test',
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem('chat_sessions', JSON.stringify([session]));
      localStorage.setItem('current_session_id', 'perf-test');
    });

    await page.reload();

    // Measure render time
    const startTime = Date.now();
    await page.waitForSelector('.bg-white', { timeout: 5000 });
    const renderTime = Date.now() - startTime;

    // Should render quickly
    expect(renderTime).toBeLessThan(1000);

    // Check all messages are rendered
    const messageCount = await page.locator('.rounded-lg.px-4.py-2').count();
    expect(messageCount).toBe(50);
  });
});
```

---

## 4. Verification

```bash
# 1. E2E 테스트 실행
npm run test:e2e

# 2. UI 모드 (디버깅)
npm run test:e2e:ui

# 3. 특정 브라우저
npx playwright test --project=chromium

# 4. 리포트 확인
npx playwright show-report
```

---

## 5. Handoff

### 완료 사항
- ✅ Playwright 설정
- ✅ 대화 플로우 테스트
- ✅ localStorage 테스트
- ✅ 에러 처리 테스트
- ✅ 성능 테스트 (LCP)
- ✅ 모바일 테스트 설정

### AGENT_10을 위한 정보
```typescript
// 최적화 대상:
// 1. 번들 사이즈 (react-markdown, syntax-highlighter 최적화)
// 2. 이미지 최적화 (next/image)
// 3. 메모이제이션 (ChatMessage, useMemo)
// 4. 코드 스플리팅 (dynamic import)
// 5. 50개 이상 메시지 시 가상화 고려
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_09_HANDOFF.md`

---

**Agent 09 작업 완료 ✅**
