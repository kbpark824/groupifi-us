# Deployment Setup Guide

## Overview

This project uses GitHub Flow with dual environment deployment:
- **Development**: Auto-deploys from `main` branch to `groupifi-dev.onrender.com`
- **Production**: Manual deployment via GitHub Actions to `groupifi.us`

## Environment Configuration

### Development Environment
- **Service**: `groupifi-us-dev` on Render
- **URL**: https://groupifi-dev.onrender.com
- **Auto-deploy**: Enabled from `main` branch
- **Plan**: Free tier

### Production Environment
- **Service**: `groupifi-us-prod` on Render
- **URL**: https://groupifi.us
- **Deploy**: Manual via GitHub Actions
- **Plan**: Starter tier

## Required Secrets

Configure these secrets in GitHub repository settings:

### Development Environment Secrets
- `RENDER_DEPLOY_HOOK_DEV`: Render deploy hook URL for development service
- `DEV_URL`: https://groupifi-dev.onrender.com

### Production Environment Secrets
- `RENDER_DEPLOY_HOOK_PROD`: Render deploy hook URL for production service

## Environment Variables

### Development Service (Render)
```
NODE_ENV=development
VITE_APP_ENV=development
VITE_APP_URL=https://groupifi-dev.onrender.com
VITE_POCKETBASE_URL=https://groupifi-pb-dev.fly.dev
```

### Production Service (Render)
```
NODE_ENV=production
VITE_APP_ENV=production
VITE_APP_URL=https://groupifi.us
VITE_POCKETBASE_URL=https://groupifi-pb.fly.dev
```

## Deployment Workflow

### Development Deployment
1. Push to `main` branch
2. GitHub Actions runs tests and builds
3. If successful, triggers Render deployment
4. Health check verifies deployment

### Production Deployment
1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Type "deploy" in the confirmation field
5. Click "Run workflow" button
6. Monitor deployment progress

## Health Monitoring

### Health Endpoint
- **URL**: `/health`
- **Response**: `OK`
- **Purpose**: Deployment verification and uptime monitoring

### UptimeRobot Configuration
Monitor both environments:
- Development: https://groupifi-dev.onrender.com/health
- Production: https://groupifi.us/health

## Troubleshooting

### Failed Deployments
1. Check GitHub Actions logs
2. Verify Render service status
3. Check environment variables
4. Verify deploy hook URLs

### Health Check Failures
1. Verify `/health` endpoint accessibility
2. Check service startup logs in Render
3. Verify build completed successfully

## Setup Checklist

- [ ] Render services created (development and production)
- [ ] GitHub repository secrets configured
- [ ] Environment variables set in Render services
- [ ] Deploy hooks configured
- [ ] UptimeRobot monitors set up
- [ ] Custom domain configured (groupifi.us)
- [ ] SSL certificates active
- [ ] Test deployment pipeline end-to-end