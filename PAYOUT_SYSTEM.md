# Automatic Payout System Documentation

## Overview

The UniHub platform now features an automatic payout system with configurable timer-based processing. This system allows admins to set a processing time, and payouts are automatically sent to users via Paystack after the timer expires.

## How It Works

### 1. User Requests Payout
When a user requests a withdrawal:
- The system checks their available balance and bank details
- A timer starts immediately based on the admin-configured processing hours
- The payout status is set to "pending"
- User receives a notification with the estimated processing time

### 2. Timer Countdown
- The timer is stored in the database with `timerStartedAt` and `scheduledProcessingAt` fields
- Admins can see the remaining time in the payouts dashboard
- The system calculates: `scheduledProcessingAt = timerStartedAt + processingHours`

### 3. Automatic Processing
- A cron job runs every hour checking for payouts ready to process
- When `scheduledProcessingAt` is reached:
  1. Status changes to "processing"
  2. System creates a Paystack transfer recipient
  3. Initiates the transfer via Paystack API
  4. Updates status to "completed" on success
  5. Notifies the user

### 4. Paystack T+1 Settlement
- After our timer expires and we trigger Paystack, Paystack takes T+1 days to settle
- Users are notified that funds will arrive within 24 hours after processing
- Total time = Our processing time + Paystack's T+1 day

## Admin Configuration

### Setting Processing Time

1. Navigate to Admin Settings (`/admin/settings`)
2. Update "Standard Processing Time (Hours)"
3. Default is 48 hours, but can be set to any value (e.g., 1 hour for testing)
4. Click "Save Settings"

### Managing Payouts

Admins can:
- View all pending payouts with countdown timers
- Process payouts immediately (bypass timer)
- Reject payouts (funds returned to user)
- See processing history

## Technical Implementation

### Database Schema

```javascript
PayoutRequest {
  userId: String,
  userName: String,
  amount: Number,
  accountDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    bankCode: String
  },
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected',
  timerStartedAt: Date,
  scheduledProcessingAt: Date,
  processingHours: Number,
  paystackReference: String
}
```

### Cron Job Schedule

```javascript
// Runs every hour
cron.schedule('0 * * * *', async () => {
  // Find payouts where scheduledProcessingAt <= now
  // Process each payout via Paystack
});
```

### Paystack Integration

The system uses the Paystack Transfer API:

1. **Create Transfer Recipient**
   ```javascript
   POST /transferrecipient
   {
     type: "nuban",
     name: accountName,
     account_number: accountNumber,
     bank_code: bankCode,
     currency: "NGN"
   }
   ```

2. **Initiate Transfer**
   ```javascript
   POST /transfer
   {
     source: "balance",
     amount: amount * 100, // in kobo
     recipient: recipientCode,
     reason: "UniHub Payout"
   }
   ```

## Environment Variables

Ensure these are set in your `.env` file:

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

## Testing

### Test with Short Timer

1. Set processing time to 1 hour in admin settings
2. Request a payout as a user
3. Wait 1 hour (or manually trigger the cron job)
4. Verify the payout is processed

### Manual Cron Trigger (for testing)

You can manually trigger the payout processor by calling the cron function directly in your code or using a test endpoint.

## Error Handling

If automatic processing fails:
- Status is set to "failed"
- Admin notes are updated with error details
- User is notified to contact support
- Admin can manually process the payout

## Security Considerations

1. **Authentication**: All payout endpoints require admin authentication
2. **Rate Limiting**: API endpoints are rate-limited
3. **Validation**: Bank details are validated before processing
4. **Audit Trail**: All payout actions are logged with timestamps
5. **Balance Checks**: System verifies available balance before processing

## User Experience

### For Users
- Clear notification when payout is requested
- Countdown timer showing estimated processing time
- Notification when payout is completed
- Transparent status updates

### For Admins
- Dashboard showing all pending payouts
- Real-time countdown timers
- Ability to process immediately if needed
- Complete payout history

## Future Enhancements

1. **Webhook Integration**: Listen to Paystack webhooks for real-time status updates
2. **Batch Processing**: Process multiple payouts in a single batch
3. **Custom Timer per User**: Allow different processing times based on user tier
4. **Retry Logic**: Automatic retry for failed transfers
5. **Email Notifications**: Send email updates for payout status changes

## Troubleshooting

### Payouts Not Processing Automatically
- Check if cron job is running (look for logs)
- Verify Paystack API key is set correctly
- Check server timezone settings
- Ensure MongoDB connection is stable

### Failed Transfers
- Verify bank details are correct
- Check Paystack balance is sufficient
- Review Paystack API error messages
- Check network connectivity

### Timer Not Starting
- Verify AdminSettings document exists in database
- Check if `payoutProcessingHours` is set
- Review wallet controller logs

## Support

For issues or questions:
1. Check server logs for error messages
2. Review Paystack dashboard for transfer status
3. Verify database records for payout status
4. Contact Paystack support for API-related issues
