# Test Premium Payment Flow

## Quick Test Steps

### 1. Test Premium Upgrade
1. Create an event (or use existing event)
2. Go to event management page: `/event/[eventId]/manage`
3. Click "Upgrade to Premium" button (yellow button in header)
4. You should be redirected to: `/event/[eventId]/premium_payment`
5. Select number of days (1-30)
6. Click "Pay & Upgrade Now"
7. **VERIFY:** You are redirected to Paystack (not event registration)
8. Complete payment on Paystack test mode
9. **VERIFY:** After payment, you are redirected back to premium_payment page (not registration)
10. **VERIFY:** You see success message: "🎉 Congratulations! Your event is now Premium..."
11. Wait 3 seconds
12. **VERIFY:** You are redirected to dashboard
13. **VERIFY:** Event appears in "Premium Picks" section
14. Check transaction history
15. **VERIFY:** Transaction shows as "Premium Payment - [Event Name] (X days)"
16. Check notifications
17. **VERIFY:** You received notification about premium upgrade
18. Check email
19. **VERIFY:** You received email with premium benefits

### 2. Test Ticket Purchase
1. Go to any event page
2. Click "Register" or "Buy Ticket"
3. Select ticket type
4. Complete payment
5. **VERIFY:** Transaction shows as "Ticket: [Event Name]"
6. **VERIFY:** You received ticket email with QR code
7. **VERIFY:** Organizer received notification
8. **VERIFY:** Organizer's wallet shows the sale

### 3. Check Console for Errors
Open browser console (F12) and check for:
- ❌ No CORS errors
- ❌ No 404 errors
- ❌ No undefined errors
- ✅ Successful API calls

## Debug Information

### If Premium Payment Still Goes to Registration:

1. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Click "Pay & Upgrade Now"
   - Find the `/wallet/initialize` request
   - Check the request payload:
   ```json
   {
     "amount": 700,
     "email": "user@example.com",
     "user_token": "...",
     "metadata": {
       "event_id": "...",
       "purpose": "premium_upgrade",  // ← This must be present
       "days": 7,
       "event_name": "Event Name"
     }
   }
   ```
   - Check the response:
   ```json
   {
     "authorizationUrl": "https://checkout.paystack.com/...",
     "reference": "unihub_..."
   }
   ```

2. **Check Paystack Callback URL:**
   - The authorizationUrl should include a callback_url parameter
   - The callback should be: `https://try-unihub.vercel.app/event/[eventId]/premium_payment?status=success&reference=...`
   - NOT: `https://try-unihub.vercel.app/event/[eventId]/registration?...`

3. **Check Server Logs:**
   - Look for: "Payment verified successfully"
   - Look for: "purpose: premium_upgrade"
   - Look for: "Event upgraded to premium successfully"

### If CORS Error Persists:

The CORS error for announcements is unrelated to payment. It's a separate issue with the announcements endpoint.

**Quick Fix:**
1. Check if server is running
2. Check if `/user/announcements` endpoint exists
3. Check if CORS is properly configured (it should be)

**The CORS error won't affect payment flow.**

## Expected Behavior After Fix

### Premium Payment:
```
User clicks "Upgrade" 
  ↓
Premium Payment Page (/event/[id]/premium_payment)
  ↓
Paystack Payment
  ↓
Back to Premium Payment Page (with success message)
  ↓
Wait 3 seconds
  ↓
Dashboard (event in Premium Picks)
```

### Ticket Purchase:
```
User clicks "Buy Ticket"
  ↓
Registration Page
  ↓
Paystack Payment
  ↓
Back to Event Page or Dashboard
  ↓
Ticket in Email & Transaction History
```

## Files Changed

1. `server/controllers/paymentController.js`
   - Added premium_upgrade handling in `initializePaystackPayment`
   - Fixed callback URL for premium payments
   - Added proper metadata passing

2. `src/pages/event/[eventId]/premium_payment.jsx`
   - Already had correct implementation
   - Sends correct metadata to backend

3. `server/utils/emailService.js`
   - Added `sendPremiumUpgradeEmail` function

## Verification Checklist

- [ ] Premium payment redirects to Paystack (not registration)
- [ ] After payment, returns to premium_payment page
- [ ] Success message shows for 3 seconds
- [ ] Redirects to dashboard
- [ ] Event appears in Premium Picks
- [ ] Transaction shows as "Premium Payment"
- [ ] Notification received
- [ ] Email received
- [ ] No console errors
- [ ] No CORS errors (except announcements - separate issue)

## If Still Not Working

1. **Clear browser cache and cookies**
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check if changes are deployed** to production server
4. **Restart the server** if running locally
5. **Check environment variables** are set correctly

## Contact

If issues persist after following these steps, provide:
1. Screenshot of Network tab showing the `/wallet/initialize` request
2. Screenshot of console errors
3. Screenshot of the page you're redirected to after payment
4. Server logs if available
