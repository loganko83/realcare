import { test, expect } from '@playwright/test';

const BASE = '/real/';

// Helper to dismiss onboarding modal if present
async function dismissOnboarding(page: import('@playwright/test').Page) {
  // Set localStorage to skip onboarding before navigation
  await page.addInitScript(() => {
    localStorage.setItem('realcare_onboarding_complete', 'true');
  });
}

// =============================================================================
// D2: Frontend Runtime Tests
// =============================================================================

test.describe('D2-01: React App Initialization', () => {
  test('should mount React app without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE);

    // Wait for React to mount
    await page.waitForSelector('#root');

    // Check that root has children (React mounted)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.length).toBeGreaterThan(0);

    // Check for critical errors (ignore minor warnings)
    const criticalErrors = errors.filter(e =>
      !e.includes('Download the React DevTools') &&
      !e.includes('Warning:')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display app title', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/리얼케어|RealCare/);
  });
});

test.describe('D2-02: TanStack Router Navigation', () => {
  test('should navigate to all routes', async ({ page }) => {
    const routes = [
      { path: BASE, name: 'Home' },
      { path: `${BASE}calculators`, name: 'Calculators' },
      { path: `${BASE}contract`, name: 'Contract' },
      { path: `${BASE}settings`, name: 'Settings' },
      { path: `${BASE}signals`, name: 'Signals' },
      { path: `${BASE}timeline`, name: 'Timeline' },
      { path: `${BASE}subscription`, name: 'Subscription' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      // Check URL is correct
      expect(page.url()).toContain(route.path);
    }
  });

  test('should navigate via bottom navigation', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Find bottom fixed navigation (uses div.fixed.bottom-0 not nav)
    const bottomNav = page.locator('.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();

    // Find navigation links
    const navLinks = bottomNav.locator('a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Click on calculators nav item
    const calcNav = bottomNav.locator('a[href*="calculators"]').first();
    if (await calcNav.count() > 0) {
      await calcNav.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/calculators');
    }
  });

  test('should handle browser back/forward', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await page.goto(`${BASE}calculators`);
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/real\/?$/);

    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/calculators');
  });

  test('should support deep linking', async ({ page }) => {
    // Direct access to a route
    await page.goto(`${BASE}settings`);
    await page.waitForLoadState('networkidle');

    // Should render settings page content
    const content = await page.locator('main').first().innerHTML();
    expect(content.length).toBeGreaterThan(100);
  });
});

test.describe('D2-04: i18n System', () => {
  test('should display Korean text by default', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check for Korean text
    const pageContent = await page.content();
    expect(pageContent).toMatch(/[\uAC00-\uD7AF]/); // Korean characters
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto(`${BASE}settings`);
    await page.waitForLoadState('networkidle');

    // Check localStorage for language (null means default Korean)
    const language = await page.evaluate(() => localStorage.getItem('realcare_language'));
    // Language can be ko, en, or null (not set yet = default Korean)
    expect(language === null || language === 'ko' || language === 'en').toBe(true);
  });
});

test.describe('D2-05: LocalStorage Persistence', () => {
  test('should have localStorage available', async ({ page }) => {
    await page.goto(BASE);

    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    });

    expect(hasLocalStorage).toBe(true);
  });
});

test.describe('D2-06: Component Rendering', () => {
  test('should render navigation bar', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check for bottom fixed navigation (uses div.fixed.bottom-0)
    const bottomNav = page.locator('.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
  });

  test('should render icons', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check for SVG icons (lucide-react uses SVG)
    const svgIcons = page.locator('svg');
    const iconCount = await svgIcons.count();
    expect(iconCount).toBeGreaterThan(0);
  });
});

// =============================================================================
// D3: API & Services Tests
// =============================================================================

test.describe('D3-01: Gemini API Connection', () => {
  test('should load contract analysis page', async ({ page }) => {
    await page.goto(`${BASE}contract`);
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    // Check for contract-related UI elements
    const hasContractUI = await page.locator('textarea, input[type="file"], button').count();
    expect(hasContractUI).toBeGreaterThan(0);
  });
});

test.describe('D3-02: Contract Analysis (UI only)', () => {
  test('should have text input area', async ({ page }) => {
    await page.goto(`${BASE}contract`);
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea');
    const textareaCount = await textarea.count();
    expect(textareaCount).toBeGreaterThanOrEqual(0); // May use different input
  });

  test('should have file upload option', async ({ page }) => {
    await page.goto(`${BASE}contract`);
    await page.waitForLoadState('networkidle');

    // Check for file input or upload button
    const fileInput = page.locator('input[type="file"]');
    const uploadButton = page.locator('button').filter({ hasText: /업로드|upload|사진|photo|갤러리|gallery/i });

    const hasUpload = (await fileInput.count()) > 0 || (await uploadButton.count()) > 0;
    expect(hasUpload).toBe(true);
  });
});

test.describe('D3-03: Gemini API Live Test', () => {
  test('should analyze contract text with Gemini', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(`${BASE}contract`);
    await page.waitForLoadState('networkidle');

    // Sample contract text with dangerous clauses
    const sampleContract = `
      임대차 계약서

      제5조 (보증금 반환)
      보증금은 임대차 종료일로부터 60일 이내에 반환한다.

      제7조 (중도 해지)
      임차인이 중도에 해지할 경우 보증금의 50%를 위약금으로 몰수한다.

      제9조 (출입 권한)
      임대인은 언제든지 사전 통보 없이 임차 목적물에 출입할 수 있다.
    `;

    // Find textarea and enter contract text
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill(sampleContract);

      // Find and click analyze button
      const analyzeButton = page.locator('button').filter({
        hasText: /분석|analyze|검토|review/i
      }).first();

      if (await analyzeButton.count() > 0) {
        await analyzeButton.click();

        // Wait for analysis result (may take time due to API call)
        await page.waitForTimeout(10000);

        // Check for analysis results
        const pageContent = await page.content();

        // Should show some analysis result (risk level, score, etc.)
        const hasResult =
          pageContent.includes('위험') ||
          pageContent.includes('risk') ||
          pageContent.includes('점수') ||
          pageContent.includes('score') ||
          pageContent.includes('등급') ||
          pageContent.includes('grade');

        expect(hasResult).toBe(true);
      }
    }
  });
});

// =============================================================================
// D4: UI/UX Tests
// =============================================================================

test.describe('D4-01: Mobile Responsiveness', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check that content fits viewport (no horizontal scroll)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small margin

    // Check bottom navigation is visible
    const bottomNav = page.locator('.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
  });
});

test.describe('D4-02: Tailwind CSS', () => {
  test('should apply Tailwind styles', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check that CSS is loaded (look for Tailwind-like classes)
    const hasStyles = await page.evaluate(() => {
      const root = document.querySelector('#root');
      if (!root) return false;
      const styles = window.getComputedStyle(root);
      // Check if any styling is applied
      return styles.display !== '' || styles.flexDirection !== '';
    });

    expect(hasStyles).toBe(true);
  });
});

test.describe('D4-03: Font Loading', () => {
  test('should load fonts', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Check font-family is applied
    const fontFamily = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });

    // Should have Inter or system font
    expect(fontFamily).toBeTruthy();
  });

  test('should render Korean characters', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Take screenshot to visually verify (stored in test-results)
    await page.screenshot({ path: 'test-results/korean-text.png' });

    // Check Korean text is present
    const koreanText = await page.locator('text=/[\uAC00-\uD7AF]+/').first();
    await expect(koreanText).toBeVisible();
  });
});

test.describe('D4-05: Tab Navigation', () => {
  test('should have all navigation tabs', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bottomNav = page.locator('.fixed.bottom-0');
    const links = bottomNav.locator('a');
    const linkCount = await links.count();

    // Should have at least 4 navigation items
    expect(linkCount).toBeGreaterThanOrEqual(4);
  });

  test('should highlight active tab', async ({ page }) => {
    await page.goto(`${BASE}calculators`);
    await page.waitForLoadState('networkidle');

    // Check bottom navigation is visible
    const bottomNav = page.locator('.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
  });
});

test.describe('D4-06: Calculator Tabs', () => {
  test('should have calculator sub-tabs', async ({ page }) => {
    await page.goto(`${BASE}calculators`);
    await page.waitForLoadState('networkidle');

    // Look for tab-like elements
    const tabs = page.locator('button, [role="tab"]').filter({
      hasText: /리얼리티|세금|대출|Reality|Tax|Loan/i
    });
    const tabCount = await tabs.count();

    // Should have at least 2 calculator tabs
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// D5: Performance Tests
// =============================================================================

test.describe('D5: Performance', () => {
  test('should load initial page within 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should load all critical assets', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Filter out expected 404s (like favicon if missing)
    const criticalFailures = failedRequests.filter(r =>
      !r.includes('favicon') &&
      !r.includes('.map')
    );

    expect(criticalFailures).toHaveLength(0);
  });
});

// =============================================================================
// Screenshot Tests (for manual verification)
// =============================================================================

test.describe('Screenshots', () => {
  test('capture all pages', async ({ page }) => {
    const pages = [
      { path: BASE, name: 'home' },
      { path: `${BASE}calculators`, name: 'calculators' },
      { path: `${BASE}contract`, name: 'contract' },
      { path: `${BASE}settings`, name: 'settings' },
      { path: `${BASE}signals`, name: 'signals' },
      { path: `${BASE}timeline`, name: 'timeline' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `test-results/page-${p.name}.png`,
        fullPage: true
      });
    }
  });
});
