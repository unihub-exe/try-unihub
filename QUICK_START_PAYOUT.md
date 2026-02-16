# Quick Start Guide - Payout System

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Add to `server/.env`:
```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### 3. Restart Your Server
```bash
cd server
npm start
```

---

## 🎯 Quick Test (1 Hour Timer)

### Step 1: Login as Admin
Navigate to: `http://localhost:3000/admin/auth`

### Step 2: Set Processing Time to 1 Hour
1. Go to: `http://localhost:3000/admin/settings`
2. Change "Standard Processing Time" to `1`
3. Click "Save Settings"
4. ✅ Should see success message (no more 401 error!)

### Step 3: Request a Payout as User
1. Login as a regular user
2. Go to wallet page
3. Add bank details if not already added
4. Request a payout (minimum ₦1,000)
5. ✅ Should see notification with "Timer started - payment will be initiated in 1 hours"

### Step 4: Check Admin Dashboard
1. Go to: `http://localhost:3000/admin/payouts`
2. ✅ Should see the payout with countdown timer showing "1h 0m"
3. Timer will count down in real-time

### Step 5: Wait for Automatic Processing
- After 1 hour, the cron job will automatically process the payout
- Check server logs for: "Running automatic payout processing check..."
- User will receive notification when completed

### Step 6: Test Immediate Processing (Optional)
1. Request another payout
2. In admin dashboard, click "Pay Now" button
3. ✅ Should process immediately, bypassing the timer

---

## 📊 What You'll See

### User Notifications
- **On Request**: "Timer started - payment will be initiated in X hours"
- **On Completion**: "Funds will arrive in your bank account within 24 hours (T+1 from Paystack)"

### Admin Dashboard
- Countdown timer showing hours and minutes remaining
- "Pay Now" button to process immediately
- Status indicators (pending, processing, completed, failed)

### Server Logs
```
Running automatic payout processing check...
Found 1 payouts ready for processing
Processed payout 507f1f77bcf86cd799439011 for user abc123
Automatic payout processing completed
```

---

## 🔧 Troubleshooting

### 401 Error on Settings
✅ **FIXED** - Both GET and POST now require authentication

### Timer Not Starting
- Check if AdminSettings exists in database
- Verify `payoutProcessingHours` is set
- Check server logs for errors

### Cron Job Not Running
- Look for "schedulers started" in server logs on startup
- Verify server is running continuously
- Check for any MongoDB connection issues

### Paystack Integration
- Verify `PAYSTACK_SECRET_KEY` is set correctly
- Check Paystack dashboard for API errors
- Ensure sufficient balance for transfers

---

## 📝 Important Notes

### Timer System
- Timer starts immediately when payout is requested
- Runs every hour checking for expired timers
- Automatically processes via Paystack when timer expires

### Paystack Settlement
- Our timer: Configurable (default 48 hours)
- Paystack settlement: T+1 day (24 hours)
- Total time: Our timer + 24 hours

### Production Settings
- Recommended processing time: 48 hours
- Minimum withdrawal: ₦1,000
- Automatic processing: Every hour

---

## 🎉 Success Checklist

- [x] Fixed 401 authentication error
- [x] Admin can save settings without errors
- [x] Timer starts when payout is requested
- [x] Admin dashboard shows countdown
- [x] Automatic processing works after timer expires
- [x] Immediate processing option available
- [x] Users receive notifications
- [x] Paystack integration ready

---

## 📚 Full Documentation

For complete details, see:
- `PAYOUT_SYSTEM.md` - Complete system documentation
- `PAYOUT_FIXES_SUMMARY.md` - All changes made
- `server/utils/paystackTransfer.js` - Paystack API integration

---

## 🆘 Need Help?

1. Check server logs for errors
2. Review Paystack dashboard
3. Verify database records
4. Test with small amounts first

---

## 🚀 Ready to Deploy?

1. Set processing time to 48 hours (production)
2. Verify Paystack credentials
3. Test with small amounts
4. Monitor logs for first few payouts
5. Set up alerts for failed transfers

**You're all set! The payout system is ready to use.** 🎊
