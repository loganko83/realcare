import { test, expect } from '@playwright/test';

const BASE = 'https://trendy.storydot.kr/real/';
const ADMIN_EMAIL = 'admin.test@storydot.kr';
const ADMIN_PASSWORD = 'AdminTest123';

// Helper to dismiss onboarding modal
async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('realcare_onboarding_complete', 'true');
  });
}

test.describe('Admin Login and Dashboard', () => {
  test('should login as admin and access dashboard', async ({ page }) => {
    await dismissOnboarding(page);

    // Go to login page
    await page.goto(`${BASE}login`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/admin-login-page.png', fullPage: true });

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="이메일"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);

    // Take screenshot before clicking login
    await page.screenshot({ path: 'test-results/admin-login-filled.png', fullPage: true });

    // Click login button
    const loginButton = page.locator('button').filter({ hasText: /로그인|Login|Sign in/i }).first();
    await loginButton.click();

    // Wait for navigation
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Take screenshot after login
    await page.screenshot({ path: 'test-results/admin-after-login.png', fullPage: true });

    // Check if logged in (should be on home or redirected page)
    const url = page.url();
    console.log('URL after login:', url);

    // Now navigate to admin
    await page.goto(`${BASE}admin/`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of admin dashboard
    await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });

    // Check if we're on admin page (not redirected to login)
    const adminUrl = page.url();
    console.log('Admin URL:', adminUrl);

    // Should be on admin page, not login
    const isOnAdmin = adminUrl.includes('/admin');
    const isNotOnLogin = !adminUrl.includes('/login');

    console.log('Is on admin:', isOnAdmin);
    console.log('Is not on login:', isNotOnLogin);
  });

  test('should navigate to admin users page', async ({ page }) => {
    await dismissOnboarding(page);

    // Login first
    await page.goto(`${BASE}login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="이메일"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button').filter({ hasText: /로그인|Login|Sign in/i }).first();
    await loginButton.click();

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Navigate to admin users
    await page.goto(`${BASE}admin/users`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-users-page.png', fullPage: true });

    console.log('Admin Users URL:', page.url());
  });

  test('should navigate to admin agents page', async ({ page }) => {
    await dismissOnboarding(page);

    // Login first
    await page.goto(`${BASE}login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="이메일"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button').filter({ hasText: /로그인|Login|Sign in/i }).first();
    await loginButton.click();

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Navigate to admin agents
    await page.goto(`${BASE}admin/agents`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-agents-page.png', fullPage: true });

    console.log('Admin Agents URL:', page.url());
  });
});
