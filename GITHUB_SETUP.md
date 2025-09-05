# GitHub Repository Setup Guide

This document provides step-by-step instructions for configuring the GitHub repository with proper branch protection, environments, and CI/CD workflows.

## 1. Repository Settings

### Branch Protection Rules

Navigate to **Settings > Branches** and create a branch protection rule for `main`:

**Branch name pattern:** `main`

**Protection settings:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `test` (from deploy-development.yml)
- ✅ Require conversation resolution before merging
- ✅ Require signed commits (optional but recommended)
- ✅ Include administrators (applies rules to repo admins)
- ✅ Restrict pushes that create files larger than 100MB

## 2. GitHub Environments

### Development Environment

Navigate to **Settings > Environments** and create:

**Environment name:** `development`

**Environment protection rules:**
- No deployment protection rules needed (auto-deploy on main branch)

**Environment secrets:**
- `RENDER_DEPLOY_HOOK_DEV` - Render webhook URL for development service
- `DEV_URL` - Development environment URL (e.g., https://groupifi-dev.onrender.com)

### Production Environment

**Environment name:** `production`

**Environment protection rules:**
- ✅ Required reviewers: Add yourself and any other maintainers
- ✅ Wait timer: 0 minutes (optional: add delay for additional safety)
- ✅ Deployment branches: Selected branches only → `main`

**Environment secrets:**
- `RENDER_DEPLOY_HOOK_PROD` - Render webhook URL for production service

## 3. Repository Secrets

Navigate to **Settings > Secrets and variables > Actions**:

### Repository Secrets
These secrets are available to all workflows:

- `RENDER_API_KEY` - Render API key for service management (if needed)

### Environment-Specific Secrets
Configure in each environment (development/production):

**Development:**
- `RENDER_DEPLOY_HOOK_DEV` - Development service deploy hook
- `DEV_URL` - Development service URL

**Production:**
- `RENDER_DEPLOY_HOOK_PROD` - Production service deploy hook

## 4. Render Deploy Hooks

### Getting Deploy Hook URLs

1. Go to your Render dashboard
2. Select your service
3. Navigate to **Settings > Deploy Hook**
4. Copy the webhook URL
5. Add to GitHub environment secrets

### Development Service Setup
- **Service Name:** groupifi-us-dev
- **Branch:** main (auto-deploy)
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview` or serve static files
- **Environment:** Development

### Production Service Setup
- **Service Name:** groupifi-us-prod
- **Branch:** main (manual deploy only)
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview` or serve static files
- **Environment:** Production
- **Custom Domain:** groupifi.us

## 5. Workflow Usage

### Development Deployment
- Automatically triggers on push to `main` branch
- Runs tests, builds, and deploys to development environment
- No manual approval required

### Production Deployment
- Manual trigger only via GitHub Actions UI
- Requires typing "deploy" to confirm
- Requires approval from designated reviewers
- Runs full test suite before deployment
- Includes health checks after deployment

### Triggering Production Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Type "deploy" in the confirmation field
5. Click **Run workflow**
6. Wait for reviewer approval
7. Monitor deployment progress

## 6. Security Considerations

- All secrets are environment-scoped
- Production requires manual approval
- Branch protection prevents direct pushes to main
- Status checks ensure code quality
- Health checks verify successful deployments

## 7. Monitoring Setup

Consider setting up UptimeRobot monitoring:
- Development: Monitor development URL for uptime
- Production: Monitor https://groupifi.us for uptime
- Configure alerts for downtime notifications

## 8. Next Steps

After completing this setup:

1. Test the development workflow by pushing to main
2. Verify development deployment works correctly
3. Test production workflow with a manual deployment
4. Set up UptimeRobot monitoring for both environments
5. Document any environment-specific configurations needed