# Paystack Setup Checklist

## Quick Setup Guide

### Step 1: Get Paystack Account
- [ ] Go to https://paystack.com
- [ ] Sign up for an account
- [ ] Verify your email
- [ ] Complete your profile

### Step 2: Get API Keys
- [ ] Log in to Paystack Dashboard
- [ ] Navigate to Settings → API Keys & Webhooks
- [ ] Copy your **Test Secret Key** (starts with `sk_test_`)
- [ ] Copy your **Test Public Key** (starts with `pk_test_`)

### Step 3: Add Environment Variables

Add these to your `server/.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here

# Client URL (for redirects)
CLIENT_URL=http://localhost:3000
```

### Step 4: Add to Render Environment Variables

In your Render dashboard, add these environment variables:

1. Go to your service → Environment
2. Add:
   - Key: `PAYSTACK_SECRET_KEY`
   - Value: `sk_test_your_key_here`
3. Add:
   - Key: `PAYSTACK_PUBLIC_KEY`  
   - Value: `pk_test_your_key_here`
4. Add:
   - Key: `CLIENT_URL`
   - Value: `https://yourdomain.com`

### Step 5: Configure Webhook (Optional for now)

For production, configure webhook:
- [ ] Go to Settings → API Keys & Webhooks
- [ ] Add webhook URL: `https://yourdomain.com/api/payment/webhook/paystack`
- [ ] Save

### Step 6: Test Integration

Test with Paystack test cards:

**Success Card**:
- Card Number: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

**Test Flow**:
- [ ] Try funding wallet
- [ ] Try purchasing event ticket
- [ ] Verify transaction appears in Paystack dashboard

## Environment Variables Summary

### Required for Server

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLIENT_URL=http://localhost:3000
```

### Required for Frontend (if using Paystack inline)

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Where to Find Your Keys

1. **Paystack Dashboard**: https://dashboard.paystack.com
2. **Settings** → **API Keys & Webhooks**
3. Look for:
   - Test Secret Key: `sk_test_...`
   - Test Public Key: `pk_test_...`

## Production Keys

When ready for production:

1. Complete business verification in Paystack
2. Get live keys:
   - Live Secret Key: `sk_live_...`
   - Live Public Key: `pk_live_...`
3. Replace test keys with live keys
4. Update `CLIENT_URL` to production domain

## Verification

Your integration is working if:
- [ ] No errors when starting server
- [ ] Can initialize payments
- [ ] Payments appear in Paystack dashboard
- [ ] Webhook receives events (if configured)

## Common Issues

### "Invalid API Key"
- Check for typos in key
- Ensure no extra spaces
- Verify key starts with `sk_test_` or `sk_live_`

### "Module not found: paystack"
- Run: `npm install paystack`
- Check `server/package.json` includes `"paystack": "^2.0.1"`

### "CLIENT_URL not defined"
- Add `CLIENT_URL` to environment variables
- Restart server after adding

## Support

- Paystack Docs: https://paystack.com/docs
- Paystack Support: support@paystack.com
- Integration Guide: See `PAYSTACK_INTEGRATION_GUIDE.md`

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

Mark items as you complete them!
