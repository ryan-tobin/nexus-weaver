# Nexus Weaver Dashboard - Vercel Deployment Guide

## Prerequisites
- Vercel account
- GitHub repository with this code
- Supabase project configured

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `services/dashboard` folder as the root directory

### 2. Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:

```
VITE_SUPABASE_URL=https://rfpbxeyvqhhijphpspml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGJ4ZXl2cWhoaWpwaHBzcG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTU4ODIsImV4cCI6MjA2OTQ5MTg4Mn0.vAgQxJ9mXb0V4ZVoFid4Whl-tN7EtEHZ-aKL0unMRdE
VITE_API_URL=https://your-cloud-run-url/api/v1
```

### 4. Domain Configuration (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS records as instructed by Vercel

### 5. Deploy
- Click "Deploy" 
- Vercel will automatically build and deploy your dashboard
- Each commit to main branch will trigger automatic redeployment

## Features Enabled
✅ Supabase Authentication (Sign up, Sign in, Password reset)  
✅ Protected Routes  
✅ JWT Token Integration  
✅ Responsive Design  
✅ Automatic HTTPS  
✅ Edge Deployment  
✅ Automatic Builds  

## Testing the Deployment
1. Visit your Vercel URL
2. Try signing up with a new account
3. Check email for confirmation
4. Sign in and test the dashboard

## Troubleshooting
- Check Vercel build logs for any errors
- Verify environment variables are set correctly
- Ensure Supabase URL and keys are valid
- Check browser console for JavaScript errors