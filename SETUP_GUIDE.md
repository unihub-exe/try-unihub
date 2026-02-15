# Setup Guide - Fixing Remaining Issues

## 1. MongoDB Migration - Fix Event Visibility

### Problem
Events created without a `visibility` field won't show on user dashboards because the query filters by `visibility: { $ne: "private" }`.

### Solution: Run MongoDB Migration

#### Option A: Using MongoDB Compass (GUI)
1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to your MongoDB database using your connection string
3. Navigate to your database → `events` collection
4. Click "Aggregations" tab
5. Add this pipeline:
   ```json
   [
     {
       "$match": {
         "visibility": { "$exists": false }
       }
     },
     {
       "$set": {
         "visibility": "public"
       }
     },
     {
       "$merge": {
         "into": "events",
         "whenMatched": "merge"
       }
     }
   ]
   ```
6. Click "Run"

#### Option B: Using MongoDB Shell
1. Connect to your MongoDB:
   ```bash
   mongosh "your-connection-string"
   ```

2. Switch to your database:
   ```javascript
   use your_database_name
   ```

3. Run the update:
   ```javascript
   db.events.updateMany(
     { visibility: { $exists: false } },
     { $set: { visibility: "public" } }
   )
   ```

4. Verify the update:
   ```javascript
   db.events.find({ visibility: "public" }).count()
   ```

#### Option C: Using Node.js Script
Create a file `fix-visibility.js` in your server folder:

```javascript
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { Event } = require("./models/event");

async function fixVisibility() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await Event.updateMany(
            { visibility: { $exists: false } },
            { $set: { visibility: "public" } }
        );

        console.log(`Updated ${result.modifiedCount} events`);
        
        // Verify
        const publicEvents = await Event.countDocuments({ visibility: "public" });
        console.log(`Total public events: ${publicEvents}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixVisibility();
```

Run it:
```bash
cd server
node fix-visibility.js
```

---

## 2. Cloudinary Configuration - Fix Image Persistence

### Problem
Images work on the device that uploaded them but disappear on other devices, suggesting temporary storage or configuration issues.

### Solution: Configure Cloudinary Upload Preset

#### Step 1: Log into Cloudinary Dashboard
1. Go to https://cloudinary.com/console
2. Log in with your account

#### Step 2: Check Upload Preset
1. Click "Settings" (gear icon) in the top right
2. Go to "Upload" tab
3. Scroll down to "Upload presets"
4. Find the preset you're using (check your `.env` file for `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`)

#### Step 3: Configure Preset for Permanent Storage
Click "Edit" on your preset and ensure these settings:

**General Settings:**
- Signing Mode: `Unsigned` ✅
- Folder: `unihub-events` (or your preferred folder name)
- Use filename: `Yes` (optional)
- Unique filename: `Yes` (recommended)

**Upload Manipulations:**
- No transformations needed for upload

**Access Control:**
- Resource type: `Image`
- Type: `Upload` (NOT `Private`)
- Access mode: `Public` ✅

**Advanced:**
- Invalidate: `No`
- Overwrite: `No`
- Auto tagging: (optional)

**IMPORTANT - Check these:**
- ❌ NO expiration settings
- ❌ NO temporary folder
- ❌ NO signed URLs
- ✅ Access mode MUST be "Public"

#### Step 4: Verify Current Images
1. Go to "Media Library" in Cloudinary dashboard
2. Check if your event images are there
3. Look at the folder structure - images should be in your designated folder, NOT in `/temp/`
4. Click on an image and check the URL - it should look like:
   ```
   https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/unihub-events/abc123.jpg
   ```
   NOT like:
   ```
   https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/temp/abc123.jpg
   ```

#### Step 5: Test Upload
1. Create a test event with an image
2. Check Cloudinary Media Library - image should appear in your folder
3. Copy the image URL
4. Open it in an incognito window
5. Open it on a different device
6. Wait 1 hour and check again

If images still disappear, check:
- Account storage limits (free tier has limits)
- Account status (suspended accounts lose images)
- Billing status

---

## 3. Server Crashes Fixed

### Issues Fixed:
1. ✅ **Scheduler crash** - Added try-catch blocks to prevent cron job failures from crashing server
2. ✅ **Paystack API error** - Added better error handling for undefined responses

### What Was Changed:
- `server/scheduler.js` - Wrapped all reminder logic in try-catch blocks
- `server/controllers/paymentController.js` - Improved Paystack error handling

### Verify Fix:
Check your Render logs - you should no longer see:
```
TypeError: Cannot read properties of undefined (reading 'status')
```

---

## 4. CORS Issues - Server Status Check

### The CORS configuration is correct, but you might be experiencing:

#### Issue 1: Server Cold Start (Render Free Tier)
**Symptom:** First request fails, subsequent requests work

**Solution:**
1. Visit https://try-unihub.onrender.com directly
2. Wait 30-60 seconds for server to wake up
3. Try your wallet verification again

**Permanent Fix:** Upgrade to Render paid tier to prevent sleeping

#### Issue 2: Server Not Responding
**Check Server Status:**
1. Go to https://dashboard.render.com
2. Find your service
3. Check "Events" tab for errors
4. Check "Logs" tab for crash logs

**Common Issues:**
- Out of memory
- Build failed
- Environment variables missing
- Database connection failed

#### Issue 3: Wrong Origin
**Verify Frontend URL:**
1. Check what URL your frontend is actually deployed on
2. Compare with allowed origins in `server/index.js`:
   ```javascript
   const allowedOrigins = [
       "http://localhost:3000",
       "http://localhost:3001",
       "https://try-unihub.vercel.app",
       "https://unihub-test.vercel.app"
   ];
   ```
3. If your frontend is on a different URL, add it to the list

---

## 5. Environment Variables Checklist

### Frontend (.env)
```bash
NEXT_PUBLIC_API_URL=https://try-unihub.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
```

### Backend (server/.env)
```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
CLIENT_URL=https://try-unihub.vercel.app
PORT=5001
NODE_ENV=production
```

---

## 6. Testing Checklist

After completing the above steps:

### Test Event Visibility:
- [ ] Create a new event as a user
- [ ] Check if it appears on user dashboard
- [ ] Check if it appears on admin dashboard
- [ ] Verify visibility field in database

### Test Image Persistence:
- [ ] Upload event image
- [ ] Check image loads immediately
- [ ] Open image URL in incognito window
- [ ] Open image URL on different device
- [ ] Wait 1 hour and check again
- [ ] Check Cloudinary Media Library

### Test Premium Payment:
- [ ] Go to event management
- [ ] Click "Upgrade to Premium"
- [ ] Select number of days
- [ ] Complete payment
- [ ] Verify event shows in Premium Picks
- [ ] Check premium expiry date

### Test Wallet (Organizers):
- [ ] Check wallet balance
- [ ] Try withdrawal (if balance > ₦1000)
- [ ] Check transaction history

### Test Announcements:
- [ ] Create announcement with email checked
- [ ] Verify users receive both email and notification
- [ ] Create announcement with email unchecked
- [ ] Verify users only receive notification

---

## 7. Common Issues & Solutions

### "Events still not showing"
- Run the MongoDB migration again
- Check database directly - do events have `visibility: "public"`?
- Check browser console for errors
- Clear browser cache

### "Images still disappearing"
- Check Cloudinary account status
- Verify upload preset is "Unsigned" and "Public"
- Check if images are in temp folder
- Contact Cloudinary support if account issue

### "CORS errors persist"
- Wake up Render server (visit URL directly)
- Check Render logs for actual errors
- Verify frontend URL matches allowed origins
- Try adding `origin: true` temporarily for debugging

### "Premium payment not working"
- Check Paystack API keys in server/.env
- Check browser console for errors
- Verify admin settings has premium price set
- Check server logs for payment verification errors

---

## 8. Need More Help?

### Check Logs:
- **Frontend:** Browser console (F12)
- **Backend:** Render dashboard → Your service → Logs tab
- **Database:** MongoDB Atlas → Clusters → Metrics

### Debug Mode:
Add this to your server to see more details:
```javascript
// In server/index.js
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});
```

### Contact Support:
- Render: https://render.com/docs/support
- Cloudinary: https://support.cloudinary.com
- MongoDB: https://www.mongodb.com/support

