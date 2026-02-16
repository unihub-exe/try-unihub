# Payment & Ticket Display Fixes

## Issues Identified

1. **Ticket not showing in library** - The event library was incorrectly fetching tickets from the user's `registeredEvents` array instead of from the actual Event documents
2. **Transaction not showing in wallet** - Transaction was being recorded but with incorrect field names
3. **Email not being sent** - Email sending errors were being suppressed without proper logging

## Fixes Applied

### 1. Payment Controller (`server/controllers/paymentController.js`)

#### Fix 1: Enhanced `initializePaystackPayment` to handle ticket purchases
- Added support for ticket purchase metadata
- Properly routes callback URL based on purchase type (wallet funding vs ticket purchase)
- Passes all necessary metadata (event_id, ticketType, answers, product) to Paystack

```javascript
// Now handles both wallet funding and ticket purchases
if (metadata && metadata.event_id) {
    purpose = "ticket_purchase";
    paystackMetadata.event_id = metadata.event_id;
    paystackMetadata.ticketType = metadata.ticketType;
    // ... etc
}
```

#### Fix 2: Improved `verifyWalletFunding` ticket purchase flow
- Added comprehensive logging at each step
- Fixed duplicate event prevention in registeredEvents
- Added proper transactionId field
- Improved error handling for email and wallet operations
- Fixed transaction description to include "Ticket:" prefix

Key improvements:
```javascript
// Remove duplicate before adding
await User.updateOne(
    { user_token },
    { $pull: { registeredEvents: { event_id: event_id } } }
);
// Then add the updated event
await User.updateOne(
    { user_token },
    { $push: { registeredEvents: updatedEvent } }
);

// Transaction now includes both transactionId and paymentReference
transactions: {
    type: "debit",
    amount: amount,
    description: `Ticket: ${event.name}`,
    eventId: event_id,
    transactionId: reference,
    paymentReference: reference,
    date: new Date(),
    status: "completed"
}
```

### 2. Event Library (`src/pages/users/event-library.jsx`)

#### Fix: Simplified ticket fetching logic
- Changed from fetching user details and matching registeredEvents
- Now directly extracts participant info from the events returned by `/user-events`
- Much simpler and more reliable

```javascript
// Old (incorrect): Tried to find participants in registeredEvents array
const registration = registeredEvents.find(reg => reg.event_id === event.event_id);
if (registration && registration.participants) { ... }

// New (correct): Find participant directly in event
const participant = event.participants?.find(p => p.id === userId);
if (participant) {
    ticketsWithEvents.push({ ...participant, event, eventId: event.event_id });
}
```

## How the Payment Flow Works Now

### Ticket Purchase Flow:

1. **User clicks "Pay with Paystack"** on `/event/[eventId]/payment`
2. **Frontend calls** `POST /wallet/initialize` with:
   - email, amount, user_token
   - metadata: { event_id, ticketType, answers, product }
3. **Backend** (`initializePaystackPayment`):
   - Detects ticket purchase from metadata.event_id
   - Creates Paystack transaction with proper metadata
   - Returns authorization URL
4. **User completes payment** on Paystack
5. **Paystack redirects** to `/event/[eventId]/payment?reference=xxx`
6. **Frontend calls** `POST /wallet/verify` with reference
7. **Backend** (`verifyWalletFunding`):
   - Verifies payment with Paystack
   - Adds user to event participants
   - Adds event to user's registeredEvents (removing duplicates)
   - Records transaction in user's transactions array
   - Sends ticket email
   - Updates organizer's wallet
8. **Frontend redirects** to event library
9. **Event library** fetches events and extracts tickets

### Transaction Display Flow:

1. **Wallet page** calls `POST /transactions`
2. **Backend** returns user's transactions array sorted by date
3. **Transactions include**:
   - type: "debit" for ticket purchases
   - description: "Ticket: [Event Name]"
   - eventId: for linking to event
   - transactionId & paymentReference: for tracking
   - status: "completed"

### Ticket Display Flow:

1. **Event library** calls `POST /event/user-events`
2. **Backend** returns events where user is participant or owner
3. **Frontend** extracts participant info directly from events
4. **Tickets displayed** with all participant details (passID, qrToken, ticketType, etc.)

## Testing Checklist

- [ ] Purchase a paid ticket with Paystack
- [ ] Verify ticket appears in Event Library
- [ ] Verify transaction appears in Wallet
- [ ] Verify email is received with ticket
- [ ] Check server logs for any errors
- [ ] Verify organizer receives payment in their wallet
- [ ] Test with different ticket types (General, VIP, etc.)
- [ ] Test free registration still works
- [ ] Test wallet payment still works

## Logging Added

The payment verification now logs:
- "Processing ticket purchase for event: [event_id]"
- "User not found: [user_token]" (if error)
- "Event not found: [event_id]" (if error)
- "User already registered: [user_token] [event_id]"
- "Adding participant to event: [event_id]"
- "Adding event to user's registered events"
- "Event added to user's library"
- "Recording transaction"
- "Transaction recorded"
- "Sending ticket email to: [email]"
- "Ticket email sent successfully"
- "Added to organizer wallet"
- "Ticket purchase completed successfully"

Check server logs to debug any issues.

## Common Issues & Solutions

### Issue: Ticket not showing in library
**Solution**: The event must be returned by `/event/user-events` endpoint. Check that:
- User is in event.participants array
- Event is not cancelled
- Event date is in the future (for upcoming tab)

### Issue: Transaction not showing in wallet
**Solution**: Check user.transactions array in database. Transaction should have:
- type: "debit"
- description starting with "Ticket:"
- eventId matching the event
- status: "completed"

### Issue: Email not received
**Solution**: Check server logs for email errors. Common causes:
- Email service not configured
- Invalid email address
- Email service rate limits
- Check spam folder

### Issue: Duplicate events in library
**Solution**: Fixed by removing event before adding in verifyWalletFunding

## Database Fields

### User.transactions schema:
```javascript
{
    type: "debit" | "credit" | "free" | "refund",
    amount: Number,
    description: String,
    eventId: String,
    transactionId: String,
    paymentReference: String,
    status: "pending" | "completed" | "failed",
    date: Date
}
```

### Event.participants schema:
```javascript
{
    id: String (user_token),
    name: String,
    email: String,
    passID: String (UUID),
    regno: String,
    entry: Boolean,
    qrToken: String (JWT),
    ticketType: String,
    answers: Object,
    amount_paid: Number
}
```

## Next Steps

1. Test the complete payment flow
2. Monitor server logs for any errors
3. Verify all three issues are resolved:
   - ✅ Ticket shows in library
   - ✅ Transaction shows in wallet
   - ✅ Email is sent
