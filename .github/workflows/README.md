# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for the RealCare project.

## Workflows

### 1. CI - Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `master` branch
- Pull requests targeting `master` branch

**Jobs:**

#### Frontend Job
- Runs on: Ubuntu latest
- Node version: 22.21.1 (matches project Volta configuration)
- Steps:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies (`npm ci`)
  4. Type check with TypeScript
  5. Build frontend
  6. Upload build artifacts for downstream jobs

#### Backend Job
- Runs on: Ubuntu latest
- Python version: 3.11
- Steps:
  1. Checkout code
  2. Setup Python with pip caching
  3. Install dependencies from `requirements.txt`
  4. Run pytest (unit tests only, skips DB integration tests)

**Note:** Database integration tests are skipped in CI because they require a PostgreSQL instance. Tests are run with `SKIP_DB_TESTS=true` environment variable.

#### E2E Job
- Runs on: Ubuntu latest
- Depends on: Frontend and Backend jobs must pass
- Steps:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies
  4. Install Playwright browsers (Chromium only for CI performance)
  5. Run Playwright E2E tests against production URL
  6. Upload test reports and screenshots on failure

**Caching Strategy:**
- npm packages: Cached by `actions/setup-node@v4`
- pip packages: Cached by `actions/setup-python@v5`
- Playwright browsers: Installed fresh each run (small overhead, ensures latest browser)

---

### 2. CD - Continuous Deployment (`deploy.yml`)

**Triggers:**
- Push to `master` branch (automatically after CI passes)
- Manual trigger via `workflow_dispatch`

**Jobs:**

#### Deploy Job
- Runs on: Ubuntu latest
- Steps:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies
  4. Build frontend with production environment variables
  5. Setup SSH key for server access
  6. Deploy to production server:
     - SSH into server
     - Navigate to `/mnt/storage/real`
     - Pull latest code from GitHub
     - Install/update backend dependencies
     - Run Alembic database migrations
     - Restart backend service (`realcare-backend`)
     - Build frontend
     - Copy built files to nginx directory
     - Reload nginx
  7. Verify deployment by checking service endpoints
  8. Cleanup SSH key

**Security Notes:**
- SSH key is stored as GitHub secret and cleaned up after use
- Backend service restart requires sudo privileges
- Nginx reload requires sudo privileges

---

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | Contents of `firstkeypair.pem` |
| `SERVER_HOST` | Production server hostname | `trendy.storydot.kr` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |

---

## Server Configuration Requirements

### 1. Backend Service (systemd)

The deployment expects a systemd service named `realcare-backend`:

```bash
# /etc/systemd/system/realcare-backend.service
[Unit]
Description=RealCare FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/mnt/storage/real/backend
Environment="PATH=/mnt/storage/real/backend/venv/bin"
ExecStart=/mnt/storage/real/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8092
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable realcare-backend
sudo systemctl start realcare-backend
```

### 2. Nginx Configuration

Frontend files should be served from `/var/www/html/real/`:

```nginx
# /etc/nginx/sites-available/realcare
server {
    listen 80;
    server_name trendy.storydot.kr;

    location /real/ {
        alias /var/www/html/real/;
        try_files $uri $uri/ /real/index.html;
    }

    location /real/api/ {
        proxy_pass http://localhost:8092/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Sudo Permissions

The `ubuntu` user needs sudo permissions for service management:

```bash
# /etc/sudoers.d/realcare-deploy
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart realcare-backend
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
ubuntu ALL=(ALL) NOPASSWD: /bin/cp -r * /var/www/html/real/
```

### 4. SSH Key Setup

Add the deployment SSH public key to server's authorized_keys:

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## Workflow Optimization

### Caching Strategy

1. **npm packages:** Automatically cached by `actions/setup-node@v4` using `package-lock.json` hash
2. **pip packages:** Automatically cached by `actions/setup-python@v5` using `requirements.txt` hash
3. **Playwright browsers:** Installed fresh each run (ensures compatibility, small overhead ~30s)

### Performance Tips

- CI runs take approximately 5-7 minutes
- Deploy takes approximately 3-5 minutes
- E2E tests are the longest step (2-3 minutes)
- Parallel jobs reduce overall CI time

### Future Improvements

1. Add database service to CI for integration tests
2. Implement blue-green deployment strategy
3. Add deployment rollback mechanism
4. Add Slack/Discord notifications for deployment status
5. Implement staging environment workflow
6. Add security scanning (SAST/DAST)
7. Add dependency vulnerability scanning

---

## Troubleshooting

### CI Failures

**Frontend type check fails:**
- Check for TypeScript errors locally: `npx tsc --noEmit`
- Ensure all dependencies are properly installed

**Backend tests fail:**
- Run tests locally: `cd backend && pytest -v`
- Check if any tests require database (should be skipped in CI)

**E2E tests fail:**
- Check Playwright report artifacts
- View screenshots in test-results artifacts
- Ensure production site is accessible

### Deployment Failures

**SSH connection fails:**
- Verify `SSH_PRIVATE_KEY` secret is correctly set
- Check server firewall allows GitHub Actions IPs
- Verify server SSH daemon is running

**Build fails:**
- Check `GEMINI_API_KEY` secret is set
- Verify all dependencies are in `package.json`

**Service restart fails:**
- Check sudo permissions on server
- Verify systemd service exists and is enabled
- Check service logs: `sudo journalctl -u realcare-backend -n 50`

**Nginx reload fails:**
- Check nginx configuration syntax: `sudo nginx -t`
- Verify nginx is running: `sudo systemctl status nginx`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

## Manual Deployment

If you need to deploy manually without pushing to master:

1. Go to Actions tab in GitHub
2. Select "CD - Continuous Deployment" workflow
3. Click "Run workflow" dropdown
4. Select `master` branch
5. Click "Run workflow" button

---

## Monitoring

After deployment, verify:

1. Frontend: https://trendy.storydot.kr/real/
2. Backend API docs: https://trendy.storydot.kr/real/api/docs
3. Backend health: `curl https://trendy.storydot.kr/real/api/`

Check logs:
```bash
# Backend service logs
sudo journalctl -u realcare-backend -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```
