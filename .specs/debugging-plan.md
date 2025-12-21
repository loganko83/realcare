# RealCare Debugging Plan

> Comprehensive debugging specification following Spec-Kit methodology

## Overview

| Category | Items | Priority |
|----------|-------|----------|
| Infrastructure | 8 | Critical |
| Frontend Runtime | 10 | Critical |
| API & Services | 6 | High |
| UI/UX | 8 | Medium |
| Performance | 5 | Medium |

**Target URL**: https://trendy.storydot.kr/real/

---

## Phase D1: Infrastructure Debugging

### D1-01: Nginx Configuration Verification
- [ ] Verify SPA fallback works for all routes
- [ ] Check asset caching headers (Cache-Control, expires)
- [ ] Verify gzip compression enabled
- [ ] Check SSL certificate validity
- [ ] Verify CORS headers if needed

**Commands**:
```bash
# Check route fallback
curl -s -o /dev/null -w "%{http_code}" https://trendy.storydot.kr/real/calculators

# Check headers
curl -I https://trendy.storydot.kr/real/assets/index-*.js

# Check SSL
openssl s_client -connect trendy.storydot.kr:443 -servername trendy.storydot.kr
```

### D1-02: Static Asset Delivery
- [ ] All JS chunks load (200 status)
- [ ] All CSS files load
- [ ] Font files accessible (Google Fonts)
- [ ] Correct MIME types served

**Chunks to verify**:
- vendor-react
- vendor-tanstack
- vendor-charts
- vendor-jspdf
- vendor-html2canvas
- vendor-gemini
- Route chunks (calculators, contract, settings, signals, timeline)

### D1-03: Environment Variables
- [ ] GEMINI_API_KEY exposed correctly via Vite define
- [ ] No sensitive keys in client bundle
- [ ] Environment matches production config

**Check**:
```bash
# On server
cat /mnt/storage/real/.env
grep -r "API_KEY" /mnt/storage/real/dist/assets/*.js | head -1
```

### D1-04: Symlink & Permissions
- [ ] /var/www/real symlink valid
- [ ] www-data can read all files
- [ ] No broken symlinks

**Commands**:
```bash
ls -la /var/www/real
sudo -u www-data cat /var/www/real/index.html
```

---

## Phase D2: Frontend Runtime Debugging

### D2-01: React App Initialization
- [ ] Root element exists in DOM
- [ ] React mounts without hydration errors
- [ ] StrictMode double-render handled correctly
- [ ] No "Cannot read property of undefined" errors

**Browser Console Check**:
```javascript
// Should return React root
document.getElementById('root')._reactRootContainer
```

### D2-02: TanStack Router
- [ ] Router initializes with basepath '/real'
- [ ] All routes registered correctly
- [ ] Navigation between routes works
- [ ] Browser back/forward works
- [ ] Deep linking works (direct URL access)
- [ ] 404 handling for unknown routes

**Routes to test**:
| Route | Expected Page |
|-------|---------------|
| /real/ | Home |
| /real/calculators | Financial Calculators |
| /real/contract | Contract Analysis |
| /real/settings | Settings |
| /real/signals | Owner Signals |
| /real/timeline | Smart Move-in |
| /real/subscription | Subscription |

### D2-03: TanStack Query
- [ ] QueryClient initialized
- [ ] DevTools visible in development
- [ ] Queries not stuck in loading state
- [ ] Proper error boundaries for failed queries
- [ ] Cache working (staleTime: 5min)

**Debug**:
```javascript
// In browser console with DevTools
window.__REACT_QUERY_DEVTOOLS__
```

### D2-04: i18n System
- [ ] Korean text displays by default
- [ ] Language switch to English works
- [ ] Language persists on reload (localStorage)
- [ ] No missing translation keys (shows key instead of text)

**Storage key**: `realcare_language`

### D2-05: LocalStorage Persistence
- [ ] Saved analyses persist: `realcare_saved_analyses`
- [ ] Contracts persist: `realcare_my_contracts`
- [ ] Favorites persist: `realcare_favorites`
- [ ] Language setting persists: `realcare_language`
- [ ] No localStorage quota errors

### D2-06: Component Rendering
- [ ] Navigation bar renders at bottom
- [ ] Active tab highlighted correctly
- [ ] Icons render (lucide-react)
- [ ] No missing component errors

### D2-07: Form Handling
- [ ] TanStack Form validation works
- [ ] Zod schema errors display
- [ ] Form submission triggers mutations
- [ ] Loading states show during submission

### D2-08: Chart Rendering (Recharts)
- [ ] Pie charts render in Calculators
- [ ] Bar charts render for score breakdown
- [ ] Responsive sizing works
- [ ] No "ResizeObserver loop" errors

### D2-09: PDF Export
- [ ] html2canvas captures content
- [ ] jsPDF generates valid PDF
- [ ] PDF download triggers
- [ ] Korean fonts render in PDF

### D2-10: Share Functionality
- [ ] Web Share API works on mobile
- [ ] Clipboard fallback works on desktop
- [ ] Share content formatted correctly

---

## Phase D3: API & Services Debugging

### D3-01: Gemini API Connection
- [ ] API key valid and not expired
- [ ] Network requests reach Google servers
- [ ] CORS not blocking requests
- [ ] Rate limiting not triggered

**Test**:
```javascript
// In browser console
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY');
console.log(response.status);
```

### D3-02: Contract Analysis
- [ ] Text input analysis works
- [ ] Image upload analysis works
- [ ] PDF upload analysis works
- [ ] Response JSON parses correctly
- [ ] Risk levels display (High/Medium/Low)
- [ ] Suggestions array renders

### D3-03: Financial Advice
- [ ] Income/cash/price inputs work
- [ ] Gemini returns Korean advice
- [ ] Error handling for API failures
- [ ] Loading state during analysis

### D3-04: RAG Knowledge Stores
- [ ] Regulations store accessible
- [ ] Contracts store accessible
- [ ] Precedents store accessible
- [ ] Citations extracted from responses

### D3-05: File Upload
- [ ] Camera capture works (mobile)
- [ ] Gallery selection works
- [ ] File size limits enforced
- [ ] Base64 encoding works
- [ ] MIME type detection correct

### D3-06: Error Handling
- [ ] Network errors show user-friendly messages
- [ ] API errors don't crash the app
- [ ] Retry logic works for transient failures
- [ ] Error boundaries catch component errors

---

## Phase D4: UI/UX Debugging

### D4-01: Mobile Responsiveness
- [ ] max-w-md container works
- [ ] Bottom navigation doesn't overlap content
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scroll
- [ ] Viewport meta tag correct

### D4-02: Tailwind CSS
- [ ] PostCSS build produces correct CSS
- [ ] Custom colors work
- [ ] Spacing utilities work
- [ ] Dark mode (if implemented)
- [ ] No purged classes missing

### D4-03: Font Loading
- [ ] Inter font loads from Google Fonts
- [ ] FOUT/FOIT handled gracefully
- [ ] Korean characters render correctly
- [ ] Font weights available (400, 500, 600, 700)

### D4-04: Icons (Lucide)
- [ ] All navigation icons render
- [ ] Icon sizes consistent
- [ ] Icon colors match theme
- [ ] No missing icon errors

### D4-05: Tab Navigation
- [ ] All 5 tabs visible
- [ ] Active tab styled differently
- [ ] Tab click navigates correctly
- [ ] Fixed positioning works

### D4-06: Calculator Tabs
- [ ] Reality Check tab works
- [ ] Tax Calculator tab works
- [ ] Loan Limit tab works
- [ ] Tab state persists within session

### D4-07: Modal/Dialog
- [ ] Share format selection modal opens
- [ ] Modal closes on backdrop click
- [ ] Modal closes on X button
- [ ] Focus trapped inside modal

### D4-08: Scroll Behavior
- [ ] Content scrolls independently of nav
- [ ] no-scrollbar class hides scrollbar
- [ ] Pull-to-refresh doesn't interfere
- [ ] Scroll position maintained on back

---

## Phase D5: Performance Debugging

### D5-01: Bundle Size
- [ ] No chunks over 500KB (warning threshold)
- [ ] Code splitting working
- [ ] Tree shaking effective
- [ ] No duplicate dependencies

**Current chunks**:
| Chunk | Size | Status |
|-------|------|--------|
| vendor-charts | 380 KB | OK |
| vendor-jspdf | 357 KB | OK |
| vendor-html2canvas | 202 KB | OK |
| vendor-tanstack | 121 KB | OK |
| index (main) | 207 KB | OK |

### D5-02: Initial Load Time
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Total Blocking Time < 200ms

### D5-03: Runtime Performance
- [ ] No memory leaks on navigation
- [ ] Smooth scrolling (60fps)
- [ ] No layout thrashing
- [ ] Efficient re-renders

### D5-04: Network Optimization
- [ ] Assets cached with immutable headers
- [ ] Preload critical resources
- [ ] Lazy load non-critical chunks
- [ ] No waterfall loading

### D5-05: Lighthouse Audit
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

---

## Debug Tools & Commands

### Browser DevTools
```javascript
// React DevTools
// Components tab: Check component hierarchy
// Profiler tab: Check render performance

// Network tab
// Filter by JS/CSS/XHR
// Check for failed requests (red)

// Console
// Look for errors (red)
// Look for warnings (yellow)
// Check for React errors
```

### Server-Side Debug
```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Check nginx error log
sudo tail -50 /var/log/nginx/error.log | grep real

# Check nginx access log
sudo tail -50 /var/log/nginx/access.log | grep real

# Check app files
ls -la /var/www/real/
ls -la /var/www/real/assets/ | wc -l

# Check disk space
df -h /mnt/storage

# Check memory
free -h
```

### Local Development Debug
```bash
# Run dev server with verbose logging
npm run dev -- --debug

# Check for TypeScript errors
npx tsc --noEmit

# Check for ESLint errors
npx eslint src/

# Analyze bundle
npx vite-bundle-visualizer
```

---

## Issue Template

When documenting issues, use this format:

```markdown
### Issue: [Brief Description]

**Category**: D1/D2/D3/D4/D5
**Severity**: Critical/High/Medium/Low
**Status**: Open/In Progress/Resolved

**Symptoms**:
- What the user sees

**Expected**:
- What should happen

**Steps to Reproduce**:
1. Step 1
2. Step 2

**Root Cause**:
- Technical explanation

**Solution**:
- How it was fixed

**Verification**:
- How to confirm it's fixed
```

---

## Debugging Checklist Summary

### Quick Health Check (5 min)
- [ ] Homepage loads (200)
- [ ] All routes accessible (200)
- [ ] JS/CSS assets load (200)
- [ ] No console errors
- [ ] Navigation works

### Full Debug (30 min)
- [ ] D1: Infrastructure (8 items)
- [ ] D2: Frontend Runtime (10 items)
- [ ] D3: API & Services (6 items)
- [ ] D4: UI/UX (8 items)
- [ ] D5: Performance (5 items)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-21 | Initial debugging plan |
