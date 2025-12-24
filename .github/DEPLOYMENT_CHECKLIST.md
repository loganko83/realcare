# Deployment Checklist

Use this checklist to verify your GitHub Actions CI/CD setup is complete.

## Pre-Deployment Checklist

### GitHub Repository Configuration

- [ ] Repository exists and code is pushed
- [ ] Branch protection rules configured (optional)
- [ ] `.github/workflows/` directory exists with workflow files
- [ ] All workflow files are valid YAML (no syntax errors)

### GitHub Secrets Configuration

Required secrets (Settings → Secrets → Actions):

- [ ] `SSH_PRIVATE_KEY` - Contains full private key including BEGIN/END lines
- [ ] `SERVER_HOST` - Set to `trendy.storydot.kr`
- [ ] `GEMINI_API_KEY` - Valid Gemini API key for AI features

Optional secrets:

- [ ] `VITE_SENTRY_DSN` - For error tracking (if using Sentry)

### Server Configuration

#### Directory Structure
- [ ] `/mnt/storage/real` directory exists
- [ ] Git repository cloned to `/mnt/storage/real`
- [ ] `/var/www/html/real` directory exists
- [ ] Ubuntu user owns `/var/www/html/real`

#### Backend Setup
- [ ] Python 3.11 installed
- [ ] Virtual environment created at `/mnt/storage/real/backend/venv`
- [ ] Requirements installed: `pip install -r requirements.txt`
- [ ] PostgreSQL installed and running
- [ ] Database `realcare` created
- [ ] Database user `realcare` created with password
- [ ] Alembic migrations run: `alembic upgrade head`

#### systemd Service
- [ ] Service file exists: `/etc/systemd/system/realcare-backend.service`
- [ ] Service enabled: `sudo systemctl enable realcare-backend`
- [ ] Service running: `sudo systemctl status realcare-backend`
- [ ] Service accessible: `curl http://localhost:8092/api/docs`

#### Nginx Configuration
- [ ] Nginx installed
- [ ] Config file exists: `/etc/nginx/sites-available/realcare`
- [ ] Config symlinked to `/etc/nginx/sites-enabled/`
- [ ] Configuration valid: `sudo nginx -t`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Frontend accessible: `curl https://trendy.storydot.kr/real/`
- [ ] Backend proxied: `curl https://trendy.storydot.kr/real/api/docs`

#### Sudo Permissions
- [ ] Sudoers file created: `/etc/sudoers.d/realcare-deploy`
- [ ] Permissions set to 440: `ls -l /etc/sudoers.d/realcare-deploy`
- [ ] Can restart backend: `sudo systemctl restart realcare-backend` (no password)
- [ ] Can reload nginx: `sudo systemctl reload nginx` (no password)

#### SSH Access
- [ ] SSH daemon running
- [ ] Key-based authentication working
- [ ] Can SSH from external: `ssh -i key.pem ubuntu@trendy.storydot.kr`
- [ ] Git credentials configured for pulling

## First Deployment

### Pre-Push Verification

Run these locally before pushing:

```bash
# Frontend type check
npx tsc --noEmit
# Expected: No errors

# Frontend build
npm run build
# Expected: Build succeeds, dist/ directory created

# Backend tests
cd backend
pytest -v
# Expected: All tests pass

# E2E tests (optional, against production)
npx playwright test
# Expected: All tests pass
```

### Push and Monitor

- [ ] Commit workflow files: `git add .github/ && git commit -m "Add CI/CD workflows"`
- [ ] Push to master: `git push origin master`
- [ ] Go to GitHub → Actions tab
- [ ] Watch CI workflow run
- [ ] Verify all jobs pass (Frontend, Backend, E2E)
- [ ] Watch CD workflow run (triggers after CI)
- [ ] Monitor deployment logs

### Post-Deployment Verification

#### Backend Health
```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Check service status
sudo systemctl status realcare-backend

# Check logs for errors
sudo journalctl -u realcare-backend -n 50

# Test API locally
curl http://localhost:8092/api/docs

# Expected: API docs HTML response
```

#### Frontend Health
```bash
# From anywhere
curl https://trendy.storydot.kr/real/
# Expected: HTML with React app

curl -I https://trendy.storydot.kr/real/
# Expected: 200 OK

# Check specific assets
curl https://trendy.storydot.kr/real/assets/index.js
# Expected: JavaScript bundle (or 404 if hash-based filename)
```

#### Nginx Logs
```bash
# Access logs - should show deployment activity
sudo tail -n 20 /var/log/nginx/access.log

# Error logs - should be empty or minimal
sudo tail -n 20 /var/log/nginx/error.log
```

#### Application Functionality
- [ ] Visit https://trendy.storydot.kr/real/
- [ ] Homepage loads without errors
- [ ] Navigation works (check browser console)
- [ ] API calls work (check Network tab)
- [ ] Login functionality works
- [ ] Contract analysis works (tests Gemini API)
- [ ] Reality check calculator works

## Ongoing Monitoring

### Daily
- [ ] Check GitHub Actions for failed workflows
- [ ] Review deployment logs for any issues

### Weekly
- [ ] Review CodeQL security findings
- [ ] Check dependency update issues
- [ ] Review server logs: `sudo journalctl -u realcare-backend --since "1 week ago"`
- [ ] Verify disk space: `df -h`

### Monthly
- [ ] Update dependencies if security issues found
- [ ] Review and rotate secrets if needed
- [ ] Check SSL certificate expiration (if using certbot, auto-renews)
- [ ] Review backup integrity

## Rollback Procedure

If deployment causes issues:

### Option 1: Quick Rollback via Git
```bash
# On server
cd /mnt/storage/real
git log --oneline -5  # Find previous working commit
git checkout <commit-hash>
npm ci && npm run build
sudo cp -r dist/* /var/www/html/real/
sudo systemctl restart realcare-backend
```

### Option 2: Revert Commit and Redeploy
```bash
# Locally
git revert <bad-commit-hash>
git push origin master
# CI/CD will automatically deploy the revert
```

### Option 3: Manual Deployment
```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Navigate to project
cd /mnt/storage/real

# Pull specific working version
git fetch --all
git checkout <working-commit>

# Rebuild and restart
npm ci
npm run build
sudo cp -r dist/* /var/www/html/real/

cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart realcare-backend

# Reload nginx
sudo systemctl reload nginx
```

## Emergency Contacts

**Server Access:**
- SSH Key: `C:\server\firstkeypair.pem`
- Server: `ubuntu@trendy.storydot.kr`
- Location: `/mnt/storage/real`

**Service Management:**
```bash
# Stop service
sudo systemctl stop realcare-backend

# Start service
sudo systemctl start realcare-backend

# Restart service
sudo systemctl restart realcare-backend

# View logs
sudo journalctl -u realcare-backend -f
```

**Nginx Management:**
```bash
# Test config
sudo nginx -t

# Reload (graceful)
sudo systemctl reload nginx

# Restart (harder)
sudo systemctl restart nginx

# View error log
sudo tail -f /var/log/nginx/error.log
```

## Common Issues

### Issue: CI fails with "Type check failed"
**Solution:**
```bash
npx tsc --noEmit
# Fix TypeScript errors shown
```

### Issue: Backend tests fail in CI
**Solution:**
- Tests may require database integration
- Verify tests work locally: `cd backend && pytest -v`
- Check if tests are properly marked to skip in CI

### Issue: E2E tests fail
**Solution:**
- Check if production site is accessible
- Review Playwright screenshots in artifacts
- Run locally: `npx playwright test --ui`

### Issue: Deployment hangs on "Deploy to server"
**Solution:**
- Check SSH_PRIVATE_KEY secret is correct
- Verify server is accessible
- Check server disk space: `df -h`

### Issue: "Permission denied" during deployment
**Solution:**
- Verify sudo permissions: `sudo -l`
- Check `/etc/sudoers.d/realcare-deploy` exists and has correct permissions

### Issue: Service won't start after deployment
**Solution:**
```bash
# Check service status
sudo systemctl status realcare-backend

# View detailed logs
sudo journalctl -u realcare-backend -n 100

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port already in use
# - Python dependency issues
```

### Issue: Frontend shows 404
**Solution:**
```bash
# Check if files were copied
ls -la /var/www/html/real/

# Check nginx configuration
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify nginx is running
sudo systemctl status nginx
```

## Success Criteria

Your CI/CD is working correctly when:

1. ✅ Push to master triggers CI workflow
2. ✅ All CI jobs pass (Frontend, Backend, E2E)
3. ✅ CD workflow triggers automatically after CI
4. ✅ Deployment completes without errors
5. ✅ Frontend is accessible at https://trendy.storydot.kr/real/
6. ✅ Backend API is accessible at https://trendy.storydot.kr/real/api/docs
7. ✅ Application functions correctly
8. ✅ Logs show no errors
9. ✅ Service restarts successfully
10. ✅ Changes are visible immediately after deployment

---

**Last Updated:** 2025-12-24
**Next Review:** After first successful deployment
