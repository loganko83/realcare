# Quick Start - GitHub Actions CI/CD

Get your CI/CD pipeline running in 15 minutes.

## Prerequisites Checklist

- [ ] GitHub repository exists
- [ ] Server running at trendy.storydot.kr
- [ ] SSH access to server (firstkeypair.pem)
- [ ] Gemini API key

## Step 1: Configure GitHub Secrets (5 minutes)

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

### 1. SSH_PRIVATE_KEY
```bash
# Copy your private key content
cat C:\server\firstkeypair.pem

# Paste the entire output (including BEGIN/END lines)
```

### 2. SERVER_HOST
```
trendy.storydot.kr
```

### 3. GEMINI_API_KEY
```
# Your API key
AIza...
```

## Step 2: Verify Server Setup (5 minutes)

SSH into server:
```bash
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr
```

Check these items:

```bash
# 1. Project directory exists
ls /mnt/storage/real
# Should show: backend, src, package.json, etc.

# 2. Backend service exists
sudo systemctl status realcare-backend
# Should show: active (running)

# 3. Nginx is configured
sudo nginx -t
# Should show: test is successful

# 4. Web directory exists
ls /var/www/html/real
# Should exist (even if empty)

# 5. Sudo permissions work
sudo systemctl restart realcare-backend
# Should work without password prompt
```

If any checks fail, see **SETUP.md** for detailed configuration.

## Step 3: Push Workflows (2 minutes)

```bash
# From your local machine
cd C:\dev\real

# Add workflow files
git add .github/

# Commit
git commit -m "Add GitHub Actions CI/CD workflows"

# Push to trigger first run
git push origin master
```

## Step 4: Monitor First Run (3 minutes)

1. Go to: **GitHub → Actions tab**
2. You should see two workflows running:
   - "CI - Continuous Integration"
   - "CD - Continuous Deployment"

3. Click on each to watch progress

### Expected Timeline
- **0-2 min:** Frontend and Backend jobs start
- **2-4 min:** E2E tests start
- **4-7 min:** CI completes
- **7-10 min:** Deployment starts
- **10-12 min:** Deployment completes

## Step 5: Verify Deployment (1 minute)

Check these URLs:

### Frontend
```
https://trendy.storydot.kr/real/
```
Should show: RealCare homepage

### Backend API
```
https://trendy.storydot.kr/real/api/docs
```
Should show: FastAPI Swagger documentation

### Server Logs
```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Check backend service
sudo systemctl status realcare-backend
# Should show: active (running)

# View recent logs
sudo journalctl -u realcare-backend -n 20
# Should show no errors
```

## Success Criteria

✅ **You're done when:**
- [ ] CI workflow shows green checkmark
- [ ] Deploy workflow shows green checkmark
- [ ] Frontend loads at https://trendy.storydot.kr/real/
- [ ] Backend API docs accessible
- [ ] No errors in server logs

## Troubleshooting

### Problem: CI fails with "Type check failed"
**Solution:**
```bash
# Run locally to see errors
npx tsc --noEmit
# Fix TypeScript errors and push again
```

### Problem: Deploy fails with "SSH connection refused"
**Solution:**
1. Verify SSH_PRIVATE_KEY secret is correctly set (include BEGIN/END lines)
2. Check server is accessible: `ping trendy.storydot.kr`
3. Try manual SSH: `ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr`

### Problem: Deploy fails with "Permission denied"
**Solution:**
```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Check sudo permissions
sudo -l

# Should show:
# ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart realcare-backend
# ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx

# If not, run:
sudo visudo -f /etc/sudoers.d/realcare-deploy
# Add the required permissions (see SETUP.md)
```

### Problem: Service won't start after deployment
**Solution:**
```bash
# Check service status
sudo systemctl status realcare-backend

# View detailed logs
sudo journalctl -u realcare-backend -n 50

# Common fixes:
# - Check environment variables in service file
# - Verify database is running
# - Check port 8092 is not in use
```

### Problem: Frontend shows 404
**Solution:**
```bash
# Check if files were deployed
ls -la /var/www/html/real/

# Should show: index.html, assets/, etc.

# If empty, check deployment logs in GitHub Actions
# May need to manually copy files:
cd /mnt/storage/real
npm run build
sudo cp -r dist/* /var/www/html/real/
```

## Next Steps

### Add Status Badges
See **BADGES.md** for README badges.

### Setup Monitoring
- Add error tracking (Sentry)
- Setup uptime monitoring
- Configure log aggregation

### Review Documentation
- **SETUP.md** - Complete setup guide
- **workflows/README.md** - Workflow details
- **WORKFLOWS_SUMMARY.md** - Complete overview
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checks

## Daily Usage

### Normal Development Flow
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin master

# CI/CD runs automatically
# Check progress: GitHub → Actions
# Changes live in ~10 minutes
```

### Manual Deployment
```bash
# If you need to deploy without code changes
# GitHub → Actions → CD workflow → Run workflow
```

### Rollback
```bash
# If deployment causes issues
git revert HEAD
git push origin master
# Or manually: see DEPLOYMENT_CHECKLIST.md
```

## Help

### Quick Links
- **GitHub Actions Status:** https://github.com/YOUR_USERNAME/real/actions
- **Production Site:** https://trendy.storydot.kr/real/
- **API Docs:** https://trendy.storydot.kr/real/api/docs

### Documentation
- All documentation in `.github/` directory
- Start with `SETUP.md` for detailed guides
- Check `DEPLOYMENT_CHECKLIST.md` before first deploy

### Support
- Check workflow logs in GitHub Actions
- Review server logs: `sudo journalctl -u realcare-backend`
- Test manually: `ssh ubuntu@trendy.storydot.kr`

---

**Time to Complete:** ~15 minutes
**Total Files Created:** 9 files (4 workflows + 5 documentation)
**Ready for Production:** Yes
