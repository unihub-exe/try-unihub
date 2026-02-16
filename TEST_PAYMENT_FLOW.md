# Testing Payment & Ticket Flow

## Quick Test Steps

### 1. Test Paid Ticket Purchase

1. **Start the servers**:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Purchase a ticket**:
   - Go to an event page with a paid ticket
   - Click "Register" or "Buy Ticket"
   - Select ticket type if multiple options
   - Click "Pay with Paystack"
   - Complete payment on Paystack
   - Wait for redirect back to your site

3. **Verify ticket in library**:
   - Navigate to Event Library (or wait for auto-redirect)
   - Check "Upcoming & Live" tab
   - Switch to "Tickets" view
   - Your ticket should appear with:
     - Event name
     - Ticket type
     - QR code
     - Pass ID

4. **Verify transaction in wallet**:
   - Navigate to Wallet page
   - Check "Recent Transactions" section
   - Look for transaction with:
     - Description: "Ticket: [Event Name]"
     - Amount: -₦[price]
     - Status: Completed
     - Date: Today

5. **Check email**:
   - Check your email inbox (and spam folder)
   - Look for ticket email with:
     - Event details
     - QR code
     - Ticket ID
     - PDF attachment (if configured)

### 2. Check Server Logs

Open your server terminal and look for these log messages:

```
Processing ticket purchase for event: [event_id]
Adding participant to event: [event_id]
Adding event to user's registered events
Event added to user's library
Recording transaction
Transaction recorded
Sending ticket email to: [email]
Ticket email sent successfully
Added to organizer wallet
Ticket purchase completed successfully
```

If you see any errors, they will be logged with details.

### 3. Test Free Registration

1. Go to a free event
2. Click "Register"
3. Verify:
   - Event appears in library
   - Transaction shows as "Free Registration: [Event Name]"
   - Email is received

### 4. Test Wallet Payment

1. Fund your wallet first (if needed)
2. Go to a paid event
3. Select "Pay with Wallet" option
4. Verify same as paid ticket test above

## Debugging

### If ticket doesn't show in library:

1. **Check database** (MongoDB):
   ```javascript
   // Find the event
   db.events.findOne({ event_id: "your_event_id" })
   
   // Check if user is in participants array
   // Look for: participants: [{ id: "your_user_token", ... }]
   ```

2. **Check API response**:
   - Open browser DevTools > Network tab
   - Look for `/event/user-events` request
   - Check if your event is in the response
   - Check if you're in the participants array

3. **Check user document**:
   ```javascript
   db.users.findOne({ user_token: "your_user_token" })
   
   // Check registeredEvents array
   // Should contain the event document
   ```

### If transaction doesn't show:

1. **Check user transactions**:
   ```javascript
   db.users.findOne(
     { user_token: "your_user_token" },
     { transactions: 1 }
   )
   
   // Look for transaction with:
   // - type: "debit"
   // - description: "Ticket: ..."
   // - eventId: matching your event
   ```

2. **Check API response**:
   - Network tab > `/transactions` request
   - Verify transaction is in response

### If email not received:

1. **Check server logs** for email errors
2. **Verify email service** is configured:
   - Check `.env` file for email credentials
   - Test email service separately
3. **Check spam folder**
4. **Verify email address** is correct in user profile

## Manual Database Verification

If you need to manually check the database:

```javascript
// Connect to MongoDB
mongosh "your_connection_string"

// Use your database
use unihub

// Find user
db.users.findOne({ email: "your_email@example.com" })

// Check if event is in registeredEvents
db.users.findOne(
  { email: "your_email@example.com" },
  { registeredEvents: 1 }
)

// Check transactions
db.users.findOne(
  { email: "your_email@example.com" },
  { transactions: { $slice: -10 } }
)

// Find event and check participants
db.events.findOne({ event_id: "your_event_id" })
```

## Expected API Responses

### POST /wallet/initialize (Ticket Purchase)
```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "unihub_xxxxx_xxxxx"
}
```

### POST /wallet/verify (After Payment)
```json
{
  "status": "success",
  "msg": "Ticket purchased successfully",
  "eventId": "your_event_id"
}
```

### POST /event/user-events
```json
{
  "upcoming": [
    {
      "event_id": "...",
      "name": "...",
      "participants": [
        {
          "id": "your_user_token",
          "passID": "...",
          "qrToken": "...",
          "ticketType": "General Admission"
        }
      ]
    }
  ],
  "live": [],
  "past": []
}
```

### POST /transactions
```json
{
  "transactions": [
    {
      "type": "debit",
      "amount": 5000,
      "description": "Ticket: Event Name",
      "eventId": "...",
      "transactionId": "unihub_xxxxx_xxxxx",
      "paymentReference": "unihub_xxxxx_xxxxx",
      "status": "completed",
      "date": "2024-..."
    }
  ]
}
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "User not found" | Invalid user_token | Check authentication |
| "Event not found" | Invalid event_id | Verify event exists |
| "You are already registered" | Duplicate registration | Check participants array |
| "Payment verification failed" | Invalid Paystack reference | Check Paystack dashboard |
| "Insufficient wallet balance" | Not enough funds | Fund wallet first |

## Performance Notes

- Payment verification typically takes 2-5 seconds
- Email sending is non-blocking (won't fail transaction)
- Wallet updates are atomic (won't create duplicates)
- Event library loads in 1-2 seconds for typical users

## Security Checks

The payment flow includes:
- ✅ Paystack payment verification
- ✅ Duplicate registration prevention
- ✅ User authentication
- ✅ Event capacity checks
- ✅ Transaction atomicity
- ✅ Secure QR token generation (JWT)

## Support

If issues persist after following this guide:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure Paystack API keys are valid
4. Check database connection
5. Review PAYMENT_TICKET_FIXES.md for technical details
