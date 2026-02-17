# Deployment Instructions

## Critical Fixes Applied

### 1. Server Crash Fix (Payment Verification)
**File:** `server/controllers/paymentController.js`

**Problem:** Server crashes with `TypeError: Cannot read properties of undefined (reading 'status')` when verifying Paystack payments.

**Solution:** Replaced buggy Paystack library call with direct axios API call to Paystack.

### 2. Community Chat Fixes
**File:** `src/pages/users/community/[id].jsx`

**Problems:**
- Messages not aligned correctly (all on left)
- Username showing on every message
- authorId mismatch

**Solutions:**
- Fixed authorId to always use `user._id` for consistency
- Updated username display logic to only show when author changes
- Improved message alignment logic
- Modern UI redesign

### 3. Payment Page Error Handling
**File:** `src/pages/event/[eventId]/payment.jsx`

**Problem:** Users stuck on payment page when verification fails.

**Solution:** Added proper error handling and URL cleanup to allow retry.

### 4. CORS Configuration
**File:** `server/index.js`

**Problem:** CORS errors blocking requests.

**Solution:** Made CORS more permissive to prevent blocking while logging warnings.

---

## How to Deploy

### Option 1: Git Push (Recommended)

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "Fix: Server crash on payment verification, community chat UI improvements, CORS fixes"

# 3. Push to your repository
git push origin main
```

Render will automatically detect the push and redeploy.

### Option 2: Manual Deploy on Render

1. Go to your Render dashboard
2. Find your service (try-unihub)
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

---

## Verification Steps

After deployment, verify the fixes:

### 1. Test Payment Flow
1. Try to purchase a ticket
2. Complete payment on Paystack
3. Verify you're redirected back successfully
4. Check that ticket is issued

### 2. Test Community Chat
1. Send a message in a community
2. Verify YOUR messages appear on the RIGHT in BLUE
3. Verify OTHER users' messages appear on the LEFT in WHITE
4. Check that usernames only show when author changes

### 3. Check Server Logs
Monitor Render logs for:
- No more crashes on payment verification
- Successful Paystack API calls
- No CORS errors

---

## Environment Variables

Ensure these are set in Render:

```
PAYSTACK_SECRET_KEY=sk_live_xxxxx (or sk_test_xxxxx for testing)
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=https://try-unihub.vercel.app
NODE_ENV=production
```

---

## Troubleshooting

### Server Still Crashing?
- Check Render logs to confirm new code is deployed
- Verify PAYSTACK_SECRET_KEY is set correctly
- Check if Paystack API is accessible from Render servers

### CORS Errors Persist?
- Clear browser cache
- Check that CLIENT_URL matches your frontend domain
- Verify server restarted after code changes

### Messages Still Not Aligned?
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check browser console for any JavaScript errors
- Verify frontend rebuild completed on Vercel

---

## Rollback Plan

If issues occur after deployment:

### On Render:
1. Go to your service dashboard
2. Click "Rollback" to previous deployment
3. Or redeploy a specific commit from the dropdown

### On Vercel (Frontend):
1. Go to your project dashboard
2. Find the previous successful deployment
3. Click "..." → "Promote to Production"

---

## Support

If issues persist after deployment:
1. Check Render logs for server errors
2. Check Vercel logs for frontend errors
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
