# Deployment Checklist

## Pre-Deployment Setup

### GitHub Repository Configuration
- [ ] Repository created and code pushed
- [ ] Branch protection rules configured for `main` branch
- [ ] GitHub environments created:
  - [ ] `development` environment
  - [ ] `production` environment with approval requirements

### GitHub Secrets Configuration
Configure these secrets in repository settings → Secrets and variables → Actions:

#### Development Environment
- [ ] `RENDER_DEPLOY_HOOK_DEV`: Deploy hook URL from Render development service
- [ ] `DEV_URL`: https://groupifi-dev.onrender.com

#### Production Environment  
- [ ] `RENDER_DEPLOY_HOOK_PROD`: Deploy hook URL from Render production service

### Render Services Setup

#### Development Service (`groupifi-us-dev`)
- [ ] Service created on Render
- [ ] Connected to GitHub repository
- [ ] Auto-deploy enabled from `main` branch
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=development`
  - [ ] `VITE_APP_ENV=development`
  - [ ] `VITE_APP_URL=https://groupifi-dev.onrender.com`
  - [ ] `VITE_POCKETBASE_URL=https://groupifi-pb-dev.fly.dev`
- [ ] Custom domain: `groupifi-dev.onrender.com`
- [ ] Deploy hook generated and added to GitHub secrets

#### Production Service (`groupifi-us-prod`)
- [ ] Service created on Render
- [ ] Connected to GitHub repository
- [ ] Manual deploy only (auto-deploy disabled)
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `VITE_APP_ENV=production`
  - [ ] `VITE_APP_URL=https://groupifi.us`
  - [ ] `VITE_POCKETBASE_URL=https://groupifi-pb.fly.dev`
- [ ] Custom domain: `groupifi.us`
- [ ] SSL certificate configured
- [ ] Deploy hook generated and added to GitHub secrets

## Deployment Testing

### Development Deployment Test
- [ ] Push changes to `main` branch
- [ ] Verify GitHub Actions workflow triggers automatically
- [ ] Check workflow completes successfully
- [ ] Verify development site is accessible at https://groupifi-dev.onrender.com
- [ ] Test health endpoint: https://groupifi-dev.onrender.com/health returns "OK"
- [ ] Verify application functionality works correctly

### Production Deployment Test
- [ ] Go to GitHub Actions tab
- [ ] Select "Deploy to Production" workflow
- [ ] Click "Run workflow"
- [ ] Enter "deploy" in confirmation field
- [ ] Click "Run workflow" button
- [ ] Monitor deployment progress
- [ ] Verify production site is accessible at https://groupifi.us
- [ ] Test health endpoint: https://groupifi.us/health returns "OK"
- [ ] Verify application functionality works correctly

## Monitoring Setup

### UptimeRobot Configuration
- [ ] UptimeRobot account created
- [ ] Development monitor configured:
  - [ ] URL: https://groupifi-dev.onrender.com/health
  - [ ] Interval: 5 minutes
  - [ ] Timeout: 30 seconds
- [ ] Production monitor configured:
  - [ ] URL: https://groupifi.us/health
  - [ ] Interval: 5 minutes
  - [ ] Timeout: 30 seconds
- [ ] Alert contacts configured
- [ ] Email notifications enabled

### Domain and SSL
- [ ] Custom domain `groupifi.us` configured in Render
- [ ] SSL certificate active and valid
- [ ] DNS records properly configured
- [ ] HTTPS redirect enabled

## Verification Commands

Run these commands to verify setup:

```bash
# Test the complete pipeline
./scripts/test-pipeline.sh

# Verify deployment configuration
./scripts/verify-deployment.sh

# Manual health checks
curl https://groupifi-dev.onrender.com/health
curl https://groupifi.us/health
```

## Troubleshooting

### Common Issues

#### GitHub Actions Failing
- [ ] Check repository secrets are correctly configured
- [ ] Verify deploy hook URLs are valid
- [ ] Check Render service status
- [ ] Review workflow logs for specific errors

#### Render Deployment Failing
- [ ] Check build logs in Render dashboard
- [ ] Verify environment variables are set correctly
- [ ] Ensure package.json scripts are correct
- [ ] Check for dependency issues

#### Health Check Failing
- [ ] Verify `/health` file exists in `public/` directory
- [ ] Check file contains exactly "OK"
- [ ] Ensure Render service is running
- [ ] Check for startup errors in logs

#### Domain Issues
- [ ] Verify DNS records are correct
- [ ] Check SSL certificate status
- [ ] Ensure custom domain is properly configured in Render
- [ ] Wait for DNS propagation (up to 24 hours)

## Post-Deployment

### Ongoing Maintenance
- [ ] Monitor UptimeRobot dashboard regularly
- [ ] Review deployment logs for any issues
- [ ] Keep dependencies updated
- [ ] Monitor performance and error rates

### Development Workflow
1. Create feature branch from `main`
2. Develop and test locally
3. Create pull request
4. Review and merge to `main`
5. Development environment auto-deploys
6. Test on development environment
7. Use GitHub Actions to deploy to production when ready

## Success Criteria

✅ **Deployment is successful when:**
- Both environments are accessible via their URLs
- Health endpoints return "OK"
- Application functionality works correctly
- UptimeRobot monitoring is active
- GitHub Flow workflow is functioning
- SSL certificates are valid and active

## Documentation

- [ ] Team members trained on deployment process
- [ ] Emergency procedures documented
- [ ] Access credentials securely stored
- [ ] Monitoring alerts configured for appropriate team members