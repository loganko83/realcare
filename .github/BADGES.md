# GitHub Actions Status Badges

Add these badges to your project README.md to display workflow status.

## Basic Badges

Copy and paste these into your `README.md` file:

```markdown
![CI](https://github.com/YOUR_USERNAME/real/workflows/CI%20-%20Continuous%20Integration/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/real/workflows/CD%20-%20Continuous%20Deployment/badge.svg)
![CodeQL](https://github.com/YOUR_USERNAME/real/workflows/CodeQL%20Security%20Analysis/badge.svg)
```

**Replace `YOUR_USERNAME` with your actual GitHub username.**

## Advanced Badges with Links

```markdown
[![CI](https://github.com/YOUR_USERNAME/real/workflows/CI%20-%20Continuous%20Integration/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/real/workflows/CD%20-%20Continuous%20Deployment/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/YOUR_USERNAME/real/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/codeql.yml)
```

## Branch-Specific Badges

To show status for a specific branch (e.g., master):

```markdown
![CI](https://github.com/YOUR_USERNAME/real/workflows/CI%20-%20Continuous%20Integration/badge.svg?branch=master)
![Deploy](https://github.com/YOUR_USERNAME/real/workflows/CD%20-%20Continuous%20Deployment/badge.svg?branch=master)
```

## Custom Badge Styles

Using shields.io for more customization:

```markdown
![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/real/ci.yml?label=CI&style=flat-square)
![Deploy](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/real/deploy.yml?label=Deploy&style=flat-square)
```

Available styles:
- `flat` (default)
- `flat-square`
- `plastic`
- `for-the-badge`
- `social`

## Complete README Header Example

```markdown
# RealCare - Korean Real Estate Service

[![CI](https://github.com/YOUR_USERNAME/real/workflows/CI%20-%20Continuous%20Integration/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/real/workflows/CD%20-%20Continuous%20Deployment/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/YOUR_USERNAME/real/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/YOUR_USERNAME/real/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI-powered Korean real estate care platform with contract analysis, financial feasibility checks, and blockchain verification.

[Demo](https://trendy.storydot.kr/real/) | [API Docs](https://trendy.storydot.kr/real/api/docs) | [Documentation](#)
```

## Additional Badges

### Code Coverage
```markdown
![Coverage](https://img.shields.io/codecov/c/github/YOUR_USERNAME/real)
```

### License
```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
```

### Node Version
```markdown
![Node](https://img.shields.io/badge/node-22.21.1-green.svg)
```

### Python Version
```markdown
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
```

### Tech Stack
```markdown
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)
```

## Combined Tech Stack Badge Example

```markdown
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)
```

## Status Colors

GitHub Actions badges automatically show:
- 🟢 Green: Success
- 🔴 Red: Failure
- 🟡 Yellow: In Progress
- ⚪ Gray: No runs yet

## Preview

Before committing, preview your badges by:
1. Adding them to README.md
2. Replacing `YOUR_USERNAME` with your actual username
3. Viewing the file on GitHub

## Notes

- Badges update automatically when workflows run
- First workflow run is needed before badges appear
- Badge URLs are case-sensitive
- Use URL encoding for spaces: `%20`

## Troubleshooting

### Badge shows "no status"
- Workflow hasn't run yet
- Workflow name doesn't match badge URL
- Repository is private (badges may not work)

### Badge not updating
- Clear browser cache
- Check workflow name matches exactly
- Verify workflow has run successfully

### Badge shows 404
- Check repository name is correct
- Verify workflow file exists in `.github/workflows/`
- Ensure workflow name matches badge URL
