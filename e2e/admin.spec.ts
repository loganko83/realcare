import { test, expect } from '@playwright/test';

const BASE = 'https://trendy.storydot.kr/real/';

// Helper to dismiss onboarding modal if present
async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('realcare_onboarding_complete', 'true');
  });
}

// =============================================================================
// Admin Route Protection Tests
// =============================================================================

test.describe('Admin Route Protection', () => {
  test('should redirect /admin/ to login with redirect param', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}admin/`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login page with redirect param
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain('admin');

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/admin-redirect-login.png', fullPage: true });
  });

  test('should redirect /admin/users to login with redirect param', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}admin/users`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=');

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-users-redirect.png', fullPage: true });
  });

  test('should redirect /admin/agents to login with redirect param', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}admin/agents`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=');

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-agents-redirect.png', fullPage: true });
  });
});

test.describe('Admin Login Page', () => {
  test('should display login form when accessing admin', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}admin/`);
    await page.waitForLoadState('networkidle');

    // Should show login page with Korean text
    const content = await page.content();
    const hasLoginUI =
      content.includes('로그인') ||
      content.includes('Login') ||
      content.includes('이메일') ||
      content.includes('비밀번호');

    expect(hasLoginUI).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-login-form.png', fullPage: true });
  });

  test('should have social login options', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}login`);
    await page.waitForLoadState('networkidle');

    const content = await page.content();

    // Should have social login buttons (Google, Kakao, Naver)
    const hasSocialLogin =
      content.includes('Google') ||
      content.includes('구글') ||
      content.includes('카카오') ||
      content.includes('Kakao') ||
      content.includes('네이버') ||
      content.includes('Naver');

    expect(hasSocialLogin).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-social.png', fullPage: true });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dismissOnboarding(page);

    await page.goto(`${BASE}admin/`);
    await page.waitForLoadState('networkidle');

    // Check content fits viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400);

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/admin-login-mobile.png', fullPage: true });
  });
});

test.describe('Admin with Mock Auth', () => {
  test('should access admin after setting auth token', async ({ page }) => {
    // Set up mock authentication in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('realcare_onboarding_complete', 'true');
      // Mock auth token (won't work with real API but tests route behavior)
      localStorage.setItem('realcare_auth_token', 'mock_admin_token');
      localStorage.setItem('realcare_user', JSON.stringify({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin'
      }));
    });

    await page.goto(`${BASE}admin/`);
    await page.waitForLoadState('networkidle');

    // Take screenshot to see what happens with mock auth
    await page.screenshot({ path: 'test-results/admin-mock-auth.png', fullPage: true });

    // Check if we're on admin page or still redirected
    const url = page.url();
    console.log('URL after mock auth:', url);
  });
});
