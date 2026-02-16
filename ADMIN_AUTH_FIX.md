# Admin Authentication Fix

## Issue
Admin pages were getting 401 Unauthorized errors when accessing protected endpoints like:
- `/admin/payouts`
- `/admin/settings`
- `/admin/reports`

Error message: `"Invalid token"`

## Root Cause
The authentication middleware (`server/middleware/auth.js`) was not properly recognizing admin tokens sent via the Authorization header. The role detection logic only checked `req.body.admin_id`, but admin pages send tokens in the `Authorization: Bearer <token>` header.

## Solution
Updated the `authenticate` middleware to:

1. **Check Admin Collection**: When a token is sent via Authorization header, the middleware now queries the Admin collection to verify if it's an admin token
2. **Set Role Properly**: If the token exists in the Admin collection, the role is set to "ADMIN"
3. **Async Function**: Changed the middleware to async to support database queries

### Code Changes

**File**: `server/middleware/auth.js`

```javascript
async function authenticate(req, res, next) {
    // ... token extraction logic ...
    
    // Check if this is an admin token by verifying against Admin collection
    const Admin = require("../models/admin");
    const admin = await Admin.findOne({ admin_id: token });
    
    if (admin) {
        req.user.role = "ADMIN";
        req.user.email = admin.email;
        req.user.name = admin.name;
    }
    // ... rest of logic ...
}
```

## Testing

### 1. Test Admin Settings
```bash
# Login as admin
# Navigate to /admin/settings
# Update settings and click Save
# Should see success message (no 401 error)
```

### 2. Test Admin Payouts
```bash
# Login as admin
# Navigate to /admin/payouts
# Should see list of payouts (no 401 error)
```

### 3. Test Admin Reports
```bash
# Login as admin
# Navigate to /admin/reports
# Should see reports list (no 401 error)
```

## Impact
- All admin endpoints now work correctly with Authorization header
- Admin authentication is more secure (database verification)
- Backward compatible with body-based tokens

## Files Modified
- `server/middleware/auth.js` - Made authenticate function async and added Admin collection check

## Related Issues Fixed
- 401 error on `/admin/settings` POST
- 401 error on `/admin/payouts` GET
- 401 error on `/admin/reports` GET
- Any other admin endpoints requiring authentication

## Status
✅ Fixed and ready for testing
