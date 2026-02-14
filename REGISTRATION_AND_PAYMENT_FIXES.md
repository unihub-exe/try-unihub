# Registration Questions and Payment Fixes

## Issues Fixed

### 1. Registration Question Not Displaying (Empty Label)

**Problem:** When creating registration questions in the event management page, the question text was not showing up during registration - only an empty space with an input field.

**Root Cause:** Field name mismatch between frontend and backend:
- Backend model (`server/models/event.js`) expects: `label`
- Event management page (`src/pages/event/[eventId]/manage.jsx`) was using: `question`
- Create event form (`src/components/CreateEventForm.jsx`) was correctly using: `label`

**Fix Applied:**
- Updated `manage.jsx` to use `label` field instead of `question`:
  - Changed `addQuestion()` to create questions with `{ label: "", type: "text", required: false }`
  - Updated form input to use `value={q.label}` and `onChange={(e) => updateQuestion(index, "label", e.target.value)}`

### 2. Payment Endpoint 404 Error

**Problem:** When trying to pay for event tickets with Paystack, the request failed with:
```
POST https://try-unihub.onrender.com/payment/wallet/initialize 404 (Not Found)
```

**Root Cause:** Incorrect API endpoint path:
- Frontend was calling: `/payment/wallet/initialize`
- Actual endpoint: `/wallet/initialize`
- The payment routes are mounted at `/` in `server/index.js`, not at `/payment`

**Fix Applied:**
- Updated `src/pages/event/[eventId]/payment.jsx`:
  - Changed endpoint from `${API_URL}/payment/wallet/initialize` to `${API_URL}/wallet/initialize`
  - Added missing Authorization header: `"Authorization": \`Bearer \${user_id}\``
  - Fixed response field check from `data.authorization_url` to `data.authorizationUrl`
  - Removed incorrect `status === "success"` check (endpoint doesn't return status field)

## Files Modified

1. `src/pages/event/[eventId]/manage.jsx`
   - Fixed registration question field name from `question` to `label`

2. `src/pages/event/[eventId]/payment.jsx`
   - Fixed wallet initialize endpoint path
   - Added Authorization header
   - Fixed response field name check

## Testing Recommendations

1. Create a new event with registration questions
2. Verify questions display correctly during registration
3. Test payment flow with Paystack
4. Verify wallet funding works correctly

## Related Files (Already Correct)

- `src/pages/users/wallet.jsx` - Already using correct endpoint and auth
- `src/pages/event/[eventId]/premium_payment.jsx` - Already using correct endpoint and auth
- `src/components/CreateEventForm.jsx` - Already using correct `label` field
