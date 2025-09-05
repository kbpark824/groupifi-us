# UptimeRobot Monitoring Setup

## Overview

UptimeRobot provides free uptime monitoring for both development and production environments. This is essential for Render's free tier to prevent services from sleeping.

## Monitor Configuration

### Development Environment Monitor
- **Monitor Type**: HTTP(s)
- **Friendly Name**: Groupifi Us - Development
- **URL**: https://groupifi-dev.onrender.com/health
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds
- **Expected Response**: 200 OK with "OK" content

### Production Environment Monitor
- **Monitor Type**: HTTP(s)
- **Friendly Name**: Groupifi Us - Production
- **URL**: https://groupifi.us/health
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds
- **Expected Response**: 200 OK with "OK" content

## Setup Steps

### 1. Create UptimeRobot Account
1. Go to https://uptimerobot.com
2. Sign up for a free account
3. Verify your email address

### 2. Add Development Monitor
1. Click "Add New Monitor"
2. Select "HTTP(s)" as monitor type
3. Enter friendly name: "Groupifi Us - Development"
4. Enter URL: `https://groupifi-dev.onrender.com/health`
5. Set monitoring interval to 5 minutes
6. Click "Create Monitor"

### 3. Add Production Monitor
1. Click "Add New Monitor"
2. Select "HTTP(s)" as monitor type
3. Enter friendly name: "Groupifi Us - Production"
4. Enter URL: `https://groupifi.us/health`
5. Set monitoring interval to 5 minutes
6. Click "Create Monitor"

### 4. Configure Alerts (Optional)
1. Go to "Alert Contacts"
2. Add your email for notifications
3. Configure alert preferences:
   - Alert when down for: 2 minutes
   - Send notifications: When down & up
   - Alert via: Email

## Benefits

### For Development (Free Tier)
- Prevents Render service from sleeping
- Ensures development environment stays active
- Early detection of deployment issues

### For Production
- 99.9% uptime monitoring
- Immediate notification of outages
- Performance tracking and statistics
- SSL certificate monitoring

## Monitoring Dashboard

UptimeRobot provides:
- Real-time status dashboard
- Uptime percentage statistics
- Response time graphs
- Incident history
- Public status pages (optional)

## Integration with CI/CD

The health endpoint (`/health`) is used by:
1. **UptimeRobot**: Continuous monitoring
2. **GitHub Actions**: Post-deployment verification
3. **Manual Testing**: Quick health checks

## Troubleshooting

### Monitor Shows Down
1. Check if service is actually accessible
2. Verify health endpoint returns "OK"
3. Check Render service logs
4. Verify SSL certificate status

### False Positives
1. Increase monitor timeout if needed
2. Check for temporary network issues
3. Verify health endpoint is lightweight

## Cost Considerations

- **Free Tier**: Up to 50 monitors, 5-minute intervals
- **Paid Tiers**: More frequent checks, SMS alerts, more monitors
- **Recommendation**: Free tier is sufficient for this project

## Status Page (Optional)

UptimeRobot can create public status pages:
- URL: Custom subdomain (e.g., status.groupifi.us)
- Shows real-time status of all services
- Incident communication
- Subscriber notifications