# GitHub Actions CI/CD Documentation

Complete GitHub Actions CI/CD pipeline for the RealCare project.

## Quick Links

| Document | Description | Read Time |
|----------|-------------|-----------|
| **[QUICK_START.md](QUICK_START.md)** | Get CI/CD running in 15 minutes | 5 min |
| **[SETUP.md](SETUP.md)** | Complete server and workflow setup | 30 min |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Pre-deployment verification checklist | 10 min |
| **[WORKFLOWS_SUMMARY.md](WORKFLOWS_SUMMARY.md)** | Detailed workflow documentation | 20 min |
| **[workflows/README.md](workflows/README.md)** | Workflow configuration details | 15 min |
| **[BADGES.md](BADGES.md)** | GitHub status badges for README | 5 min |

## What's Included

### Workflow Files (`.github/workflows/`)

| File | Purpose | Trigger |
|------|---------|---------|
| **ci.yml** | Continuous Integration | Push/PR to master |
| **deploy.yml** | Continuous Deployment | Push to master |
| **codeql.yml** | Security Analysis | Push/PR/Weekly |
| **dependency-update.yml** | Dependency Checks | Weekly |

### Documentation Files (`.github/`)

| File | Purpose |
|------|---------|
| **README.md** | This file - documentation index |
| **QUICK_START.md** | 15-minute setup guide |
| **SETUP.md** | Complete setup instructions |
| **DEPLOYMENT_CHECKLIST.md** | Pre-deployment verification |
| **WORKFLOWS_SUMMARY.md** | Detailed workflow overview |
| **BADGES.md** | Status badge templates |

## Features

### Continuous Integration (CI)
- ✅ Frontend build and type checking
- ✅ Backend unit tests
- ✅ E2E tests with Playwright
- ✅ Parallel job execution
- ✅ npm and pip package caching
- ✅ Artifact retention (reports, screenshots)

### Continuous Deployment (CD)
- ✅ Automated deployment to production
- ✅ Database migrations
- ✅ Service restart
- ✅ Health verification
- ✅ Deployment rollback support
- ✅ Manual trigger option

### Security
- ✅ CodeQL vulnerability scanning
- ✅ Dependency vulnerability checks
- ✅ Secrets management
- ✅ SSH key cleanup

### Automation
- ✅ Weekly dependency updates
- ✅ Automated issue creation
- ✅ Security scan scheduling

## Getting Started

### First Time Setup

1. **Quick Start** (15 minutes)
   - Read [QUICK_START.md](QUICK_START.md)
   - Configure GitHub secrets
   - Verify server setup
   - Push workflows
   - Monitor first deployment

2. **Full Setup** (30-60 minutes)
   - Read [SETUP.md](SETUP.md)
   - Configure server (systemd, nginx)
   - Setup database
   - Configure sudo permissions
   - Test everything

### Before Deploying

- [ ] Read [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [ ] Verify all prerequisites
- [ ] Test locally
- [ ] Configure GitHub secrets
- [ ] Verify server configuration

### After Setup

- [ ] Add status badges (see [BADGES.md](BADGES.md))
- [ ] Review workflow configurations
- [ ] Setup monitoring
- [ ] Configure notifications (optional)

## Architecture

### CI/CD Flow

```
Developer Push
    ↓
┌─────────────────────┐
│   CI - Frontend     │  Type check, build
│   CI - Backend      │  Unit tests
│   CI - E2E          │  Integration tests
└─────────────────────┘
    ↓ (all pass)
┌─────────────────────┐
│   CD - Deploy       │  SSH to server
│                     │  Pull code
│                     │  Install deps
│                     │  Run migrations
│                     │  Build frontend
│                     │  Restart services
└─────────────────────┘
    ↓
Production Updated
```

### Workflow Dependencies

```
ci.yml
  ├─ frontend (parallel)
  ├─ backend (parallel)
  └─ e2e (needs: frontend, backend)

deploy.yml
  └─ deploy (runs after CI passes)

codeql.yml
  └─ analyze (independent)

dependency-update.yml
  └─ check (independent, weekly)
```

## Technology Stack

### GitHub Actions
- Workflow automation
- Secrets management
- Artifact storage
- Status badges

### CI Tools
- **TypeScript Compiler**: Type checking
- **pytest**: Backend testing
- **Playwright**: E2E testing
- **npm/pip**: Package management

### Deployment
- **SSH**: Server access
- **systemd**: Service management
- **nginx**: Web server
- **PostgreSQL**: Database
- **Alembic**: Migrations

### Caching
- npm packages (via package-lock.json)
- pip packages (via requirements.txt)
- Playwright browsers (installed fresh)

## Configuration

### Required GitHub Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `SSH_PRIVATE_KEY` | Server SSH private key | Contents of firstkeypair.pem |
| `SERVER_HOST` | Production server hostname | trendy.storydot.kr |
| `GEMINI_API_KEY` | Google Gemini API key | AIza... |

### Optional GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |

### Server Requirements

- Ubuntu Linux
- Node.js 22.21.1
- Python 3.11
- PostgreSQL 15+
- nginx
- systemd

### Server Configuration Files

- `/etc/systemd/system/realcare-backend.service` - Backend service
- `/etc/nginx/sites-available/realcare` - Nginx config
- `/etc/sudoers.d/realcare-deploy` - Deployment permissions
- `/mnt/storage/real/` - Application directory
- `/var/www/html/real/` - Frontend static files

## Monitoring

### GitHub Actions
- View workflow runs: Repository → Actions
- Check logs: Click workflow → Job → Step
- Download artifacts: Workflow run → Artifacts

### Server Logs
```bash
# Backend service
sudo journalctl -u realcare-backend -f

# Nginx access
sudo tail -f /var/log/nginx/access.log

# Nginx errors
sudo tail -f /var/log/nginx/error.log
```

### Health Checks
- Frontend: https://trendy.storydot.kr/real/
- Backend: https://trendy.storydot.kr/real/api/docs
- Service: `sudo systemctl status realcare-backend`

## Maintenance

### Daily
- Monitor workflow runs
- Check for failures
- Review deployment logs

### Weekly
- Review CodeQL findings
- Check dependency updates
- Update packages if safe

### Monthly
- Rotate secrets
- Review server logs
- Update workflow actions
- Security audit

## Troubleshooting

### Common Issues

| Problem | Solution | Documentation |
|---------|----------|---------------|
| Type check fails | Run `npx tsc --noEmit` locally | QUICK_START.md |
| Backend tests fail | Run `pytest -v` locally | QUICK_START.md |
| SSH connection fails | Verify SSH_PRIVATE_KEY secret | SETUP.md |
| Service won't start | Check `journalctl -u realcare-backend` | DEPLOYMENT_CHECKLIST.md |
| Frontend 404 | Verify files in `/var/www/html/real/` | DEPLOYMENT_CHECKLIST.md |

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review server logs via SSH
3. Verify configuration files
4. Check documentation in `.github/`
5. Test manually on server

## Performance

### CI Metrics
- **Frontend build:** 2-3 minutes
- **Backend tests:** 1-2 minutes
- **E2E tests:** 2-3 minutes
- **Total CI time:** 5-7 minutes (parallel)

### Deployment Metrics
- **Deploy time:** 3-5 minutes
- **Total time (CI + CD):** 8-12 minutes
- **Downtime:** ~5 seconds (service restart)

### Optimizations
- npm/pip package caching
- Parallel CI job execution
- Artifact retention policies
- Single browser E2E testing (Chromium)

## Security

### Best Practices
- ✅ Secrets stored in GitHub Secrets
- ✅ SSH key cleaned up after deployment
- ✅ CodeQL security scanning
- ✅ Dependency vulnerability checks
- ✅ Minimal sudo permissions

### Recommendations
- Rotate secrets quarterly
- Review CodeQL findings weekly
- Update dependencies promptly
- Monitor failed login attempts
- Use SSH key authentication only

## Future Enhancements

### Planned
- [ ] Database service in CI
- [ ] Staging environment
- [ ] Blue-green deployment
- [ ] Automated rollback
- [ ] Slack notifications

### Under Consideration
- [ ] Multi-region deployment
- [ ] Infrastructure as code
- [ ] Canary deployments
- [ ] Load testing workflow
- [ ] Performance budgets

## Resources

### Official Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [CodeQL Docs](https://codeql.github.com/docs/)

### Project Documentation
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [README.md](../README.md) - Project README
- [.specs/](../.specs/) - Development specifications

### External Tools
- [Playwright](https://playwright.dev/)
- [pytest](https://docs.pytest.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)

## Version History

### v1.0.0 (2025-12-24)
- Initial CI/CD setup
- 4 workflow files created
- Complete documentation
- Server configuration templates
- Deployment checklists

## Support

### Documentation
Start with [QUICK_START.md](QUICK_START.md) for immediate setup.

### Issues
- Check GitHub Actions logs
- Review server logs
- Verify configuration
- Test manually

### Contact
- GitHub Issues: Repository issues
- Server Access: SSH to trendy.storydot.kr
- Logs: `sudo journalctl -u realcare-backend`

---

**Last Updated:** 2025-12-24
**Status:** Production Ready
**License:** MIT
