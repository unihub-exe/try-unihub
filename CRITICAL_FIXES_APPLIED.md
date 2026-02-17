# Critical Fixes Applied - February 17, 2026

## Issue 1: Events Showing as "Live Now" Incorrectly ✅ FIXED

**Problem**: Events scheduled for future times on the current day were showing in "Live Now" section. Events that had ended were still showing as live.

**Root Cause**: Dashboard was only comparing dates (`e.date === todayStr`), not actual start/end times.

**Solution**: 
- Updated `src/pages/users/dashboard.jsx` to parse both date AND time
- Events now categorized as:
  - **Live**: Current time is between event start and end time
  - **Upcoming**: Current time is before event start time
  - Events that have ended are automatically excluded from both sections

**Files Modified**:
- `src/pages/users/dashboard.jsx`

---

## Issue 2: Premium Price Reverting to 100 Naira ✅ FIXED

**Problem**: Admin-configured premium price would revert to 100 naira after server restart until admin settings page was refreshed.

**Root Cause**: 
- Frontend was calling `/admin/settings` endpoint without authentication
- This endpoint requires admin authentication, so it returned 401 Unauthorized
- Frontend would fail silently and keep default value of 100

**Solution**:
- Created new public endpoint: `/admin/public/settings` (read-only, no auth required)
- Updated premium payment page to use public endpoint
- Admin settings are now properly fetched on every page load

**Files Modified**:
- `server/routes/adminRoutes.js` - Added public settings endpoint
- `src/pages/event/[eventId]/premium_payment.jsx` - Updated to use public endpoint

---

## Issue 3: 401 Unauthorized Error Explained ✅ RESOLVED

**Error**: `GET https://try-unihub.onrender.com/admin/settings 401 (Unauthorized)`

**Explanation**: 
- The `/admin/settings` endpoint requires admin authentication
- Frontend was calling it without providing admin credentials
- This is expected behavior for protected admin endpoints

**Resolution**:
- Created separate public endpoint for reading settings
- Admin endpoint remains protected for security
- No more 401 errors in console

---

## Additional Fix: CORS for Announcements ✅ FIXED

**Problem**: CORS errors when fetching announcements from `/user/announcements`

**Solution**:
- Enhanced global CORS middleware in `server/index.js`
- Added explicit OPTIONS handler for announcements route
- Added CORS headers in announcements controller response

**Files Modified**:
- `server/index.js`
- `server/routes/userDashboardRoutes.js`
- `server/controllers/userDashboard.js`

---

## Testing Checklist

### Live Events Display
- [ ] Create event for 3 minutes in the future
- [ ] Verify it shows in "Upcoming" section, NOT "Live Now"
- [ ] Wait until event start time
- [ ] Verify it moves to "Live Now" section
- [ ] Wait until event end time
- [ ] Verify it disappears from dashboard (only visible in library for participants)

### Premium Pricing
- [ ] Set premium price in admin settings (e.g., 500 naira)
- [ ] Restart server
- [ ] Go to any event's premium payment page
- [ ] Verify price shows as 500 naira (not 100)
- [ ] No 401 errors in console

### Announcements
- [ ] Load dashboard
- [ ] Check browser console
- [ ] Verify no CORS errors for `/user/announcements`

---

## Deployment Notes

All fixes are backward compatible and require no database migrations. Simply deploy the updated code.
