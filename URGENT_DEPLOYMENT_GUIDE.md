# URGENT: Deployment Guide for Premium Payment Fix

## Critical Issue Fixed

**Error:** `setMessage is not defined` in premium_payment.jsx
**Status:** ✅ FIXED in code
**Action Required:** Deploy to production

---

## Files That Need Deployment

### 1. Frontend (Vercel)
**File:** `src/pages/event/[eventId]/premium_payment.jsx`
**Changes:**
- Added `success` state variable
- Replaced `setMessage` with `setSuccess`
- Added success message display in UI

### 2. Backend (Render)
**File:** `server/controllers/paymentController.js`
**Changes:**
- Added premium_upgrade handling in `initializePaystackPayment`
- Fixed callback URL for premium payments
- Fixed transaction recording

**File:** `server/utils/emailService.js`
**Changes:**
- Added `sendPremiumUpgradeEmail` function

---

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

#### For Frontend (Vercel):
1. Commit and push changes to your repository:
   ```bash
   git add .
   git commit -m "Fix: Premium payment verification error"
   git push origin main
   ```
2. Vercel will automatically deploy (usually takes 2-3 minutes)
3. Check deployment status at: https://vercel.com/dashboard

#### For Backend (Render):
1. Same as above - push to repository
2. Render will automatically deploy (usually takes 3-5 minutes)
3. Check deployment status at: https://dashboard.render.com

### Option 2: Manual Deployment

#### For Frontend (Vercel):
1. Go to https://vercel.com/dashboard
2. Find your project
3. Click "Deployments"
4. Click "Redeploy" on the latest deployment
5. Wait for deployment to complete

#### For Backend (Render):
1. Go to https://dashboard.render.com
2. Find your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

---

## Verification After Deployment

### 1. Check if Changes are Live

**Frontend:**
```bash
# Open browser console and run:
fetch('https://try-unihub.vercel.app/_next/static/chunks/pages/event/[eventId]/premium_payment-[hash].js')
  .then(r => r.text())
  .then(t => console.log(t.includes('setSuccess') ? 'DEPLOYED ✅' : 'NOT DEPLOYED ❌'))
```

**Backend:**
```bash
# Check server logs for:
"Added premium_upgrade handling"
```

### 2. Test Premium Payment

1. Go to: https://try-unihub.vercel.app
2. Login to your account
3. Go to any event you own
4. Click "Manage Event"
5. Click "Upgrade to Premium" (yellow button)
6. Select days and click "Pay & Upgrade Now"
7. **Expected:** Redirected to Paystack
8. Complete payment (use test card if in test mode)
9. **Expected:** Redirected back to premium_payment page
10. **Expected:** See green success message: "🎉 Congratulations! Your event is now Premium..."
11. **Expected:** After 3 seconds, redirected to dashboard
12. **Expected:** Event appears in "Premium Picks" section

### 3. Check for Errors

Open browser console (F12) and check:
- ❌ No "setMessage is not defined" error
- ❌ No "verification error" 
- ✅ Payment verification successful
- ✅ Event updated to premium

---

## If Deployment Fails

### Frontend Issues:

1. **Build Error:**
   - Check Vercel deployment logs
   - Look for syntax errors
   - Fix and redeploy

2. **Runtime Error:**
   - Check browser console
   - Check Vercel function logs
   - Verify environment variables

### Backend Issues:

1. **Deployment Error:**
   - Check Render deployment logs
   - Look for missing dependencies
   - Check Node.js version

2. **Runtime Error:**
   - Check Render logs
   - Verify environment variables
   - Check database connection

---

## Environment Variables to Verify

### Frontend (.env.local or Vercel):
```
NEXT_PUBLIC_API_URL=https://try-unihub.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Backend (.env or Render):
```
PAYSTACK_SECRET_KEY=sk_test_xxx or sk_live_xxx
CLIENT_URL=https://try-unihub.vercel.app
JWT_SECRET=your_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
MONGODB_URI=mongodb+srv://...
```

---

## Quick Fix if Can't Deploy Immediately

If you can't deploy right now, you can temporarily fix the error by:

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh:**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

3. **Use incognito/private mode:**
   - This will load the latest version from server

**Note:** This is temporary. You still need to deploy the fix.

---

## Rollback Plan

If the deployment causes issues:

### Frontend (Vercel):
1. Go to Vercel dashboard
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Backend (Render):
1. Go to Render dashboard
2. Find previous working deployment
3. Click "Rollback to this version"

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Premium payment works without errors
- [ ] Success message displays correctly
- [ ] Event becomes premium after payment
- [ ] Transaction recorded as "Premium Payment"
- [ ] Notification sent to user
- [ ] Email sent to user
- [ ] Event appears in Premium Picks
- [ ] No console errors
- [ ] No server errors

---

## Support

If you encounter issues during deployment:

1. **Check deployment logs** (Vercel/Render dashboard)
2. **Check browser console** for frontend errors
3. **Check server logs** for backend errors
4. **Verify environment variables** are set correctly
5. **Test in incognito mode** to avoid cache issues

---

## Timeline

- **Code Fix:** ✅ Complete
- **Deployment:** ⏳ Pending (you need to deploy)
- **Testing:** ⏳ After deployment
- **Verification:** ⏳ After testing

**Estimated Time:** 5-10 minutes for deployment + 5 minutes for testing

---

## Next Steps

1. **Deploy the changes** using Option 1 or Option 2 above
2. **Wait for deployment** to complete (check status)
3. **Test premium payment** following the verification steps
4. **Confirm it works** - no more "setMessage is not defined" error
5. **Monitor** for any other issues

The fix is ready - it just needs to be deployed! 🚀
