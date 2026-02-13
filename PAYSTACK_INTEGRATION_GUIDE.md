# Paystack Integration Guide

## Overview

Your UniHub application has a complete Paystack integration for:
- Event ticket payments
- Wallet funding
- Organizer withdrawals/payouts
- Premium event upgrades

## Required Environment Variables

### Server Environment Variables (server/.env)

Add these to your `server/.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Client URL (for payment redirects)
CLIENT_URL=https://yourdomain.com
```

### For Production

Replace `sk_test_` and `pk_test_` with your live keys:

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLIENT_URL=https://yourdomain.com
```

## How to Get Your Paystack Keys

### 1. Create a Paystack Account

1. Go to [https://paystack.com](https://paystack.com)
2. Click "Get Started" or "Sign Up"
3. Complete the registration process
4. Verify your email address

### 2. Get Your API Keys

1. Log in to your Paystack Dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. You'll see two sets of keys:
   - **Test Keys** (for development)
     - Test Secret Key: `sk_test_...`
     - Test Public Key: `pk_test_...`
   - **Live Keys** (for production - requires business verification)
     - Live Secret Key: `sk_live_...`
     - Live Public Key: `pk_live_...`

### 3. Copy Your Keys

For development, copy your **Test Keys**:
- Secret Key → `PAYSTACK_SECRET_KEY`
- Public Key → `PAYSTACK_PUBLIC_KEY`

⚠️ **IMPORTANT**: Never commit your secret keys to Git!

## Paystack Features Implemented

### 1. Event Ticket Payments

**Endpoint**: `POST /payment`

**Flow**:
1. User selects ticket type
2. Frontend initiates Paystack payment
3. User completes payment on Paystack
4. Paystack redirects back with reference
5. Backend verifies payment
6. Ticket is issued

**Request Body**:
```json
{
  "user": { "user_id": "user_token" },
  "event": { "event_id": "event_id" },
  "product": { "name": "Event Name", "price": 5000 },
  "provider": "paystack",
  "paystackReference": "unihub_xxxxx",
  "ticketType": "VIP",
  "answers": {}
}
```

### 2. Wallet Funding

**Initialize Payment**: `POST /wallet/initialize`

**Request**:
```json
{
  "email": "user@example.com",
  "amount": 10000,
  "user_token": "user_token"
}
```

**Response**:
```json
{
  "authorizationUrl": "https://checkout.paystack.com/xxxxx",
  "reference": "unihub_xxxxx"
}
```

**Verify Payment**: `POST /wallet/verify`

**Request**:
```json
{
  "reference": "unihub_xxxxx"
}
```

### 3. Organizer Withdrawals

**Request Withdrawal**: `POST /withdrawal/request`

**Request**:
```json
{
  "user_token": "user_token",
  "amount": 50000,
  "accountNumber": "0123456789",
  "bankCode": "058",
  "accountName": "John Doe"
}
```

**Supported Bank Codes**:
- Access Bank: `044`
- GTBank: `058`
- First Bank: `011`
- UBA: `033`
- Zenith Bank: `057`
- [Full list in code]

### 4. Premium Event Upgrade

**Endpoint**: `POST /payment`

**Request**:
```json
{
  "event": { "event_id": "event_id" },
  "isPremiumUpgrade": true,
  "paystackReference": "unihub_xxxxx"
}
```

## Webhook Configuration

### 1. Set Up Webhook in Paystack Dashboard

1. Go to **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhooks** section
3. Click **Add Webhook URL**
4. Enter: `https://yourdomain.com/api/payment/webhook/paystack`
5. Save

### 2. Webhook Events

The webhook handles:
- `charge.success` - Payment successful
- Automatic wallet funding
- Transaction recording

### 3. Webhook Security

The webhook verifies requests using HMAC SHA512:

```javascript
const hash = crypto
  .createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (hash !== req.headers["x-paystack-signature"]) {
  return res.status(401).send({ msg: "Invalid signature" });
}
```

## Frontend Integration

### Example: Paystack Inline Checkout

```javascript
import { usePaystackPayment } from 'react-paystack';

function PaymentComponent() {
  const config = {
    reference: generateReference(),
    email: user.email,
    amount: amount * 100, // Amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    metadata: {
      user_token: user.user_token,
      purpose: "wallet_funding"
    }
  };

  const onSuccess = (reference) => {
    // Verify payment on backend
    fetch('/api/payment/wallet/verify', {
      method: 'POST',
      body: JSON.stringify({ reference: reference.reference })
    });
  };

  const onClose = () => {
    console.log('Payment closed');
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button onClick={() => initializePayment(onSuccess, onClose)}>
      Pay with Paystack
    </button>
  );
}
```

### Install Paystack React Library

```bash
npm install react-paystack
```

## Testing

### Test Cards

Paystack provides test cards for development:

**Successful Payment**:
- Card: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

**Failed Payment**:
- Card: `5060 6666 6666 6666`
- CVV: Any 3 digits
- Expiry: Any future date

### Test Bank Accounts

For withdrawal testing:
- Account: `0123456789`
- Bank Code: `058` (GTBank)

## Security Best Practices

### 1. Environment Variables

✅ **DO**:
- Store keys in environment variables
- Use test keys in development
- Use live keys only in production
- Add `.env` to `.gitignore`

❌ **DON'T**:
- Commit keys to Git
- Share keys publicly
- Use live keys in development
- Hardcode keys in code

### 2. Payment Verification

Always verify payments on the backend:

```javascript
// ❌ BAD: Trusting frontend
if (req.body.paymentSuccess) {
  issueTicket();
}

// ✅ GOOD: Verifying with Paystack
const verification = await paystack.transaction.verify({ reference });
if (verification.status === "success") {
  issueTicket();
}
```

### 3. Webhook Security

Always verify webhook signatures:

```javascript
const hash = crypto
  .createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (hash !== req.headers["x-paystack-signature"]) {
  return res.status(401).send({ msg: "Invalid signature" });
}
```

### 4. Amount Validation

Always validate amounts on the backend:

```javascript
// Verify the amount matches what was expected
if (verification.amount !== expectedAmount * 100) {
  return res.status(400).send({ msg: "Amount mismatch" });
}
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/payment` | POST | Process ticket payment |
| `/freeregister` | POST | Free event registration |
| `/cancel` | POST | Cancel registration |
| `/wallet/fund` | POST | Legacy wallet funding |
| `/wallet/initialize` | POST | Initialize Paystack payment |
| `/wallet/verify` | POST | Verify wallet funding |
| `/transactions` | POST | Get user transactions |
| `/withdrawal/request` | POST | Request withdrawal |
| `/withdrawal/history` | POST | Get withdrawal history |
| `/webhook/paystack` | POST | Paystack webhook |

## Transaction Flow

### Wallet Funding Flow

```
1. User clicks "Fund Wallet"
   ↓
2. Frontend calls /wallet/initialize
   ↓
3. Backend creates Paystack session
   ↓
4. User redirected to Paystack checkout
   ↓
5. User completes payment
   ↓
6. Paystack redirects to callback URL
   ↓
7. Frontend calls /wallet/verify
   ↓
8. Backend verifies with Paystack
   ↓
9. Wallet balance updated
   ↓
10. Transaction recorded
```

### Withdrawal Flow

```
1. Organizer requests withdrawal
   ↓
2. Backend validates balance
   ↓
3. Creates Paystack transfer recipient
   ↓
4. Deducts from wallet
   ↓
5. Initiates Paystack transfer
   ↓
6. Records withdrawal as "processing"
   ↓
7. Paystack processes transfer
   ↓
8. Webhook updates status
   ↓
9. Funds sent to bank account
```

## Error Handling

### Common Errors

**Insufficient Funds**:
```json
{
  "status": "insufficient_funds",
  "msg": "Insufficient wallet balance"
}
```

**Invalid Payment**:
```json
{
  "status": "error",
  "msg": "Payment verification failed"
}
```

**Minimum Withdrawal**:
```json
{
  "msg": "Minimum withdrawal is ₦1000"
}
```

## Monitoring & Logs

### Check Paystack Dashboard

1. Go to **Transactions** to see all payments
2. Go to **Transfers** to see all withdrawals
3. Go to **Logs** to see webhook deliveries

### Server Logs

The integration logs:
- Payment verifications
- Transfer initiations
- Webhook events
- Errors

## Production Checklist

- [ ] Get Paystack account verified
- [ ] Obtain live API keys
- [ ] Update `PAYSTACK_SECRET_KEY` with live key
- [ ] Update `PAYSTACK_PUBLIC_KEY` with live key
- [ ] Set `CLIENT_URL` to production domain
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test with real bank account
- [ ] Test withdrawal flow
- [ ] Set up monitoring/alerts
- [ ] Document for team

## Support

### Paystack Resources

- Documentation: https://paystack.com/docs
- API Reference: https://paystack.com/docs/api
- Support: support@paystack.com
- Status: https://status.paystack.com

### Common Issues

**"Invalid API Key"**:
- Check key is correct
- Ensure no extra spaces
- Verify using correct environment (test vs live)

**"Webhook not receiving events"**:
- Check webhook URL is publicly accessible
- Verify HTTPS is enabled
- Check Paystack webhook logs

**"Transfer failed"**:
- Verify bank code is correct
- Check account number is valid
- Ensure sufficient balance in Paystack account

## Next Steps

1. **Get your Paystack keys** from the dashboard
2. **Add to environment variables** in server/.env
3. **Test with test cards** in development
4. **Configure webhook** for production
5. **Go live** with verified account

---

**Need Help?** Check the Paystack documentation or contact their support team.
