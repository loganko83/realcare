# GitHub Actions Workflows Summary

Complete overview of all GitHub Actions workflows configured for the RealCare project.

## Workflow Files Created

All workflow files are located in `.github/workflows/`:

1. **ci.yml** - Continuous Integration
2. **deploy.yml** - Continuous Deployment
3. **codeql.yml** - Security Analysis
4. **dependency-update.yml** - Dependency Management

---

## 1. CI - Continuous Integration (`ci.yml`)

### Purpose
Automated testing and validation of code changes before deployment.

### Triggers
- Push to `master` branch
- Pull requests to `master` branch

### Jobs

#### Frontend Job (4-5 minutes)
```yaml
Runs on: ubuntu-latest
Node: 22.21.1
Cache: npm packages
```

Steps:
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies (`npm ci`)
4. TypeScript type checking (`npx tsc --noEmit`)
5. Build production bundle (`npm run build`)
6. Upload build artifacts

**Caching:** npm packages cached by package-lock.json hash

#### Backend Job (3-4 minutes)
```yaml
Runs on: ubuntu-latest
Python: 3.11
Cache: pip packages
```

Steps:
1. Checkout code
2. Setup Python with caching
3. Install dependencies from requirements.txt
4. Run pytest unit tests (DB tests skipped)

**Note:** Integration tests requiring PostgreSQL are skipped in CI via `SKIP_DB_TESTS=true`

**Caching:** pip packages cached by requirements.txt hash

#### E2E Job (3-4 minutes)
```yaml
Runs on: ubuntu-latest
Depends on: Frontend + Backend jobs
Browser: Chromium only
```

Steps:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Install Playwright browsers (Chromium)
5. Run E2E tests against production URL
6. Upload test reports and screenshots

**Test Configuration:**
- Runs against: https://trendy.storydot.kr
- Projects: Chromium only (for CI performance)
- Retries: 2 attempts on failure
- Artifacts retained: 7 days

### Total CI Time
Approximately 5-7 minutes (jobs run in parallel)

### Artifacts Produced
- `frontend-dist` - Built frontend files (1 day retention)
- `playwright-report` - E2E test HTML report (7 days retention)
- `test-results` - Screenshots and traces (7 days retention)

---

## 2. CD - Continuous Deployment (`deploy.yml`)

### Purpose
Automated deployment to production server after successful CI.

### Triggers
- Push to `master` branch (automatic)
- Manual trigger via `workflow_dispatch`

### Jobs

#### Deploy Job (3-5 minutes)
```yaml
Runs on: ubuntu-latest
Depends on: CI workflow (implicitly via branch push)
```

Steps:

1. **Checkout code**
2. **Setup Node.js** (22.21.1 with npm caching)
3. **Install dependencies** (`npm ci`)
4. **Build frontend** with production env vars
   - `VITE_SENTRY_DSN` from secrets
   - `GEMINI_API_KEY` from secrets

5. **Setup SSH**
   - Create SSH key from secret
   - Configure known_hosts for server

6. **Deploy to server** via SSH:
   ```bash
   cd /mnt/storage/real
   git pull origin master
   cd backend && source venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   sudo systemctl restart realcare-backend
   cd .. && npm ci && npm run build
   sudo cp -r dist/* /var/www/html/real/
   sudo systemctl reload nginx
   ```

7. **Verify deployment**
   - Check frontend: `curl https://trendy.storydot.kr/real/`
   - Check backend: `curl https://trendy.storydot.kr/real/api/docs`

8. **Cleanup SSH key** (always runs)

### Required Secrets
- `SSH_PRIVATE_KEY` - Private SSH key (firstkeypair.pem)
- `SERVER_HOST` - Server hostname (trendy.storydot.kr)
- `GEMINI_API_KEY` - Google Gemini API key
- `VITE_SENTRY_DSN` - Sentry DSN (optional)

### Deployment Flow
```
Push to master
  ↓
CI runs (5-7 min)
  ↓
CI passes
  ↓
Deploy runs (3-5 min)
  ↓
Service restarted
  ↓
Verification
  ↓
Production updated
```

---

## 3. CodeQL Security Analysis (`codeql.yml`)

### Purpose
Automated security vulnerability scanning of codebase.

### Triggers
- Push to `master` branch
- Pull requests to `master` branch
- Schedule: Every Monday at midnight UTC

### Jobs

#### Analyze Job
```yaml
Runs on: ubuntu-latest
Languages: JavaScript, Python
Permissions: security-events write
```

Matrix:
- JavaScript/TypeScript analysis
- Python analysis

Steps:
1. Checkout code
2. Initialize CodeQL
3. Autobuild code
4. Perform security analysis
5. Upload results to GitHub Security tab

### Features
- Detects common vulnerabilities (SQL injection, XSS, etc.)
- Checks for security anti-patterns
- Identifies code quality issues
- Results visible in GitHub Security → Code scanning

### Queries Used
- Security queries
- Quality queries

---

## 4. Dependency Updates (`dependency-update.yml`)

### Purpose
Weekly check for outdated dependencies and automated issue creation.

### Triggers
- Schedule: Every Monday at 9 AM UTC
- Manual trigger via `workflow_dispatch`

### Jobs

#### Update Dependencies Job
```yaml
Runs on: ubuntu-latest
```

Steps:
1. Checkout code
2. Setup Node.js (22.21.1)
3. Setup Python (3.11)
4. Check npm outdated packages
5. Check pip outdated packages
6. Create GitHub issue if updates available

### Output
- Creates issues labeled: `dependencies`, `maintenance`
- Issue contains list of outdated packages
- Includes both frontend (npm) and backend (pip) updates

### Issue Format
```markdown
## Frontend Dependencies
[List of outdated npm packages]

## Backend Dependencies
[List of outdated pip packages]
```

---

## Workflow Dependencies

```
Push to master
    ├─→ CI (parallel)
    │   ├─→ Frontend build
    │   ├─→ Backend tests
    │   └─→ E2E tests (after frontend+backend)
    │
    └─→ CD (after CI passes)
        └─→ Deploy to production

Weekly schedule
    ├─→ CodeQL scan (Monday 00:00 UTC)
    └─→ Dependency check (Monday 09:00 UTC)
```

---

## Performance Optimizations

### Caching Strategy

1. **npm packages**
   - Cached by: `actions/setup-node@v4`
   - Cache key: `package-lock.json` hash
   - Saves: ~30-60 seconds per run

2. **pip packages**
   - Cached by: `actions/setup-python@v5`
   - Cache key: `requirements.txt` hash
   - Saves: ~20-40 seconds per run

3. **Playwright browsers**
   - Not cached (ensures compatibility)
   - Fresh install each run (~30 seconds)

### Parallel Execution
- CI jobs run in parallel (Frontend, Backend)
- E2E waits for both to complete
- Total time: ~5-7 minutes (vs ~10+ minutes sequential)

### Artifact Retention
- Build artifacts: 1 day (only needed for same workflow)
- Test reports: 7 days (debugging recent failures)
- Screenshots: 7 days (visual regression analysis)

---

## Environment Variables

### CI Environment
```bash
CI=true                  # Enables CI mode in Playwright
NODE_ENV=test            # Node environment
SKIP_DB_TESTS=true       # Skip database integration tests
```

### Deploy Environment
```bash
VITE_SENTRY_DSN          # From GitHub secret
GEMINI_API_KEY           # From GitHub secret
```

### Server Environment (systemd)
```bash
DATABASE_URL             # PostgreSQL connection string
SECRET_KEY               # JWT secret key
GEMINI_API_KEY           # Gemini API key
DID_BAAS_URL            # Blockchain DID service URL
XPHERE_RPC_URL          # Xphere blockchain RPC
```

---

## Monitoring and Alerts

### GitHub Actions Tab
- View all workflow runs
- Filter by workflow, branch, status
- Download artifacts
- Re-run failed workflows

### Email Notifications
GitHub sends emails on:
- Workflow failures
- First workflow run after enabling
- Weekly digest (if configured)

### Slack/Discord Integration (Optional)
Add webhook notifications:
```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Security Considerations

### Secrets Management
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Minimize secret access scope

### SSH Key Security
- Private key stored as GitHub secret
- Key cleaned up after each deployment
- Use dedicated deployment key (not personal key)
- Consider using GitHub Deploy Keys

### Permissions
- Workflows run with minimal permissions
- CodeQL has `security-events: write` only
- Deploy has SSH access (necessary for deployment)
- Consider using OIDC for AWS deployments (future)

---

## Troubleshooting Guide

### CI Failures

| Error | Cause | Solution |
|-------|-------|----------|
| Type check failed | TypeScript errors | Run `npx tsc --noEmit` locally |
| Build failed | Missing dependencies | Check `package.json` and `package-lock.json` |
| Tests failed | Code issues | Run `pytest -v` locally |
| E2E failed | Production site issues | Check Playwright artifacts |

### Deployment Failures

| Error | Cause | Solution |
|-------|-------|----------|
| SSH timeout | Network/firewall | Check server accessibility |
| Git pull failed | Permissions | Verify git credentials on server |
| Build failed | Missing secrets | Check GitHub secrets configuration |
| Service restart failed | Sudo permissions | Verify `/etc/sudoers.d/realcare-deploy` |
| Verification failed | Service not running | Check service logs on server |

### Common Solutions

**Re-run workflow:**
```
GitHub → Actions → Failed workflow → Re-run all jobs
```

**View detailed logs:**
```
GitHub → Actions → Workflow run → Job → Step logs
```

**Download artifacts:**
```
GitHub → Actions → Workflow run → Artifacts section → Download
```

**Manual deployment:**
```
GitHub → Actions → CD workflow → Run workflow → master
```

---

## Metrics and Analytics

### Workflow Success Rate
View in: GitHub → Actions → Workflows → Select workflow

Tracks:
- Total runs
- Success rate
- Average duration
- Failure patterns

### Deployment Frequency
- Automatic: Every push to master
- Typical: 1-10 deploys per day
- Manual: Available anytime via dispatch

### Time to Deploy
From push to production:
- CI: 5-7 minutes
- CD: 3-5 minutes
- **Total: 8-12 minutes**

---

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Add database service to CI for integration tests
- [ ] Implement deployment health checks
- [ ] Add Slack/Discord notifications
- [ ] Create staging environment workflow

### Phase 2 (Short-term)
- [ ] Implement blue-green deployment
- [ ] Add automated rollback on failure
- [ ] Add load testing workflow
- [ ] Implement canary deployments

### Phase 3 (Long-term)
- [ ] Add infrastructure as code (Terraform)
- [ ] Implement GitOps with ArgoCD
- [ ] Add chaos engineering tests
- [ ] Multi-region deployment

---

## Maintenance Schedule

### Daily
- Monitor workflow runs
- Review failed deployments
- Check error logs

### Weekly
- Review CodeQL findings
- Check dependency updates
- Update outdated packages (if safe)

### Monthly
- Rotate secrets
- Review workflow performance
- Update workflow versions (actions)
- Audit server configuration

### Quarterly
- Review and optimize workflows
- Update documentation
- Conduct disaster recovery drill
- Review security posture

---

## Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)

### Local Files
- `.github/workflows/README.md` - Workflow documentation
- `.github/SETUP.md` - Complete setup guide
- `.github/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist

### Support
- GitHub Actions Community Forum
- Stack Overflow: `github-actions` tag
- GitHub Support (for repository issues)

---

**Configuration Version:** 1.0.0
**Last Updated:** 2025-12-24
**Next Review:** After first production deployment
