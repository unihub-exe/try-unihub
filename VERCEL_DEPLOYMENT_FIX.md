# Vercel Deployment Fix

## Issues Fixed

### 1. ✅ Added Missing Cloudinary Package
Added `cloudinary` to `package.json` dependencies to fix the build warning.

### 2. ✅ Updated vercel.json
Removed deprecated `version: 2` and unnecessary build commands. Vercel auto-detects Next.js projects.

### 3. ✅ Moved Rewrites to next.config.js
Rewrites should be in `next.config.js` for Next.js projects, not `vercel.json`.

## Current Configuration

### vercel.json
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://invite-server-cykk.onrender.com",
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME": "df3zptxqc"
  }
}
```

### next.config.js
```javascript
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ["unihub-test-server.onrender.com", "invite-server-cykk.onrender.com", "localhost"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/backend/:path*",
                destination: "https://invite-server-cykk.onrender.com/:path*",
            },
        ];
    },
};
```

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. Vercel Will Auto-Deploy

Vercel will automatically detect the push and start a new deployment.

### 3. Check Deployment Logs

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click on the latest deployment
4. Check the build logs for any errors

## Common Issues & Solutions

### Issue: 404 on Homepage

**Possible Causes**:
1. Build succeeded but runtime error
2. Missing environment variables
3. API calls failing during SSR

**Solutions**:

#### Check Vercel Logs
1. Go to your deployment in Vercel
2. Click "Functions" tab
3. Look for runtime errors

#### Add Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `https://invite-server-cykk.onrender.com`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `df3zptxqc`

#### Check API Endpoint
Make sure your backend server is running:
- https://invite-server-cykk.onrender.com

### Issue: Build Warnings

**Cloudinary Warning**:
```
Module not found: Can't resolve 'cloudinary'
```

**Solution**: ✅ Fixed - Added `cloudinary` to package.json

**Images.domains Warning**:
```
`images.domains` is deprecated
```

**Solution**: Already using `remotePatterns` as well, so this is just a warning.

### Issue: API Calls Failing

If API calls are failing during build/runtime:

1. **Check CORS**: Ensure your backend allows requests from Vercel domain
2. **Check API URL**: Verify `NEXT_PUBLIC_API_URL` is correct
3. **Check Backend**: Ensure Render backend is running

## Testing Locally

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Build
npm run build

# Start production server
npm start
```

Visit http://localhost:3000 and verify everything works.

## Vercel Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### Required
- `NEXT_PUBLIC_API_URL` = `https://invite-server-cykk.onrender.com`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `df3zptxqc`

### Optional (if using Paystack on frontend)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = `pk_test_...`

## Debugging Steps

### 1. Check Build Logs
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

All should have ✓ checkmarks.

### 2. Check Function Logs
In Vercel dashboard:
1. Go to Deployments
2. Click latest deployment
3. Click "Functions" tab
4. Look for errors

### 3. Check Runtime Logs
In Vercel dashboard:
1. Go to Deployments
2. Click latest deployment
3. Click "Runtime Logs" tab
4. Look for errors when accessing the site

### 4. Test API Routes
Test your API routes directly:
- https://try-unihub.vercel.app/api/webhooks/cloudinary-logs

Should return JSON, not 404.

## Expected Behavior

After deployment:
- ✅ Homepage loads at https://try-unihub.vercel.app
- ✅ API routes work at /api/*
- ✅ Images load from Cloudinary
- ✅ Backend API calls work

## If Still Getting 404

### Option 1: Check for Runtime Errors

The build might succeed but the page crashes at runtime. Check:

1. Vercel Function Logs
2. Browser Console (F12)
3. Network tab for failed requests

### Option 2: Simplify Index Page

Temporarily simplify `src/pages/index.js` to test:

```javascript
export default function Home() {
    return (
        <div>
            <h1>UniHub</h1>
            <p>Homepage is working!</p>
        </div>
    );
}
```

If this works, the issue is in the LandingPage component.

### Option 3: Check Dependencies

Ensure all imports in LandingPage.js exist:
- FeaturesBento
- Header
- HeroHome
- LiquidFooter
- LiquidGlass

### Option 4: Check API Calls

If LandingPage makes API calls during SSR, they might be failing:

```javascript
// Add error handling
useEffect(() => {
    fetch(API_URL + '/endpoint')
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => console.error('API Error:', err));
}, []);
```

## Next Steps

1. ✅ Commit the fixes
2. ✅ Push to GitHub
3. ⏳ Wait for Vercel to deploy
4. ✅ Check deployment logs
5. ✅ Test the site
6. ✅ Check function logs if issues persist

## Support

If issues persist:
- Check Vercel Status: https://www.vercel-status.com
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Status**: Ready to deploy! Push your changes and Vercel will automatically redeploy.
