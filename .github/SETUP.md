# GitHub Actions Setup Guide

This guide will help you set up GitHub Actions CI/CD for the RealCare project.

## Prerequisites

- GitHub repository with admin access
- AWS EC2 server running Ubuntu with SSH access
- Domain: trendy.storydot.kr pointing to the server
- Gemini API key for AI features

## Step-by-Step Setup

### 1. Configure GitHub Secrets

Navigate to your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

#### Required Secrets

**SSH_PRIVATE_KEY**
```bash
# On your local machine, copy the contents of your SSH private key
cat C:\server\firstkeypair.pem
# Or on Linux/Mac
cat /path/to/firstkeypair.pem

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# [key content]
# -----END RSA PRIVATE KEY-----

# Paste into GitHub secret value field
```

**SERVER_HOST**
```
trendy.storydot.kr
```

**GEMINI_API_KEY**
```
# Your Google Gemini API key
AIza...
```

#### Optional Secrets

**VITE_SENTRY_DSN**
```
# Your Sentry DSN for error tracking (if using Sentry)
https://...@sentry.io/...
```

---

### 2. Server Configuration

#### 2.1. Create Backend systemd Service

SSH into your server:
```bash
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr
```

Create the service file:
```bash
sudo nano /etc/systemd/system/realcare-backend.service
```

Paste this configuration:
```ini
[Unit]
Description=RealCare FastAPI Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/mnt/storage/real/backend
Environment="PATH=/mnt/storage/real/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="DATABASE_URL=postgresql+asyncpg://realcare:realcare@localhost:5432/realcare"
Environment="SECRET_KEY=your-production-secret-key"
Environment="GEMINI_API_KEY=your-gemini-api-key"
ExecStart=/mnt/storage/real/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8092 --workers 4
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable realcare-backend
sudo systemctl start realcare-backend
sudo systemctl status realcare-backend
```

#### 2.2. Configure Nginx

Create nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/realcare
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name trendy.storydot.kr;

    # Frontend - React SPA
    location /real/ {
        alias /var/www/html/real/;
        try_files $uri $uri/ /real/index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /real/api/ {
        proxy_pass http://localhost:8092/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

Enable the site and reload nginx:
```bash
sudo ln -s /etc/nginx/sites-available/realcare /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

#### 2.3. Create Web Directory

```bash
sudo mkdir -p /var/www/html/real
sudo chown -R ubuntu:ubuntu /var/www/html/real
chmod 755 /var/www/html/real
```

#### 2.4. Configure Sudo Permissions

Create a sudoers file for deployment:
```bash
sudo visudo -f /etc/sudoers.d/realcare-deploy
```

Add these lines:
```
# Allow ubuntu user to restart services without password
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart realcare-backend
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl status realcare-backend
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl status nginx

# Allow copying to web directory
ubuntu ALL=(ALL) NOPASSWD: /bin/cp -r * /var/www/html/real/*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/rsync -av * /var/www/html/real/*
```

Set correct permissions:
```bash
sudo chmod 440 /etc/sudoers.d/realcare-deploy
```

#### 2.5. Setup Git Repository on Server

```bash
cd /mnt/storage
git clone https://github.com/YOUR_USERNAME/real.git
cd real

# Configure git credentials for pull access
git config credential.helper store
# Do a pull and enter credentials once
git pull
```

#### 2.6. Setup Python Virtual Environment

```bash
cd /mnt/storage/real/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.7. Setup Database

```bash
# Install PostgreSQL if not already installed
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE USER realcare WITH PASSWORD 'realcare';
CREATE DATABASE realcare OWNER realcare;
GRANT ALL PRIVILEGES ON DATABASE realcare TO realcare;
EOF

# Run migrations
cd /mnt/storage/real/backend
source venv/bin/activate
alembic upgrade head
```

---

### 3. Verify Setup

#### 3.1. Test Backend Service

```bash
# Check service status
sudo systemctl status realcare-backend

# Check logs
sudo journalctl -u realcare-backend -n 50 --no-pager

# Test API endpoint
curl http://localhost:8092/api/docs
```

#### 3.2. Test Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Test frontend
curl https://trendy.storydot.kr/real/

# Test backend through nginx
curl https://trendy.storydot.kr/real/api/docs
```

#### 3.3. Test Sudo Permissions

```bash
# Test service restart
sudo systemctl restart realcare-backend
echo $?  # Should output 0

# Test nginx reload
sudo systemctl reload nginx
echo $?  # Should output 0
```

---

### 4. Enable GitHub Actions

1. Push the `.github/workflows` directory to your repository:
```bash
cd C:\dev\real
git add .github/
git commit -m "Add GitHub Actions CI/CD workflows"
git push origin master
```

2. Go to your GitHub repository → **Actions** tab
3. You should see the workflows listed:
   - CI - Continuous Integration
   - CD - Continuous Deployment
   - CodeQL Security Analysis
   - Dependency Updates

4. The first deployment will run automatically on the next push to master

---

### 5. Monitor First Deployment

#### 5.1. Watch GitHub Actions

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Monitor each job's progress
4. Check logs if any step fails

#### 5.2. Watch Server Logs

SSH into server and monitor:
```bash
# Terminal 1: Backend logs
sudo journalctl -u realcare-backend -f

# Terminal 2: Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Terminal 3: Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

### 6. Troubleshooting

#### CI Workflow Fails

**Error: Type check failed**
```bash
# Run locally to see errors
npx tsc --noEmit
```

**Error: Backend tests fail**
```bash
# Run tests locally
cd backend
pytest -v
```

**Error: E2E tests fail**
```bash
# Run locally
npx playwright test --ui
```

#### Deployment Fails

**Error: SSH connection failed**
- Verify SSH_PRIVATE_KEY secret is correctly set (including BEGIN/END lines)
- Check server SSH daemon: `sudo systemctl status ssh`
- Check firewall: `sudo ufw status`

**Error: Git pull fails**
- Verify git credentials on server
- Test manually: `ssh ubuntu@trendy.storydot.kr "cd /mnt/storage/real && git pull"`

**Error: Service restart fails**
- Check sudo permissions: `sudo -l`
- Verify service exists: `sudo systemctl list-unit-files | grep realcare`
- Check service status: `sudo systemctl status realcare-backend`

**Error: Build fails**
- Check if GEMINI_API_KEY secret is set
- Verify node_modules are installing correctly
- Check disk space on server: `df -h`

---

### 7. Post-Setup Tasks

#### 7.1. Setup SSL Certificate (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d trendy.storydot.kr

# Auto-renewal is configured by default
# Test renewal
sudo certbot renew --dry-run
```

#### 7.2. Setup Monitoring (Optional)

Consider adding:
- **Sentry** for error tracking (already supported, just add secret)
- **Uptime monitoring** (UptimeRobot, Pingdom)
- **Log aggregation** (Papertrail, Logtail)
- **Performance monitoring** (New Relic, DataDog)

#### 7.3. Setup Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/realcare-backup.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/mnt/storage/backups/realcare"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump realcare > $BACKUP_DIR/db_$DATE.sql

# Backup code (optional, already in git)
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /mnt/storage/real

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/realcare-backup.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/realcare-backup.sh
```

---

### 8. Usage

#### Automatic Deployment

Simply push to master branch:
```bash
git add .
git commit -m "Your changes"
git push origin master
```

GitHub Actions will automatically:
1. Run CI tests (frontend, backend, E2E)
2. Deploy to production if tests pass
3. Verify deployment health

#### Manual Deployment

1. Go to GitHub → **Actions** tab
2. Select "CD - Continuous Deployment"
3. Click "Run workflow"
4. Select `master` branch
5. Click "Run workflow" button

---

### 9. Best Practices

1. **Always test locally before pushing**
   - Run type check: `npx tsc --noEmit`
   - Run backend tests: `cd backend && pytest`
   - Run E2E tests: `npx playwright test`

2. **Monitor deployments**
   - Watch GitHub Actions logs
   - Monitor server logs during deployment
   - Verify health endpoints after deployment

3. **Use feature branches**
   - Create branch: `git checkout -b feature/your-feature`
   - Push and create PR
   - CI will run on PR
   - Merge to master to deploy

4. **Review dependency updates**
   - Check weekly dependency update issues
   - Test updates locally before merging
   - Update incrementally, not all at once

5. **Security**
   - Rotate secrets regularly
   - Keep server packages updated: `sudo apt update && sudo apt upgrade`
   - Monitor security advisories
   - Review CodeQL findings weekly

---

## Status Badges

Add these to your README.md to show build status:

```markdown
![CI](https://github.com/YOUR_USERNAME/real/workflows/CI%20-%20Continuous%20Integration/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/real/workflows/CD%20-%20Continuous%20Deployment/badge.svg)
![CodeQL](https://github.com/YOUR_USERNAME/real/workflows/CodeQL%20Security%20Analysis/badge.svg)
```

---

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this setup guide
3. Check server logs: `sudo journalctl -u realcare-backend`
4. Test endpoints manually with curl
5. Verify nginx configuration: `sudo nginx -t`
